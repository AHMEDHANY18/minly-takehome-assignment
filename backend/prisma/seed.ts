// prisma/seed.ts — run with: npx prisma db seed
// Idempotent: always upserts the dev admin, but skips the bulk seed when
// @seed.minly.local users already exist.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Deterministic RNG so reruns on a fresh DB produce the same data
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260610);
const randInt = (min: number, max: number) =>
  min + Math.floor(rand() * (max - min + 1));
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

function pickDistinct<T>(arr: readonly T[], count: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Handwritten data pools (no faker)
// ---------------------------------------------------------------------------
const SEED_DOMAIN = "@seed.minly.local";

const NAMES = [
  "Omar Hassan",
  "Layla Ahmed",
  "Karim Mostafa",
  "Nour Ibrahim",
  "Youssef Ali",
  "Salma Khaled",
  "Adam Tarek",
  "Farida Sami",
  "Ziad Mansour",
  "Hana Fawzy",
  "Marwan Adel",
  "Dina Sherif",
  "Tamer Lotfy",
  "Aya Ramadan",
  "Hassan Nabil",
  "Mona Gamal",
  "Sherif Anwar",
  "Rania Fathy",
  "Amr Saleh",
  "Yasmin Zaki",
];

const TAGS = ["travel", "food", "art", "nature", "tech", "music", "sport", "style"];

const TITLE_STARTS = [
  "Golden hour",
  "Weekend vibes",
  "City lights",
  "Morning ritual",
  "Hidden gem",
  "Street scenes",
  "Quiet moments",
  "Color study",
  "Late night",
  "Slow living",
];

const DESCRIPTIONS = [
  "Shot on my phone, no edits.",
  "Couldn't stop looking at this.",
  "One of those days you never forget.",
  "Found this spot by accident.",
  "Saving this memory right here.",
  "Light was unreal today.",
  "Small things, big joy.",
  "Trying something new this week.",
];

const COMMENT_TEXTS = [
  "This is amazing!",
  "Love the colors here",
  "Where is this place?",
  "Incredible shot 🔥",
  "Saved! Thanks for sharing",
  "Wow, great composition",
  "This made my day",
  "Stunning, as always",
  "Need to visit this spot",
  "So inspiring!",
];

const REPLY_TEXTS = [
  "Totally agree!",
  "Thanks so much!",
  "Same here 😄",
  "Right? It's beautiful",
  "Glad you like it!",
];

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const HASHTAG_REGEX = /#([\p{L}\d_]+)/gu;

function extractTags(text: string): string[] {
  const tags = new Set<string>();
  for (const match of text.matchAll(HASHTAG_REGEX)) {
    tags.add(match[1].toLowerCase());
  }
  return [...tags];
}

async function main() {
  // -------------------------------------------------------------------------
  // Dev admin — always upserted, even when the bulk seed is skipped
  // -------------------------------------------------------------------------
  const dev = await prisma.user.upsert({
    where: { email: "dev@minly.local" },
    update: { isAdmin: true },
    create: { email: "dev@minly.local", name: "Dev User", isAdmin: true },
  });

  await prisma.oAuthAccount.upsert({
    where: {
      provider_providerId: {
        provider: "cognito",
        providerId: "dev:dev@minly.local",
      },
    },
    update: {},
    create: {
      userId: dev.id,
      provider: "cognito",
      providerId: "dev:dev@minly.local",
    },
  });

  const existingSeedUsers = await prisma.user.count({
    where: { email: { endsWith: SEED_DOMAIN } },
  });
  if (existingSeedUsers > 0) {
    console.log(
      `Seed users already exist (${existingSeedUsers}) — dev admin refreshed, skipping bulk seed.`
    );
    return;
  }

  // -------------------------------------------------------------------------
  // 20 users + linked OAuth accounts
  // -------------------------------------------------------------------------
  const users: { id: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const email = `user${i}${SEED_DOMAIN}`;
    const user = await prisma.user.create({
      data: {
        email,
        name: NAMES[i - 1],
        avatarUrl: `https://i.pravatar.cc/300?img=${i}`,
      },
    });
    await prisma.oAuthAccount.create({
      data: {
        userId: user.id,
        provider: "cognito",
        providerId: `seed:${email}`,
      },
    });
    users.push(user);
  }

  const allUsers = [dev, ...users];

  // per-user counters — written at the very end so they ALWAYS match the rows
  const counters = new Map<
    string,
    {
      mediaCount: number;
      followerCount: number;
      followingCount: number;
      totalLikesReceived: number;
      totalLikesGiven: number;
    }
  >();
  for (const u of allUsers) {
    counters.set(u.id, {
      mediaCount: 0,
      followerCount: 0,
      followingCount: 0,
      totalLikesReceived: 0,
      totalLikesGiven: 0,
    });
  }
  const c = (id: string) => counters.get(id)!;

  // -------------------------------------------------------------------------
  // ~40 media (images) with hashtags, spread over the last 14 days
  // -------------------------------------------------------------------------
  const now = Date.now();
  const hashtagIds = new Map<string, string>();

  async function ensureHashtag(tag: string): Promise<string> {
    const cached = hashtagIds.get(tag);
    if (cached) return cached;
    const row = await prisma.hashtag.upsert({
      where: { tag },
      update: {},
      create: { tag },
    });
    hashtagIds.set(tag, row.id);
    return row.id;
  }

  const mediaRows: { id: string; uploaderId: string }[] = [];

  for (let m = 0; m < 40; m++) {
    const uploader = pick(allUsers);
    const slug = `minly-${m + 1}`;
    const tags = pickDistinct(TAGS, randInt(1, 3));
    const title = `${pick(TITLE_STARTS)} ${tags.map((t) => `#${t}`).join(" ")}`;
    const description = pick(DESCRIPTIONS);
    const createdAt = new Date(now - randInt(1, 14 * 24) * HOUR_MS);

    const media = await prisma.media.create({
      data: {
        url: `https://picsum.photos/seed/${slug}/900/1200`,
        thumbnailUrl: `https://picsum.photos/seed/${slug}/300/400`,
        type: "IMAGE",
        title,
        description,
        uploaderId: uploader.id,
        viewsCount: randInt(20, 900),
        createdAt,
      },
    });

    c(uploader.id).mediaCount += 1;
    mediaRows.push({ id: media.id, uploaderId: uploader.id });

    // sync Hashtag + MediaHashtag rows
    for (const tag of extractTags(`${title} ${description}`)) {
      const hashtagId = await ensureHashtag(tag);
      await prisma.mediaHashtag.create({
        data: { mediaId: media.id, hashtagId },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Follows — each seed user follows dev + 2..7 others; dev follows a few
  // -------------------------------------------------------------------------
  const followPairs = new Set<string>();

  async function follow(followerId: string, followingId: string) {
    if (followerId === followingId) return;
    const key = `${followerId}:${followingId}`;
    if (followPairs.has(key)) return;
    followPairs.add(key);

    await prisma.follower.create({ data: { followerId, followingId } });
    c(followerId).followingCount += 1;
    c(followingId).followerCount += 1;
  }

  for (const user of users) {
    await follow(user.id, dev.id); // everyone follows the dev admin
    const targets = pickDistinct(
      users.filter((u) => u.id !== user.id),
      randInt(2, 7)
    );
    for (const target of targets) {
      await follow(user.id, target.id);
    }
  }
  for (const target of pickDistinct(users, randInt(5, 8))) {
    await follow(dev.id, target.id);
  }

  // -------------------------------------------------------------------------
  // Likes — likesCount / totalLikesReceived / totalLikesGiven kept consistent
  // -------------------------------------------------------------------------
  const mediaLikesCount = new Map<string, number>();

  for (const media of mediaRows) {
    const likers = pickDistinct(allUsers, randInt(0, 10));
    for (const liker of likers) {
      await prisma.like.create({
        data: { userId: liker.id, mediaId: media.id },
      });
      c(liker.id).totalLikesGiven += 1;
      c(media.uploaderId).totalLikesReceived += 1;
    }
    mediaLikesCount.set(media.id, likers.length);
  }

  // -------------------------------------------------------------------------
  // Comments — 2..5 top-level per media, some replies (commentCount = all rows)
  // -------------------------------------------------------------------------
  const mediaCommentCount = new Map<string, number>();

  for (const media of mediaRows) {
    let count = 0;
    const topLevel = randInt(2, 5);

    for (let i = 0; i < topLevel; i++) {
      const comment = await prisma.threadedComment.create({
        data: {
          userId: pick(allUsers).id,
          mediaId: media.id,
          text: pick(COMMENT_TEXTS),
        },
      });
      count += 1;

      if (rand() < 0.3) {
        await prisma.threadedComment.create({
          data: {
            userId: pick(allUsers).id,
            mediaId: media.id,
            text: pick(REPLY_TEXTS),
            parentCommentId: comment.id,
          },
        });
        count += 1;
      }
    }

    mediaCommentCount.set(media.id, count);
  }

  // -------------------------------------------------------------------------
  // Bookmarks — a few random unique (user, media) pairs
  // -------------------------------------------------------------------------
  const bookmarkPairs = new Set<string>();
  for (let i = 0; i < 15; i++) {
    const user = pick(allUsers);
    const media = pick(mediaRows);
    const key = `${user.id}:${media.id}`;
    if (bookmarkPairs.has(key)) continue;
    bookmarkPairs.add(key);
    await prisma.bookmark.create({
      data: { userId: user.id, mediaId: media.id },
    });
  }

  // -------------------------------------------------------------------------
  // Stories — 6..8 active stories across users (incl. dev)
  // -------------------------------------------------------------------------
  const storyCount = randInt(6, 8);
  for (let i = 0; i < storyCount; i++) {
    const owner = i === 0 ? dev : pick(allUsers);
    const createdAt = new Date(now - randInt(0, 20) * HOUR_MS);
    await prisma.story.create({
      data: {
        userId: owner.id,
        url: `https://picsum.photos/seed/story-${i + 1}/720/1280`,
        type: "IMAGE",
        createdAt,
        expiresAt: new Date(createdAt.getTime() + DAY_MS),
      },
    });
  }

  // -------------------------------------------------------------------------
  // 3 sample PENDING reports (2 media + 1 comment)
  // -------------------------------------------------------------------------
  const reportedMedia = pickDistinct(mediaRows, 2);
  for (const media of reportedMedia) {
    await prisma.report.create({
      data: {
        reporterId: pick(users).id,
        targetType: "MEDIA",
        targetId: media.id,
        reason: pick(["SPAM", "INAPPROPRIATE", "OTHER"] as const),
        details: "Seeded report for admin review testing",
      },
    });
  }

  const someComment = await prisma.threadedComment.findFirst({
    select: { id: true },
  });
  if (someComment) {
    await prisma.report.create({
      data: {
        reporterId: pick(users).id,
        targetType: "COMMENT",
        targetId: someComment.id,
        reason: "ABUSE",
        details: "Seeded comment report",
      },
    });
  }

  // -------------------------------------------------------------------------
  // Write back ALL counter columns so they match the created rows
  // -------------------------------------------------------------------------
  for (const media of mediaRows) {
    await prisma.media.update({
      where: { id: media.id },
      data: {
        likesCount: mediaLikesCount.get(media.id) ?? 0,
        commentCount: mediaCommentCount.get(media.id) ?? 0,
      },
    });
  }

  for (const [userId, value] of counters) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mediaCount: value.mediaCount,
        followerCount: value.followerCount,
        followingCount: value.followingCount,
        totalLikesReceived: value.totalLikesReceived,
        totalLikesGiven: value.totalLikesGiven,
      },
    });
  }

  console.log(
    `Seed complete: ${allUsers.length} users, ${mediaRows.length} media, ` +
      `${followPairs.size} follows, ${storyCount} stories, 3 reports.`
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
