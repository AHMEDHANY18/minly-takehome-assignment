// src/repositories/user.repository.ts
import { MediaType } from "@prisma/client";
import { prisma } from "../config/prisma";

export type OAuthProvider = "cognito" | "google" | "password";

type Identity = { provider: OAuthProvider; providerId: string };
type UserCreateData = Parameters<typeof prisma.user.create>[0]["data"];
function uniqIdentities(list: Identity[]) {
  const map = new Map<string, Identity>();
  for (const x of list) {
    if (!x?.provider || !x?.providerId) continue;
    const key = `${x.provider}:${x.providerId}`;
    map.set(key, x);
  }
  return [...map.values()];
}

function isPrismaUniqueError(err: any) {
  // PrismaClientKnownRequestError with code P2002 (unique constraint)
  return Boolean(err && typeof err === "object" && err.code === "P2002");
}

export const UserRepository = {
  // ------------------------
  // Basic User operations
  // ------------------------
  findById(userId: string) {
    return prisma.user.findUnique({ where: { id: userId } });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  create(data: UserCreateData) {
    return prisma.user.create({ data });
  },

  updateUser(
    userId: string,
    data: Partial<{
      name: string;
      email: string;
      avatarUrl: string | null;
    }>
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      },
    });
  },

  // ------------------------
  // OAuthAccount (Identity linking)
  // ------------------------
  findOAuthAccount(provider: OAuthProvider, providerId: string) {
    // يعتمد على وجود @@unique([provider, providerId]) في schema
    return prisma.oAuthAccount.findUnique({
      where: { provider_providerId: { provider, providerId } },
      include: { user: true },
    });
  },

  /**
   * ✅ Safe linker that respects BOTH unique constraints:
   * 1) @@unique([provider, providerId])
   * 2) @@unique([userId, provider])
   *
   * Behavior:
   * - If the identity (provider+providerId) exists:
   *    - if linked to another user => throw (prevent account takeover)
   *    - else return it
   * - Else if user already has this provider (userId+provider):
   *    - update providerId
   * - Else create
   */
  async linkOAuthAccount(userId: string, provider: OAuthProvider, providerId: string) {
    return prisma.$transaction(async (tx) => {
      // 1) identity exists?
      const byIdentity = await tx.oAuthAccount.findUnique({
        where: { provider_providerId: { provider, providerId } },
      });

      if (byIdentity) {
        if (byIdentity.userId !== userId) {
          throw new Error("OAuth identity already linked to another user");
        }
        return byIdentity;
      }

      // 2) user already has this provider?
      const byUserProvider = await tx.oAuthAccount.findUnique({
        where: { userId_provider: { userId, provider } },
      });

      if (byUserProvider) {
        return tx.oAuthAccount.update({
          where: { id: byUserProvider.id },
          data: { providerId },
        });
      }

      // 3) create new
      return tx.oAuthAccount.create({
        data: { userId, provider, providerId },
      });
    });
  },

  /**
   * ✅ get-or-create + link identities
   *
   * Algorithm:
   * 1) Find by identity (provider, providerId)
   * 2) Else find user by email
   * 3) Else create user
   * 4) Link identities to that user (sequentially)
   * 5) Optionally update profile (name/avatar)
   */
  async upsertOAuthUser(params: {
    email: string;
    name: string;
    avatarUrl?: string | null;
    identities: Identity[];
  }) {
    const email = params.email?.trim();
    const name = params.name?.trim();
    const avatarUrl = params.avatarUrl ?? null;

    if (!email) throw new Error("Missing email");
    if (!params.identities?.length) throw new Error("Missing identities");

    const identities = uniqIdentities(params.identities);

    // 1) try resolve user from any identity
    for (const idp of identities) {
      const acc = await this.findOAuthAccount(idp.provider, idp.providerId);
      if (acc?.user) {
        // update profile (optional)
        const updated = await prisma.user.update({
          where: { id: acc.user.id },
          data: {
            name: name || acc.user.name,
            avatarUrl,
          },
        });

        // link all identities to same user (SEQUENTIAL to avoid races)
        for (const x of identities) {
          await this.linkOAuthAccount(updated.id, x.provider, x.providerId);
        }

        return updated;
      }
    }

    // 2) try by email
    let user = await this.findByEmail(email);

    // 3) create if not found (handle concurrency on unique email)
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            email,
            name: name || email,
            avatarUrl,
          },
        });
      } catch (err: any) {
        if (isPrismaUniqueError(err)) {
          // someone created it concurrently
          user = await this.findByEmail(email);
        }
        if (!user) throw err;
      }
    } else {
      // update profile (optional)
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          avatarUrl,
        },
      });
    }

    // 4) link identities (SEQUENTIAL)
    for (const x of identities) {
      await this.linkOAuthAccount(user.id, x.provider, x.providerId);
    }

    return user;
  },

  /**
   * Get user for API requests using access token payload (sub).
   */
  async findByCognitoSub(cognitoSub: string) {
    const acc = await this.findOAuthAccount("cognito", cognitoSub);
    return acc?.user ?? null;
  },

  // ------------------------
  // Existing method unchanged
  // ------------------------
  findByIdWithMedia(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        mediaCount: true,
        totalLikesReceived: true,
        totalLikesGiven: true,
        followerCount: true,
        followingCount: true,
        createdAt: true,
        media: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            type: true,
            title: true,
            description: true,
            likesCount: true,
            createdAt: true,
          },
        },
      },
    });
  },

  async findSuggestedUsers(params: { excludeIds: string[]; limit: number }) {
    const { excludeIds, limit } = params;

    return prisma.user.findMany({
      take: limit,
      where: {
        id: { notIn: excludeIds },
        mediaCount: { gt: 0 },

      },
      orderBy: [{ followerCount: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        followerCount: true,
        followingCount: true,
        mediaCount: true,
      },
    });
  },

  findProfileHeaderById(userId: string, opts: { includeEmail: boolean }) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        ...(opts.includeEmail ? { email: true } : {}),

        mediaCount: true,
        totalLikesReceived: true,
        totalLikesGiven: true,
        followerCount: true,
        followingCount: true,
        createdAt: true,
      },
    });
  },

  listUserMedia(params: {
    userId: string;
    skip: number;
    take: number;
    type?: MediaType;
  }) {
    const { userId, skip, take, type } = params;

    return prisma.media.findMany({
      where: {
        uploaderId: userId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        url: true,
        thumbnailUrl: true,
        type: true,
        title: true,
        description: true,
        likesCount: true,
        commentCount: true,
        createdAt: true,
      },
    });
  },

  countUserMedia(params: { userId: string; type?: MediaType }) {
    const { userId, type } = params;

    return prisma.media.count({
      where: {
        uploaderId: userId,
        ...(type ? { type } : {}),
      },
    });
  },
};
