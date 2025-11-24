// @ts-nocheck
import { verifyUserLoginStatus } from "../../../src/middlewares/verifyUserLoginStatus.middleware.js";

import { getAllActiveSessionOfUser } from "../../../src/db/getActiveSession.js";
import { updateActiveTime } from "../../../src/db/updateActiveTime.js";
import { deleteActiveSessionByToken } from "../../../src/db/deleteActiveSession.js";

jest.mock("../../../src/db/getActiveSession.js", () => ({
  getAllActiveSessionOfUser: jest.fn(),
}));

jest.mock("../../../src/db/updateActiveTime.js", () => ({
  updateActiveTime: jest.fn(),
}));

jest.mock("../../../src/db/deleteActiveSession.js", () => ({
  deleteActiveSessionByToken: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

import jwt from "jsonwebtoken";

describe("verifyUserLoginStatus Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
      body: { email: "test@example.com" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------
  test("Missing email → 400", async () => {
    req.body = {}; // no email

    await verifyUserLoginStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Email is required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------
  test("No token + activeSessions < 5 → next()", async () => {
    getAllActiveSessionOfUser.mockResolvedValue([
      { token: "aaa" },
      { token: "bbb" },
    ]);

    jwt.verify.mockReturnValue(true);

    await verifyUserLoginStatus(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------------
  test("No token + activeSessions >= 5 → 409", async () => {
    getAllActiveSessionOfUser.mockResolvedValue([
      { token: "1" },
      { token: "2" },
      { token: "3" },
      { token: "4" },
      { token: "5" },
    ]);

    jwt.verify.mockReturnValue(true);

    await verifyUserLoginStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message:
        "You have reached your limit of 5 active sessions. Please close one of your active sessions to continue.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------
  test("Expired session token → should call deleteActiveSessionByToken", async () => {
    getAllActiveSessionOfUser.mockResolvedValue([
      { token: "expiredToken" },
    ]);

    jwt.verify.mockImplementation(() => {
      throw new Error("expired");
    });

    deleteActiveSessionByToken.mockResolvedValue(true);

    await verifyUserLoginStatus(req, res, next);

    expect(deleteActiveSessionByToken).toHaveBeenCalledWith("expiredToken");
    expect(next).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------
  test("Token exists + matches activeSession → updateActiveTime + return 200", async () => {
    req.cookies.token = "liveToken";

    getAllActiveSessionOfUser.mockResolvedValue([
      { token: "liveToken" },
    ]);

    jwt.verify.mockReturnValue(true);
    updateActiveTime.mockResolvedValue(true);

    await verifyUserLoginStatus(req, res, next);

    expect(updateActiveTime).toHaveBeenCalledWith("liveToken");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User is already logged in",
    });
  });

  // ---------------------------------------------------------------------
  test("Token exists but not found in DB → next()", async () => {
    req.cookies.token = "unknown";

    getAllActiveSessionOfUser.mockResolvedValue([{ token: "zzz" }]);
    jwt.verify.mockReturnValue(true);

    await verifyUserLoginStatus(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------
  test("getAllActiveSessionOfUser returns null → 503", async () => {
    getAllActiveSessionOfUser.mockResolvedValue(null);

    await verifyUserLoginStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error while getting active session count",
    });
  });

  // ---------------------------------------------------------------------
  test("updateActiveTime returns null → 503", async () => {
    req.cookies.token = "liveToken";

    getAllActiveSessionOfUser.mockResolvedValue([{ token: "liveToken" }]);
    jwt.verify.mockReturnValue(true);
    updateActiveTime.mockResolvedValue(null);

    await verifyUserLoginStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error while updating active session time",
    });
  });

  // ---------------------------------------------------------------------
  test("Middleware throws error → 500", async () => {
    getAllActiveSessionOfUser.mockRejectedValue(new Error("DB error"));

    await verifyUserLoginStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "error while verifying user login status",
    });
  });
});
