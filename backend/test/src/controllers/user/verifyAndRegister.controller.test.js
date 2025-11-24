import { register } from '../../../../src/controllers/user/verifyAndRegister.controller.js'; // Keep your specific import path
import { insertUser } from '../../../../src/db/insertUser.js';
import { insertActiveSession } from "../../../../src/db/insertActiveSession.js";
import { otpStore } from '../../../../src/utils/registrationOtpStore.js';
import jwt from 'jsonwebtoken';
import { UAParser } from "ua-parser-js";

// ---------------------------------------------------------
// 1. MOCKS
// ---------------------------------------------------------

// CRITICAL FIX: Explicit factory ensures `getBrowser` exists immediately upon instantiation.
// This prevents the "is not a function" error in Stryker/Mutation testing.
jest.mock("ua-parser-js", () => ({
  UAParser: jest.fn().mockImplementation(() => ({
    getBrowser: jest.fn().mockReturnValue({ name: 'Chrome' }),
    getOS: jest.fn().mockReturnValue({ name: 'Windows' }),
  })),
}));

jest.mock("../../../../src/db/insertUser.js", () => ({
  __esModule: true,
  insertUser: jest.fn(),
}));

jest.mock("../../../../src/db/insertActiveSession.js", () => ({
  __esModule: true,
  insertActiveSession: jest.fn(),
}));

