// @ts-nocheck
import { verifyUserLoginStatusGoogle } from "../../../src/middlewares/verifyUserLoginGoogle.middleware.js";
import { getAllActiveSessionOfUser } from "../../../src/db/getActiveSession.js";
import { updateActiveTime } from "../../../src/db/updateActiveTime.js";
import { deleteActiveSessionByToken } from "../../../src/db/deleteActiveSession.js";
import axios from "axios";
import jwt from "jsonwebtoken";

jest.mock("../../../src/db/getActiveSession.js", () => ({
  getAllActiveSessionOfUser: jest.fn(),
}));
jest.mock("../../../src/db/updateActiveTime.js", () => ({
  updateActiveTime: jest.fn(),
}));
jest.mock("../../../src/db/deleteActiveSession.js", () => ({
  deleteActiveSessionByToken: jest.fn(),
}));
jest.mock("axios");
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

describe("verifyUserLoginStatusGoogle Middleware — hardened tests", () => {
  let req, res, next;
  const googleBase = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=";

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      cookies: {},
      body: { access_token: "valid-access-token" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    // Ensure env secret is available for jwt.verify assertions
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  });

  // utility to assert response call order (status before json)
  const expectStatusThenJson = () => {
    const statusOrder = res.status.mock.invocationCallOrder[0];
    const jsonOrder = res.json.mock.invocationCallOrder[0];
    expect(statusOrder).toBeLessThan(jsonOrder);
  };

  test("Missing access_token → exact 400 response, no axios call, next not called", async () => {
    req.body = {}; // remove access_token

    await verifyUserLoginStatusGoogle(req, res, next);

    expect(axios.get).not.toHaveBeenCalled();
    expect(getAllActiveSessionOfUser).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "access token is required",
    });

    expectStatusThenJson();
    expect(next).not.toHaveBeenCalled();
  });

  test("Google returns no data → exact 504 response and axios called with exact URL", async () => {
    axios.get.mockResolvedValue({}); // no data

    await verifyUserLoginStatusGoogle(req, res, next);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(`${googleBase}${req.body.access_token}`);

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Unable to get details from google ouauth",
    });

    expectStatusThenJson();
    expect(next).not.toHaveBeenCalled();
    expect(getAllActiveSessionOfUser).not.toHaveBeenCalled();
  });

  test("getAllActiveSessionOfUser returns null → exact 503 response", async () => {
    axios.get.mockResolvedValue({ data: { email: "TEST@Example.COM" } });
    getAllActiveSessionOfUser.mockResolvedValue(null);

    await verifyUserLoginStatusGoogle(req, res, next);

    expect(axios.get).toHaveBeenCalledWith(`${googleBase}${req.body.access_token}`);
    expect(getAllActiveSessionOfUser).toHaveBeenCalledTimes(1);
    // called with lowercased email per middleware
    expect(getAllActiveSessionOfUser).toHaveBeenCalledWith("test@example.com");

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error while getting active session count",
    });

    expectStatusThenJson();
    expect(next).not.toHaveBeenCalled();
  });

  test("Expired session → jwt.verify throws → deleteActiveSessionByToken called with token and next()", async () => {
    axios.get.mockResolvedValue({ data: { email: "user@example.com" } });
    getAllActiveSessionOfUser.mockResolvedValue([{ token: "expiredToken" }]);

    jwt.verify.mockImplementation(() => {
      throw new Error("jwt expired");
    });
    deleteActiveSessionByToken.mockResolvedValue(true);

    await verifyUserLoginStatusGoogle(req, res, next);

    // verify jwt.verify was attempted with the expired token and secret
    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(jwt.verify).toHaveBeenCalledWith("expiredToken", process.env.JWT_SECRET);

    expect(deleteActiveSessionByToken).toHaveBeenCalledTimes(1);
    expect(deleteActiveSessionByToken).toHaveBeenCalledWith("expiredToken");

    // next() should be called since expired session removed and no cookie
    expect(next).toHaveBeenCalledTimes(1);

    // No status/json in this path
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("No cookie token + activeSessions < 5 → next(), jwt.verify called for each session", async () => {
    axios.get.mockResolvedValue({ data: { email: "user@example.com" } });
    const sessions = [{ token: "t1" }, { token: "t2" }];
    getAllActiveSessionOfUser.mockResolvedValue(sessions);

    // make jwt.verify succeed for both
    jwt.verify.mockReturnValue(true);

    await verifyUserLoginStatusGoogle(req, res, next);

    expect(getAllActiveSessionOfUser).toHaveBeenCalledWith("user@example.com");

    // jwt.verify called for each token
    expect(jwt.verify).toHaveBeenCalledTimes(sessions.length);
    for (let i = 0; i < sessions.length; i++) {
      expect(jwt.verify).toHaveBeenCalledWith(sessions[i].token, process.env.JWT_SECRET);
    }

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("No cookie token + activeSessions >= 5 → exact 409 response and no next", async () => {
    axios.get.mockResolvedValue({ data: { email: "user@example.com" } });
    getAllActiveSessionOfUser.mockResolvedValue([
      { token: "1" }, { token: "2" }, { token: "3" }, { token: "4" }, { token: "5" }
    ]);
    jwt.verify.mockReturnValue(true);

    await verifyUserLoginStatusGoogle(req, res, next);

    expect(getAllActiveSessionOfUser).toHaveBeenCalledWith("user@example.com");
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message:
        "You have reached your limit of 5 active sessions. Please close one of your active sessions to continue.",
    });

    expectStatusThenJson();
    expect(next).not.toHaveBeenCalled();
  });

  test("Cookie token matches active session → updateActiveTime called and exact 200 response", async () => {
    req.cookies.token = "liveToken";
    axios.get.mockResolvedValue({ data: { email: "user@example.com" } });
    getAllActiveSessionOfUser.mockResolvedValue([{ token: "liveToken" }]);

    jwt.verify.mockReturnValue(true);
    updateActiveTime.mockResolvedValue(true);

    await verifyUserLoginStatusGoogle(req, res, next);

    expect(getAllActiveSessionOfUser).toHaveBeenCalledWith("user@example.com");

    // ensure we attempted jwt.verify for session(s)
    expect(jwt.verify).toHaveBeenCalledWith("liveToken", process.env.JWT_SECRET);

    expect(updateActiveTime).toHaveBeenCalledTimes(1);
    expect(updateActiveTime).toHaveBeenCalledWith("liveToken");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User is already logged in",
    });

    expectStatusThenJson();
    expect(next).not.toHaveBeenCalled();
  });

  test("Cookie token exists but not found in DB → next() (no updateActiveTime, no status/json)", async () => {
    req.cookies.token = "unknown";
    axios.get.mockResolvedValue({ data: { email: "user@example.com" } });
    getAllActiveSessionOfUser.mockResolvedValue([{ token: "other" }]);
    jwt.verify.mockReturnValue(true);

    await verifyUserLoginStatusGoogle(req, res, next);

    expect(getAllActiveSessionOfUser).toHaveBeenCalledWith("user@example.com");
    expect(updateActiveTime).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("updateActiveTime returns null → exact 503 response", async () => {
    req.cookies.token = "liveToken";
    axios.get.mockResolvedValue({ data: { email: "user@example.com" } });
    getAllActiveSessionOfUser.mockResolvedValue([{ token: "liveToken" }]);

    jwt.verify.mockReturnValue(true);
    updateActiveTime.mockResolvedValue(null);

    await verifyUserLoginStatusGoogle(req, res, next);

    expect(updateActiveTime).toHaveBeenCalledWith("liveToken");
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error while updating active session time",
    });

    expectStatusThenJson();
    expect(next).not.toHaveBeenCalled();
  });

  test("Unexpected internal error (axios throws) → exact 500 response and console.error called", async () => {
    const spyErr = jest.spyOn(console, "error").mockImplementation(() => {});
    axios.get.mockRejectedValue(new Error("Google API failure"));

    await verifyUserLoginStatusGoogle(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "error while verifying user login status",
    });

    expectStatusThenJson();
    expect(next).not.toHaveBeenCalled();

    // console.error should have been called with the error object
    expect(spyErr).toHaveBeenCalled();
    spyErr.mockRestore();
  });
});
