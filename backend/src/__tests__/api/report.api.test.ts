jest.mock("../../middleware/auth/requireAuth", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: "reporter-1", isAdmin: false };
    next();
  },
}));

jest.mock("../../services/report/createReport.service", () => ({
  createReportService: jest.fn(),
}));

import request from "supertest";
import app from "../../app";
import { createReportService } from "../../services/report/createReport.service";

const mockCreateReport = createReportService as jest.Mock;

describe("POST /v1/report", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 for an invalid body (bad targetType)", async () => {
    const res = await request(app)
      .post("/v1/report")
      .send({ targetType: "VIDEO", targetId: "x", reason: "SPAM" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
    expect(mockCreateReport).not.toHaveBeenCalled();
  });

  it("returns 400 when reason is missing", async () => {
    const res = await request(app)
      .post("/v1/report")
      .send({ targetType: "MEDIA", targetId: "media-1" });

    expect(res.status).toBe(400);
    expect(mockCreateReport).not.toHaveBeenCalled();
  });

  it("creates a report (201) with the contract shape", async () => {
    mockCreateReport.mockResolvedValue({
      report: { id: "report-1", status: "PENDING" },
      created: true,
    });

    const res = await request(app).post("/v1/report").send({
      targetType: "MEDIA",
      targetId: "media-1",
      reason: "SPAM",
      details: "spammy",
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      status: "success",
      data: { id: "report-1", status: "PENDING" },
    });
    expect(mockCreateReport).toHaveBeenCalledWith(
      expect.objectContaining({ reporterId: "reporter-1", targetType: "MEDIA" })
    );
  });

  it("returns 200 for a duplicate report", async () => {
    mockCreateReport.mockResolvedValue({
      report: { id: "report-1", status: "PENDING" },
      created: false,
    });

    const res = await request(app)
      .post("/v1/report")
      .send({ targetType: "MEDIA", targetId: "media-1", reason: "SPAM" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id: "report-1", status: "PENDING" });
  });
});
