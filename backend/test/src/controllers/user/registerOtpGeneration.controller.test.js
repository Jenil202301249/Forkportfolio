import { registerOtpGeneration } from '../../../../src/controllers/user/registerOtpGeneration.controller.js';
import { searchUserByEmail } from '../../../../src/db/findUser.js';
import { checkUserSyntax } from '../../../../src/utils/checkUserSyntax.js';
import { getOtpEmailTemplate } from '../../../../src/utils/mailOtpTemplate.js';
import { sendMail } from '../../../../src/utils/nodemailer.js';
import { otpStore } from '../../../../src/utils/registrationOtpStore.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// ---------------------------------------------------------
// 1. MOCK LOCAL DEPENDENCIES
// ---------------------------------------------------------

jest.mock("../../../../src/utils/checkUserSyntax.js", () => ({
  __esModule: true,
  checkUserSyntax: jest.fn(),
}));

jest.mock("../../../../src/utils/mailOtpTemplate.js", () => ({
  __esModule: true,
  getOtpEmailTemplate: jest.fn(),
}));

jest.mock("../../../../src/utils/nodemailer.js", () => ({
  __esModule: true,
  sendMail: jest.fn(),
}));

jest.mock("../../../../src/db/findUser.js", () => ({
  __esModule: true,
  searchUserByEmail: jest.fn(),
}));

jest.mock("../../../../src/utils/registrationOtpStore.js", () => ({
  __esModule: true,
  otpStore: {
    add: jest.fn(),
  },
}));

// ---------------------------------------------------------
// 2. MOCK EXTERNAL LIBRARIES
// ---------------------------------------------------------

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomInt: jest.fn(),
}));

// ---------------------------------------------------------
// 3. TEST SUITE
// ---------------------------------------------------------

describe('registerOtpGeneration Controller', () => {
  let req, res;
  const FIXED_DATE = new Date('2025-11-18T12:00:00Z');

  beforeEach(() => {
    // 1. Freeze time
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_DATE);

    req = {
      body: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Clear calls to mocks before every test
    jest.clearAllMocks();
  }); // <--- CRITICAL FIX: Ensure this closing bracket exists here

  afterEach(() => {
    // 2. Restore time after every test
    jest.useRealTimers();
  });

  describe('Happy paths', () => {
    it('should successfully generate OTP and send email when all inputs are valid', async () => {
      // Setup Success Mocks
      searchUserByEmail.mockResolvedValue([]); // Empty array = User does not exist
      checkUserSyntax.mockReturnValue({ success: true });
      bcrypt.hash.mockResolvedValue('hashedPassword');
      crypto.randomInt.mockReturnValue(123456);
      getOtpEmailTemplate.mockReturnValue('<html>OTP Email Template</html>');
      sendMail.mockResolvedValue(true);

      // Execute
      await registerOtpGeneration(req, res);

      // Calculate expected expiry based on frozen time
      const expectedExpiry = FIXED_DATE.getTime() + (5 * 60 * 1000);

      // Assert
      expect(searchUserByEmail).toHaveBeenCalledWith('john.doe@example.com');
      expect(checkUserSyntax).toHaveBeenCalledWith(req.body);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      
      expect(otpStore.add).toHaveBeenCalledWith(
        'john.doe@example.com', 
        {
           name: 'John Doe',
           hashedPassword: 'hashedPassword',
           otp: "123456", // Matches string format from your logs
           expiresAt: expectedExpiry, 
           attempt: 3
        }
      );

      expect(getOtpEmailTemplate).toHaveBeenCalledWith(
        '123456', 
        expect.stringContaining('complete your registration'), 
        expect.stringContaining('5 minutes')
      );
      
      expect(sendMail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Edge cases', () => {
    it('should return 400 if any of the required fields are missing', async () => {
      req.body = { name: '', email: '', password: '' };

      await registerOtpGeneration(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Missing Details' });
    });

    it('should return 400 if any of the required fields are missing', async () => {
      req.body.name = null;

      await registerOtpGeneration(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Missing Details' });
    });

    it('should return 400 if any of the required fields are missing', async () => {
      req.body.email = null;

      await registerOtpGeneration(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Missing Details' });
    });

    it('should return 400 if any of the required fields are missing', async () => {
      req.body.password = null;

      await registerOtpGeneration(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Missing Details' });
    });

    it('should return 503 if database error occurs', async () => {
      searchUserByEmail.mockResolvedValue(null); 

      await registerOtpGeneration(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error occurred.' });
    });

    it('should return 409 if user already exists', async () => {
      searchUserByEmail.mockResolvedValue([{ id: 1, email: 'john.doe@example.com' }]);

      await registerOtpGeneration(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User Already exists' });
    });

    it('should return 422 if user syntax is invalid', async () => {
      searchUserByEmail.mockResolvedValue([]); 
      checkUserSyntax.mockReturnValue({ success: false, message: 'Invalid syntax' });

      await registerOtpGeneration(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid user details Format' });
    });

    it('should return 502 if email sending fails', async () => {
      searchUserByEmail.mockResolvedValue([]);
      checkUserSyntax.mockReturnValue({ success: true });
      bcrypt.hash.mockResolvedValue('hashedPassword');
      crypto.randomInt.mockReturnValue(123456);
      sendMail.mockResolvedValue(false);

      await registerOtpGeneration(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to send OTP email.' });
    });

    it('should return 401 if an unexpected error occurs', async () => {
      const errorMessage = 'Unexpected error';
      searchUserByEmail.mockRejectedValue(new Error(errorMessage));

      await registerOtpGeneration(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: errorMessage });
    });
  });
});