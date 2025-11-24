import { loginUser } from "../../../../src/controllers/user/login.controller.js";
import * as findUser from "../../../../src/db/findUser.js";
import * as syntax from "../../../../src/utils/checkUserSyntax.js";
import * as insertActive from "../../../../src/db/insertActiveSession.js";
import * as alertModel from "../../../../src/mongoModels/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

jest.mock("../../../../src/db/findUser.js", () => ({
  searchUserByEmail: jest.fn(),
}));

jest.mock("../../../../src/utils/checkUserSyntax.js", () => ({
  checkEmailSyntax: jest.fn(),
}));

jest.mock("../../../../src/db/insertActiveSession.js", () => ({
  insertActiveSession: jest.fn(),
}));

jest.mock("../../../../src/mongoModels/user.model.js", () => ({
  addSecurityAlert: jest.fn(),
}));

// Keep bcrypt and jwt as mocks but accessible
jest.mock("bcrypt", () => {
  const compare = jest.fn();
  return { default: { compare }, compare };
});

jest.mock("jsonwebtoken", () => {
  const sign = jest.fn();
  return { default: { sign }, sign };
});

// Default UAParser mock: returns Chrome/Windows; individual tests can override
jest.mock("ua-parser-js", () => {
  const UAParser = jest.fn().mockImplementation(() => ({
    getBrowser: jest.fn(() => ({ name: "Chrome" })),
    getOS: jest.fn(() => ({ name: "Windows" })),
  }));
  return { UAParser, default: UAParser };
});

