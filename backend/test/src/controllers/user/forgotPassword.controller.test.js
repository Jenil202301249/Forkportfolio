// tests/forgotPassword.controller.spec.js
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UAParser } from 'ua-parser-js'; // (not used in tests but kept for parity)
import { SendForgotPasswordOtp, VerifyOtp, setNewPassword } from '../../../../src/controllers/user/forgotPassword.controller.js';

import { searchUserByEmail } from '../../../../src/db/findUser.js';
import { updatePassword } from '../../../../src/db/updatePassword.js';
import { deleteActiveSessionByEmail } from '../../../../src/db/deleteActiveSession.js';
import { insertActiveSession } from '../../../../src/db/insertActiveSession.js';
import { addSecurityAlert } from '../../../../src/mongoModels/user.model.js';

import { checkEmailSyntax, checkPasswordSyntax } from '../../../../src/utils/checkUserSyntax.js';
import { getOtpEmailTemplate } from '../../../../src/utils/mailOtpTemplate.js';
import { sendMail } from '../../../../src/utils/nodemailer.js';
import { otpStore } from '../../../../src/utils/registrationOtpStore.js';
import { success } from 'zod';

jest.mock('../../../../src/utils/mailOtpTemplate.js', () => ({
  __esModule: true,
  getOtpEmailTemplate: jest.fn(),
}));
jest.mock('../../../../src/db/findUser.js');
jest.mock('../../../../src/db/updatePassword.js');
jest.mock('../../../../src/utils/nodemailer.js');
jest.mock('../../../../src/utils/checkUserSyntax.js');
jest.mock('../../../../src/utils/registrationOtpStore.js');
jest.mock('../../../../src/db/deleteActiveSession.js');
jest.mock('../../../../src/db/insertActiveSession.js');
jest.mock('../../../../src/mongoModels/user.model.js');
jest.mock('crypto');
jest.mock('jsonwebtoken');
jest.mock('bcrypt');

beforeEach(() => {
  jest.resetAllMocks();
  // ensure otpStore methods exist for tests
  if (!otpStore.get) otpStore.get = jest.fn();
  if (!otpStore.add) otpStore.add = jest.fn();
  if (!otpStore.remove) otpStore.remove = jest.fn();
});

/* =========================
   Tests for SendForgotPasswordOtp
   ========================= */
describe('SendForgotPasswordOtp()', () => {
  let req, res;

  beforeEach(() => {
    req = { body: { email: 'test@example.com' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should send OTP successfully when email is valid and user exists', async () => {
    checkEmailSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ registrationmethod: 'email' }]);
    crypto.randomInt.mockReturnValue(123456);
    getOtpEmailTemplate.mockReturnValue('<html>OTP Template</html>');
    sendMail.mockResolvedValue(true);

    await SendForgotPasswordOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'OTP sent to your email address. Please check your inbox.',
    });
    expect(otpStore.add).toHaveBeenCalledWith('test@example.com', expect.any(Object));
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'test@example.com' }));
  });

  it('should return 400 if email is not provided', async () => {
    req.body.email = undefined;

    await SendForgotPasswordOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Email is required.',
    });
  });

  it('should return 422 if email syntax is invalid', async () => {
    checkEmailSyntax.mockReturnValue({ success: false, message: 'Invalid email syntax.' });

    await SendForgotPasswordOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid email syntax.',
    });
  });

  it('should return 503 if database error occurs while getting user info', async () => {
    checkEmailSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue(null);

    await SendForgotPasswordOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Database error occured while getting user info. Please try again later',
    });
  });

  it('should return 410 if user is not found', async () => {
    checkEmailSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([]);

    await SendForgotPasswordOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not found with this email address.',
    });
  });

  it('should return 401 if user is authenticated via Google', async () => {
    checkEmailSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ registrationmethod: 'google' }]);

    await SendForgotPasswordOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Google authenticated users can't use forgot password feature.",
    });
  });

  it('should return 500 if sending mail fails', async () => {
    checkEmailSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ registrationmethod: 'email' }]);
    crypto.randomInt.mockReturnValue(123456);
    getOtpEmailTemplate.mockReturnValue('<html>OTP Template</html>');
    sendMail.mockRejectedValue(new Error('Mail server error'));

    await SendForgotPasswordOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to send OTP. Please try again.',
    });
  });
});

