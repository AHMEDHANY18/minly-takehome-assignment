jest.mock("../repositories/report.repository", () => ({
  ReportRepository: {
    targetExists: jest.fn(),
    findExisting: jest.fn(),
    create: jest.fn(),
  },
}));

import { createReportService } from "../services/report/createReport.service";
import { ReportRepository } from "../repositories/report.repository";

const mockTargetExists = ReportRepository.targetExists as jest.Mock;
const mockFindExisting = ReportRepository.findExisting as jest.Mock;
const mockCreate = ReportRepository.create as jest.Mock;

const params = {
  reporterId: "user-1",
  targetType: "MEDIA" as const,
  targetId: "media-1",
  reason: "SPAM" as const,
};

describe("createReportService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTargetExists.mockResolvedValue(true);
  });

  it("throws 404 when the target does not exist", async () => {
    mockTargetExists.mockResolvedValue(false);

    await expect(createReportService(params)).rejects.toMatchObject({
      status: 404,
    });

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns the existing report on duplicate (created: false)", async () => {
    const existing = { id: "report-1", status: "PENDING" };
    mockFindExisting.mockResolvedValue(existing);

    const result = await createReportService(params);

    expect(result).toEqual({ report: existing, created: false });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a new report when none exists (created: true)", async () => {
    mockFindExisting.mockResolvedValue(null);
    const created = { id: "report-2", status: "PENDING" };
    mockCreate.mockResolvedValue(created);

    const result = await createReportService({ ...params, details: "bad" });

    expect(result).toEqual({ report: created, created: true });
    expect(mockCreate).toHaveBeenCalledWith({
      reporterId: "user-1",
      targetType: "MEDIA",
      targetId: "media-1",
      reason: "SPAM",
      details: "bad",
    });
  });
});