describe("login.controller.js", () => {
  let req;
  let res;
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, JWT_SECRET: "test-secret", JWT_EXPIRE: "7d" };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };

    req = {
      headers: { "user-agent": "Mozilla/5.0" },
      body: {},
    };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  // --- missing fields ---
  it("returns 400 (exact JSON) when both email and password are missing", async () => {
    req.body = {}; // both missing

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Please provide email and password",
    });
    expect(findUser.searchUserByEmail).not.toHaveBeenCalled();
  });

  it("returns 400 (exact JSON) when only email is missing", async () => {
    req.body = { password: "secret" };

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Please provide email and password",
    });
    expect(findUser.searchUserByEmail).not.toHaveBeenCalled();
  });

  it("returns 400 (exact JSON) when only password is missing", async () => {
    req.body = { email: "user@example.com" };

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Please provide email and password",
    });
    expect(findUser.searchUserByEmail).not.toHaveBeenCalled();
  });

  // --- invalid email syntax ---
  it("returns 422 with exact message when email syntax invalid", async () => {
    req.body = { email: "bad-email", password: "x" };
    syntax.checkEmailSyntax.mockReturnValue({ success: false, message: "Invalid email format" });

    await loginUser(req, res);

    expect(syntax.checkEmailSyntax).toHaveBeenCalledWith("bad-email");
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email format",
    });
    expect(findUser.searchUserByEmail).not.toHaveBeenCalled();
  });

  // --- DB returns null ---
  it("returns 503 when searchUserByEmail returns null (DB error)", async () => {
    req.body = { email: "user@example.com", password: "x" };
    syntax.checkEmailSyntax.mockReturnValue({ success: true });
    findUser.searchUserByEmail.mockResolvedValue(null);

    await loginUser(req, res);

    expect(findUser.searchUserByEmail).toHaveBeenCalledWith("user@example.com");
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error occured while getting user info",
    });
  });

  // --- user not registered ---
  it("returns 410 when user is not registered (empty array)", async () => {
    req.body = { email: "user@example.com", password: "x" };
    syntax.checkEmailSyntax.mockReturnValue({ success: true });
    findUser.searchUserByEmail.mockResolvedValue([]);

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User is not registered",
    });
  });

  // --- google-registered user ---
  it("returns 401 when registrationmethod is google", async () => {
    req.body = { email: "user@example.com", password: "x" };
    syntax.checkEmailSyntax.mockReturnValue({ success: true });
    findUser.searchUserByEmail.mockResolvedValue([{ registrationmethod: "google" }]);

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Please login using google",
    });
  });

  // --- wrong password ---
  it("returns 400 (Invalid user credentials) when bcrypt.compare is false", async () => {
    req.body = { email: "user@example.com", password: "wrongpass" };
    syntax.checkEmailSyntax.mockReturnValue({ success: true });
    findUser.searchUserByEmail.mockResolvedValue([
      { id: "10", email: "user@example.com", password: "hashed", registrationmethod: "normal" },
    ]);

    bcrypt.compare.mockResolvedValue(false);

    await loginUser(req, res);

    expect(bcrypt.compare).toHaveBeenCalledWith("wrongpass", "hashed");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid user credentials",
    });
  });

  // --- insertActiveSession null and empty checks ---
  it("returns 503 when insertActiveSession returns null", async () => {
    req.body = { email: "user@example.com", password: "right" };
    syntax.checkEmailSyntax.mockReturnValue({ success: true });
    findUser.searchUserByEmail.mockResolvedValue([
      { id: "10", email: "user@example.com", password: "hashed", registrationmethod: "normal" },
    ]);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("jwt-token");
    insertActive.insertActiveSession.mockResolvedValue(null);

    await loginUser(req, res);

    expect(jwt.sign).toHaveBeenCalledWith(
      { user: "10", email: "user@example.com" },
      "test-secret",
      { expiresIn: "7d" }
    );

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error while storing current session details",
    });
  });

  it("returns 410 when insertActiveSession returns empty array", async () => {
    req.body = { email: "user@example.com", password: "right" };
    syntax.checkEmailSyntax.mockReturnValue({ success: true });
    findUser.searchUserByEmail.mockResolvedValue([
      { id: "10", email: "user@example.com", password: "hashed", registrationmethod: "normal" },
    ]);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("jwt-token");
    insertActive.insertActiveSession.mockResolvedValue([]); // empty result

    await loginUser(req, res);

    expect(jwt.sign).toHaveBeenCalledWith(
      { user: "10", email: "user@example.com" },
      "test-secret",
      { expiresIn: "7d" }
    );

    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error while storing current session details",
    });
  });

  // --- success: ensure jwt payload/options and cookie options and addSecurityAlert called ---
  it("logs in successfully: validates jwt payload, jwt options, cookie options and addSecurityAlert call", async () => {
    req.body = { email: "user@example.com", password: "right" };
    // default UAParser mock returns Chrome/Windows as configured above
    syntax.checkEmailSyntax.mockReturnValue({ success: true });
    findUser.searchUserByEmail.mockResolvedValue([
      { id: "10", email: "user@example.com", password: "hashed", registrationmethod: "normal" },
    ]);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("jwt-token-value");
    insertActive.insertActiveSession.mockResolvedValue([1]);
    alertModel.addSecurityAlert.mockResolvedValue(true);

    await loginUser(req, res);

    // jwt.sign called with exact payload and options
    expect(jwt.sign).toHaveBeenCalledWith(
      { user: "10", email: "user@example.com" },
      "test-secret",
      { expiresIn: "7d" }
    );

    // addSecurityAlert called with expected email and object that contains correct fields
    expect(alertModel.addSecurityAlert).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        type: "Login",
        message: "new device logged in",
        token: "jwt-token-value",
        // os_type and browser_type are set from UAParser default mock
        os_type: "Windows",
        browser_type: "Chrome",
      })
    );

    // cookie options verified strictly
    expect(res.cookie).toHaveBeenCalledTimes(1);
    const cookieCall = res.cookie.mock.calls[0]; // [name, token, options]
    expect(cookieCall[0]).toBe("token");
    expect(cookieCall[1]).toBe("jwt-token-value");
    expect(cookieCall[2]).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User logged in successfully",
    });
  });

  // --- "Unknown" browser/os behavior (simulate UAParser returning undefined names) ---
  it('uses "Unknown" when UAParser returns undefined names', async () => {
    // override UAParser for this test
    const UAParser = require("ua-parser-js").UAParser;
    UAParser.mockImplementationOnce(() => ({
      getBrowser: () => ({ name: undefined }),
      getOS: () => ({ name: undefined }),
    }));

    req.body = { email: "user@example.com", password: "right" };
    syntax.checkEmailSyntax.mockReturnValue({ success: true });
    findUser.searchUserByEmail.mockResolvedValue([
      { id: "10", email: "user@example.com", password: "hashed", registrationmethod: "normal" },
    ]);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("jwt-token-value-2");
    insertActive.insertActiveSession.mockResolvedValue([1]);
    alertModel.addSecurityAlert.mockResolvedValue(true);

    await loginUser(req, res);

    // ensure insertActiveSession got Unknown values
    expect(insertActive.insertActiveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "jwt-token-value-2",
        email: "user@example.com",
        browser_type: "Unknown",
        os_type: "Unknown",
      })
    );

    // ensure addSecurityAlert receives Unknowns too
    expect(alertModel.addSecurityAlert).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        browser_type: "Unknown",
        os_type: "Unknown",
        token: "jwt-token-value-2",
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  // --- catch block: simulate thrown error ---
  it("returns 500 and message on unexpected exception", async () => {
    req.body = { email: "user@example.com", password: "x" };
    syntax.checkEmailSyntax.mockReturnValue({ success: true });
    findUser.searchUserByEmail.mockRejectedValue(new Error("boom"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await loginUser(req, res);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "failed to login, please try again",
    });
  });
});