/* =========================
   Tests for VerifyOtp
   ========================= */
describe('VerifyOtp()', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        otp: '123456',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should verify OTP successfully and extend expiration', async () => {
    const otpData = {
      otp: '123456',
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempt: 3,
      validated: false,
    };
    otpStore.get.mockReturnValue(otpData);

    await VerifyOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
    });
    expect(otpStore.add).toHaveBeenCalledWith('test@example.com', expect.objectContaining({
      otp: '123456',
      attempt: 3,
      validated: true,
      expiresAt: expect.any(Number),
    }));
  });

 it('should return 410 if password update fails', async () => {
  req = {
    headers: { 'user-agent': 'Mozilla/5.0' },
    body: { email: 'test@example.com', newPassword: 'NewPassword123!' }
  };
  checkPasswordSyntax.mockReturnValue({ success: true });
  searchUserByEmail.mockResolvedValue([{ id: 1, email: 'test@example.com' }]);
  otpStore.get.mockReturnValue({ validated: true });
  bcrypt.hash.mockResolvedValue('hashedPassword');
  updatePassword.mockResolvedValue([]);

  await setNewPassword(req, res);

  expect(res.status).toHaveBeenCalledWith(410);
  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: 'Failed to reset password. Please try again.'
  });
});


  it('should return 400 if email or OTP is missing', async () => {
    req.body = { email: '', otp: '' };

    await VerifyOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Email and OTP are required.',
    });
  });

  it('should return 410 if OTP is expired or invalid', async () => {
    otpStore.get.mockReturnValue(null);

    await VerifyOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'OTP expired or invalid. Please request a new one.',
    });
  });

  it('should return 410 if OTP is already verified', async () => {
    const otpData = {
      otp: '123456',
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempt: 3,
      validated: true,
    };
    otpStore.get.mockReturnValue(otpData);

    await VerifyOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'OTP already verified. You can now reset your password.',
    });
  });

  it('should return 410 if OTP has expired', async () => {
    const otpData = {
      otp: '123456',
      expiresAt: Date.now() - 1,
      attempt: 3,
      validated: false,
    };
    otpStore.get.mockReturnValue(otpData);

    await VerifyOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'OTP has expired. Please request a new one.',
    });
    expect(otpStore.remove).toHaveBeenCalledWith('test@example.com');
  });

  it('should return 401 if OTP is invalid and decrement attempts', async () => {
    const otpData = {
      otp: '654321',
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempt: 3,
      validated: false,
    };
    otpStore.get.mockReturnValue(otpData);

    await VerifyOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid OTP.2 attempts left.',
    });
    // ensure get was called
    expect(otpStore.get).toHaveBeenCalledWith('test@example.com');
  });

  it('should handle unexpected errors gracefully', async () => {
    otpStore.get.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    await VerifyOtp(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to Verify OTP. Please try again.',
    });
  });
});

/* =========================
   Tests for setNewPassword
   ========================= */
