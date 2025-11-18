import { prisma } from "../config/prisma";
import { registerService } from "../services/auth";

jest.mock("../config/prisma"); // important

describe("Register Service", () => {
  it("should throw error if email already exists", async () => {
    // mock DB response
    (prisma.user.findUnique as any).mockResolvedValue({ id: "123" });

    await expect(
      registerService("Ahmed", "test@example.com", "123456")
    ).rejects.toThrow("Email already exists");
  });

  it("should create new user", async () => {
    // mock empty
    (prisma.user.findUnique as any).mockResolvedValue(null);

    // mock created user
    (prisma.user.create as any).mockResolvedValue({
      id: "1",
      name: "Ahmed",
      email: "test@example.com",
      passwordHash: "hashedPass",
      avatarUrl: null,
      mediaCount: 0,
      totalLikesGiven: 0,
      totalLikesReceived: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const result = await registerService("Ahmed", "test@example.com", "123456");

    expect(result.user.email).toBe("test@example.com");
    expect(result.token).toBeDefined();
  });
});