jest.mock("../../../../src/utils/registrationOtpStore.js", () => ({
  __esModule: true,
  otpStore: {
    get: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

// ---------------------------------------------------------
// 2. TEST SUITE
// ---------------------------------------------------------

describe('User Registration Controller (register)', () => {
  let req, res;
  const FIXED_DATE = new Date('2025-01-01T12:00:00Z').getTime();

  beforeEach(() => {
    // Reset timers
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_DATE);
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRE = '1h';

    // Reset mocks
    jest.clearAllMocks();

    // Reset UAParser to Happy Path (Chrome/Windows) for every test by default
    // This is required because "Unknown" tests override this implementation
    UAParser.mockImplementation(() => ({
        getBrowser: jest.fn().mockReturnValue({ name: 'Chrome' }),
        getOS: jest.fn().mockReturnValue({ name: 'Windows' }),
    }));

    req = {
      headers: { 'user-agent': 'Mozilla/5.0 Test Agent' },
      body: {
        email: 'TestUser@Example.com',
        otp: '123456',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Input Validation', () => {
    it('should return 400 if email is missing', async () => {
      req.body.email = '';
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No OTP found' });
    });

    it('should return 400 if otp is missing', async () => {
      req.body.otp = '';
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No OTP found' });
    });
  });

  describe('OTP Store Logic', () => {
    it('should return 410 if no OTP record is found', async () => {
      otpStore.get.mockReturnValue(undefined);
      await register(req, res);
      expect(otpStore.get).toHaveBeenCalledWith('testuser@example.com');
      expect(res.status).toHaveBeenCalledWith(410);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'OTP Expired or invalid user' });
    });

    it('should return 410 and remove OTP if expired', async () => {
      otpStore.get.mockReturnValue({
        expiresAt: FIXED_DATE - 1000,
        attempt: 3,
        otp: '123456'
      });

      await register(req, res);

      expect(otpStore.remove).toHaveBeenCalledWith('testuser@example.com');
      expect(res.status).toHaveBeenCalledWith(410);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'OTP has been expired' });
    });

    it('should return 410 and remove OTP if attempts are <= 0', async () => {
      otpStore.get.mockReturnValue({
        expiresAt: FIXED_DATE + 5000,
        attempt: 0,
        otp: '123456'
      });

      await register(req, res);

      expect(otpStore.remove).toHaveBeenCalledWith('testuser@example.com');
      expect(res.status).toHaveBeenCalledWith(410);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'OTP has been expired' });
    });


    it('should return 400 and decrement attempt count if OTP does not match', async () => {
      const mockRecord = {
        expiresAt: FIXED_DATE + 5000,
        attempt: 3,
        otp: '999999'
      };
      otpStore.get.mockReturnValue(mockRecord);

      await register(req, res);

      expect(mockRecord.attempt).toBe(2); 
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid OTP, 2 tries left' });
    });
  });

  describe('User & Session Creation (Database)', () => {
    beforeEach(() => {
      otpStore.get.mockReturnValue({
        name: 'John Doe',
        expiresAt: FIXED_DATE + 50000,
        attempt: 3,
        otp: '123456',
        hashedPassword: 'hashed_secret'
      });
    });

    it('should return 503 if insertUser fails (returns null)', async () => {
      insertUser.mockResolvedValue(null);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error occurred during registration' });
    });
    

    it('should return 503 if insertActiveSession fails', async () => {
      insertUser.mockResolvedValue([{ id: 'user_123', email: 'testuser@example.com' }]);
      jwt.sign.mockReturnValue('mock_token');
      insertActiveSession.mockResolvedValue(false);

      await register(req, res);

      expect(otpStore.remove).toHaveBeenCalledWith('testuser@example.com');
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error while storing current session details' });
    });
  });

  describe('Happy Path & Parsing Logic', () => {
    beforeEach(() => {
      otpStore.get.mockReturnValue({
        name: 'John Doe',
        expiresAt: FIXED_DATE + 50000,
        attempt: 3,
        otp: '123456',
        hashedPassword: 'hashed_secret'
      });
      insertUser.mockResolvedValue([{ id: 'user_123', email: 'testuser@example.com' }]);
      jwt.sign.mockReturnValue('mock_jwt_token');
      insertActiveSession.mockResolvedValue(true);
    });

    it('should register successfully with valid Browser/OS detection', async () => {
      await register(req, res);
      expect(otpStore.remove).toHaveBeenCalledWith('testuser@example.com');
      expect(insertActiveSession).toHaveBeenCalledWith({
        token: 'mock_jwt_token',
        email: 'testuser@example.com',
        browser_type: 'Chrome',
        os_type: 'Windows'
      });

      expect(res.cookie).toHaveBeenCalledWith("token", "mock_jwt_token",{
        httponly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7*24*60*60*1000,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        userID: 'user_123',
        message: 'User registered successfully'
      });
    });

    it('should register user and remove OTP if OTP Expired', async () => {
      otpStore.get.mockReturnValue({
        expiresAt: FIXED_DATE,
        attempt: 3,
        otp: '123456'
      });

      await register(req, res);
      expect(otpStore.remove).toHaveBeenCalledWith('testuser@example.com');
      expect(insertActiveSession).toHaveBeenCalledWith({
        token: 'mock_jwt_token',
        email: 'testuser@example.com',
        browser_type: 'Chrome',
        os_type: 'Windows'
      });

      expect(res.cookie).toHaveBeenCalledWith("token", "mock_jwt_token",{
        httponly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7*24*60*60*1000,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        userID: 'user_123',
        message: 'User registered successfully'
      });
    });
    
    it('should fallback to "Unknown" if Browser/OS are undefined or "undefined" string', async () => {
      // Override mock implementation specifically for this test
      UAParser.mockImplementationOnce(() => ({
        getBrowser: jest.fn().mockReturnValue({ name: undefined }),
        getOS: jest.fn().mockReturnValue({ name: "undefined" }),
      }));

      await register(req, res);

      expect(insertActiveSession).toHaveBeenCalledWith(expect.objectContaining({
        browser_type: 'Unknown',
        os_type: 'Unknown'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should fallback to "Unknown" if Browser/OS objects are null', async () => {
      // Override mock to return nulls
      UAParser.mockImplementationOnce(() => ({
        getBrowser: jest.fn().mockReturnValue(null),
        getOS: jest.fn().mockReturnValue(null),
      }));
  
      await register(req, res);
  
      expect(insertActiveSession).toHaveBeenCalledWith(expect.objectContaining({
        browser_type: 'Unknown',
        os_type: 'Unknown'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Unexpected Errors', () => {
    it('should return 401 if an exception is thrown', async () => {
      const errorMsg = 'Critical Store Failure';
      otpStore.get.mockImplementation(() => {
        throw new Error(errorMsg);
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: errorMsg });
    });
  });
});