describe('setNewPassword()', () => {
  let req, res;

  beforeEach(() => {
    req = {
      headers: { 'user-agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
      body: { email: 'test@example.com', newPassword: 'NewPassword123!' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn().mockReturnThis()
    };
  });

  it('should reset password successfully when all conditions are met', async () => {
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'test@example.com' }]);

    checkPasswordSyntax.mockReturnValue({ success: true });
    otpStore.get.mockReturnValue({ validated: true });
    bcrypt.hash.mockResolvedValue('hashedPassword');
    updatePassword.mockResolvedValue([{ email: 'test@example.com' }]);
    deleteActiveSessionByEmail.mockResolvedValue(true);
    jwt.sign.mockReturnValue('jwtToken');
    insertActiveSession.mockResolvedValue([{ token: 'jwtToken' }]);
    addSecurityAlert.mockResolvedValue(true);

    await setNewPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Password reset successfully' });
    expect(res.cookie).toHaveBeenCalledWith('token', 'jwtToken', expect.any(Object));
  });

  it('should reset password successfully when all conditions are met', async () => {
    req.headers = { 'user-agent': null }
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'test@example.com' }]);

    checkPasswordSyntax.mockReturnValue({ success: true });
    otpStore.get.mockReturnValue({ validated: true });
    bcrypt.hash.mockResolvedValue('hashedPassword');
    updatePassword.mockResolvedValue([{ email: 'test@example.com' }]);
    deleteActiveSessionByEmail.mockResolvedValue(true);
    jwt.sign.mockReturnValue('jwtToken');
    insertActiveSession.mockResolvedValue([{ token: 'jwtToken' }]);
    addSecurityAlert.mockResolvedValue(true);

    await setNewPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Password reset successfully' });
    expect(res.cookie).toHaveBeenCalledWith('token', 'jwtToken', expect.any(Object));
  });

  it('should return 400 if email or newPassword is missing', async () => {
    req.body = { email: '', newPassword: '' };

    await setNewPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Email and new password are required.' });
  });

  it('should return 422 if password syntax is invalid', async () => {
    checkPasswordSyntax.mockReturnValue({ success: false, message: 'Invalid password syntax' });

    await setNewPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid password syntax' });
  });

  it('should return 503 if user search fails', async () => {
    searchUserByEmail.mockResolvedValue(null);
    checkPasswordSyntax.mockReturnValue({ success: true });

    await setNewPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error occured while getting user info. Please try again later' });
  });

  it('should return 401 if user is not found', async () => {
    searchUserByEmail.mockResolvedValue([]);
    checkPasswordSyntax.mockReturnValue({ success: true });
    await setNewPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found.' });
  });

  it('should return 410 if OTP session is expired or invalid', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'test@example.com' }]);
    otpStore.get.mockReturnValue(null);

    await setNewPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Password reset session expired or invalid. Please request a new one.',
    });
   });

  it('should return 401 if OTP is not verified', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'test@example.com' }]);
    otpStore.get.mockReturnValue({ validated: false });

    await setNewPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'OTP not verified. Please verify OTP before resetting password.'
    });
  });


  it('should return 503 if session deletion fails', async () => {
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'test@example.com' }]);
    checkPasswordSyntax.mockReturnValue({ success: true });
    otpStore.get.mockReturnValue({ validated: true });
    bcrypt.hash.mockResolvedValue('hashedPassword');
    updatePassword.mockResolvedValue([{ email: 'test@example.com' }]);
    deleteActiveSessionByEmail.mockResolvedValue(false);

    await setNewPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error occured while deleting session. Please try again later' });
  });

  it('should return 503 if session insertion fails', async () => {
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'test@example.com' }]);
    checkPasswordSyntax.mockReturnValue({ success: true });
    otpStore.get.mockReturnValue({ validated: true });
    bcrypt.hash.mockResolvedValue('hashedPassword');
    updatePassword.mockResolvedValue([{ email: 'test@example.com' }]);
    deleteActiveSessionByEmail.mockResolvedValue(true);
    jwt.sign.mockReturnValue('jwtToken');
    insertActiveSession.mockResolvedValue(false);

    await setNewPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error while storing current session details' });
  });

  it('should return 410 if session insertion returns empty array', async () => {
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'test@example.com' }]);
    checkPasswordSyntax.mockReturnValue({ success: true });
    otpStore.get.mockReturnValue({ validated: true });
    bcrypt.hash.mockResolvedValue('hashedPassword');
    updatePassword.mockResolvedValue([{ email: 'test@example.com' }]);
    deleteActiveSessionByEmail.mockResolvedValue(true);
    jwt.sign.mockReturnValue('jwtToken');
    insertActiveSession.mockResolvedValue([]);

    await setNewPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error while storing current session details' });
  });

  it('should return 500 if an unexpected error occurs', async () => {
    searchUserByEmail.mockRejectedValue(new Error('Unexpected error'));
    checkPasswordSyntax.mockReturnValue({ success: true });
    await setNewPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to reset password. Please try again.' });
  });
});
