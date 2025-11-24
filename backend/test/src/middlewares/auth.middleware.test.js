import { verifyToken } from '../../../src/middlewares/auth.middleware.js'; // Fixed Path (3 levels up)
import { searchUserByEmail } from "../../../src/db/findUser.js"; // Fixed Path
import { getActiveSessionByToken } from "../../../src/db/getActiveSession.js"; // Fixed Path
import { updateActiveTime } from "../../../src/db/updateActiveTime.js"; // Fixed Path
import jwt from "jsonwebtoken";

// ---------------------------------------------------------
// 1. MOCKS
// ---------------------------------------------------------

jest.mock("../../../src/db/findUser.js", () => ({
  __esModule: true,
  searchUserByEmail: jest.fn(),
}));

jest.mock("../../../src/db/getActiveSession.js", () => ({
  __esModule: true,
  getActiveSessionByToken: jest.fn(),
}));

jest.mock("../../../src/db/updateActiveTime.js", () => ({
  __esModule: true,
  updateActiveTime: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

// ---------------------------------------------------------
// 2. TEST SUITE
// ---------------------------------------------------------

describe('Auth Middleware: verifyToken', () => {
  let req, res, next;
  const MOCK_TOKEN = "valid_mock_token";
  const MOCK_SECRET = "test_secret";

  beforeEach(() => {
    process.env.JWT_SECRET = MOCK_SECRET;

    req = {
      cookies: {
        token: MOCK_TOKEN
      },
      user: undefined,        // Ensure clean state
      activeSession: undefined // Ensure clean state
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(), // Important for chaining
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('Initial Checks', () => {
    it('should return 401 if token is missing from cookies', async () => {
      req.cookies = {}; // No token

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Unauthorized request" });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if cookies object is undefined', async () => {
      req.cookies = undefined;

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Unauthorized request" });
    });
  });

  describe('Session Validation (getActiveSessionByToken)', () => {
    it('should return 503 if database error occurs fetching session (returns null/undefined)', async () => {
      getActiveSessionByToken.mockResolvedValue(null); // Simulate DB error/connection failure

      await verifyToken(req, res, next);

      expect(getActiveSessionByToken).toHaveBeenCalledWith(MOCK_TOKEN);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false, 
        message: "Database error while verifying token" 
      });
    });

    it('should return 401 and clear cookie if session is valid but empty (length 0)', async () => {
      // Returns array but empty, implying session logged out or invalid
      getActiveSessionByToken.mockResolvedValue([]); 

      await verifyToken(req, res, next);

      expect(res.clearCookie).toHaveBeenCalledWith("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "unauthorized request" });
    });
  });

  describe('JWT Verification', () => {
    beforeEach(() => {
      // Assume session exists for these tests
      getActiveSessionByToken.mockResolvedValue([{ browser_type: 'Chrome', os_type: 'Windows' }]);
    });

    it('should return 401 if JWT throws TokenExpiredError', async () => {
      const expiredError = new Error("jwt expired");
      expiredError.name = "TokenExpiredError";
      jwt.verify.mockImplementation(() => { throw expiredError; });

      await verifyToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(MOCK_TOKEN, MOCK_SECRET);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Token expired" });
    });

    it('should return 401 for any other JWT error (e.g. invalid signature)', async () => {
      const otherError = new Error("invalid signature");
      jwt.verify.mockImplementation(() => { throw otherError; });

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "error verifying token" });
    });
  });

  describe('User Validation (searchUserByEmail)', () => {
    beforeEach(() => {
      getActiveSessionByToken.mockResolvedValue([{ browser_type: 'Chrome', os_type: 'Windows' }]);
      jwt.verify.mockReturnValue({ email: "test@example.com" });
    });

    it('should return 503 if database error occurs fetching user (returns null)', async () => {
      searchUserByEmail.mockResolvedValue(null);

      await verifyToken(req, res, next);

      expect(searchUserByEmail).toHaveBeenCalledWith("test@example.com");
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false, 
        message: "Database error while verifying token" 
      });
    });

    it('should return 410 and clear cookie if user not found (empty array)', async () => {
      searchUserByEmail.mockResolvedValue([]);

      await verifyToken(req, res, next);

      expect(res.clearCookie).toHaveBeenCalledWith("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });
      expect(res.status).toHaveBeenCalledWith(410);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "invalid token" });
    });
  });

  describe('Happy Path', () => {
    beforeEach(() => {
      // Setup all mocks for success
      getActiveSessionByToken.mockResolvedValue([{ 
        browser_type: 'Chrome', 
        os_type: 'Windows' 
      }]);
      jwt.verify.mockReturnValue({ email: "test@example.com" });
      searchUserByEmail.mockResolvedValue([{ 
        id: 1, 
        name: "John Doe", 
        email: "test@example.com",
        registrationmethod: "email",
        profileimage: "img.jpg",
        investmentexperience: "none",
        riskprofile: "low",
        theme: "dark",
        aisuggestion: true,
        financialgoals: "rich",
        investmenthorizon: "long",
        dashboardlayout: "default"
      }]);
      updateActiveTime.mockResolvedValue(true);
    });

    it('should successfully attach user and session to request and call next()', async () => {
      await verifyToken(req, res, next);

      // 1. Check Active Time Update
      expect(updateActiveTime).toHaveBeenCalledWith(MOCK_TOKEN);

      // 2. Check req.user population (Mutation protection: ensure all fields map)
      expect(req.user).toEqual({
        id: 1,
        name: "John Doe",
        email: "test@example.com",
        registrationmethod: "email",
        profileimage: "img.jpg",
        investmentexperience: "none",
        riskprofile: "low",
        theme: "dark",
        aisuggestion: true,
        financialgoals: "rich",
        investmenthorizon: "long",
        dashboardlayout: "default"
      });

      // 3. Check req.activeSession population
      expect(req.activeSession).toEqual({
        browserType: "Chrome",
        osType: "Windows"
      });

      // 4. Check flow
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled(); // Should not send response on success
    });
  });
  
  describe('Unexpected Errors', () => {
    it('should catch unexpected errors inside try block (e.g. updateActiveTime throws)', async () => {
        // Setup successful flow until updateActiveTime
        getActiveSessionByToken.mockResolvedValue([{ browser_type: 'Chrome' }]);
        jwt.verify.mockReturnValue({ email: "test@example.com" });
        searchUserByEmail.mockResolvedValue([{ id: 1 }]);
        
        // Force unexpected error
        const dbError = new Error("DB Connection Dead");
        updateActiveTime.mockRejectedValue(dbError);
  
        await verifyToken(req, res, next);
  
        // Should fall to the generic catch block
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: "error verifying token" });
      });
  });
});