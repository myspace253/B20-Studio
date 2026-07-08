import { beforeEach, describe, expect, it, vi } from "vitest";

const connectMock = vi.fn();
const closeMock = vi.fn();
const dbMock = vi.fn(() => ({ command: vi.fn() }));

vi.mock("mongodb", () => ({
  MongoClient: vi.fn().mockImplementation(function MockMongoClient() {
    return {
      connect: connectMock,
      close: closeMock,
      db: dbMock,
    };
  }),
  ServerApiVersion: { v1: "1" },
}));

describe("mongodb helper", () => {
  beforeEach(() => {
    vi.resetModules();
    connectMock.mockReset();
    closeMock.mockReset();
    dbMock.mockReset();
    connectMock.mockResolvedValue({});
    dbMock.mockReturnValue({ command: vi.fn() });
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
  });

  it("does not connect until a database operation is requested", async () => {
    const { connectToMongoDB } = await import("./mongodb");

    expect(connectMock).not.toHaveBeenCalled();

    await connectToMongoDB();

    expect(connectMock).toHaveBeenCalledTimes(1);
  });
});
