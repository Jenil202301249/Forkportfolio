// tests/resetPassword.controller.spec.js
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UAParser } from 'ua-parser-js';
import { SendResetPasswordOtp, VerifyOtp, setNewPassword } from '../../../../src/controllers/user/resetPassword.controller.js';

import { searchUserByEmail } from '../../../../src/db/findUser.js';
import { updatePassword } from '../../../../src/db/updatePassword.js';
import { deleteActiveSessionByEmail } from '../../../../src/db/deleteActiveSession.js';
import { insertActiveSession } from '../../../../src/db/insertActiveSession.js';
import { addSecurityAlert } from '../../../../src/mongoModels/user.model.js';

import { checkPasswordSyntax } from '../../../../src/utils/checkUserSyntax.js';
import { getOtpEmailTemplate } from '../../../../src/utils/mailOtpTemplate.js';
import { sendMail } from '../../../../src/utils/nodemailer.js';
import { otpStore } from '../../../../src/utils/registrationOtpStore.js';

jest.mock('../../../../src/db/findUser.js');
jest.mock('../../../../src/db/updatePassword.js');
jest.mock('../../../../src/db/deleteActiveSession.js');
jest.mock('../../../../src/db/insertActiveSession.js');
jest.mock('../../../../src/mongoModels/user.model.js');
jest.mock('../../../../src/utils/checkUserSyntax.js');
jest.mock('../../../../src/utils/mailOtpTemplate.js', () => ({ __esModule: true, getOtpEmailTemplate: jest.fn() }));
jest.mock('../../../../src/utils/nodemailer.js');
jest.mock('../../../../src/utils/registrationOtpStore.js');
jest.mock('crypto');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

beforeEach(() => {
  jest.resetAllMocks();
  if (!otpStore.get) otpStore.get = jest.fn();
  if (!otpStore.add) otpStore.add = jest.fn();
  if (!otpStore.remove) otpStore.remove = jest.fn();
});

/* SendResetPasswordOtp tests */
describe('SendResetPasswordOtp()', () => {
  let req, res;
  beforeEach(() => {
    req = { body: { password: 'oldpass', newPassword: 'NewPass123!' }, user: { email: 'u@test.com' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('returns 400 when password missing', async () => {
    req.body.password = undefined;
    await SendResetPasswordOtp(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'password is required.' });
  });

  it('returns 422 when new password syntax invalid', async () => {
    checkPasswordSyntax.mockReturnValue({ success: false, message: 'bad' });
    await SendResetPasswordOtp(req, res);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'bad' });
  });

  it('returns 503 when DB error on search', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue(null);
    await SendResetPasswordOtp(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error occured while getting user info. Please try again later' });
  });

  it('returns 410 when user not found', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([]);
    await SendResetPasswordOtp(req, res);
    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found with this email address.' });
  });

  it("returns 401 when user's registrationmethod is google", async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ registrationmethod: 'google' }]);
    await SendResetPasswordOtp(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Google authenticated users can't reset their password." });
  });

  it('returns 401 when current password does not match', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ registrationmethod: 'email', password: 'hashed' }]);
    bcrypt.compare.mockResolvedValue(false);
    await SendResetPasswordOtp(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "password doesn't match." });
  });

  it('returns 500 when sendMail fails', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ registrationmethod: 'email', password: 'hashed' }]);
    bcrypt.compare.mockResolvedValue(true);
    crypto.randomInt.mockReturnValue(123456);
    getOtpEmailTemplate.mockReturnValue('<html/>');
    sendMail.mockRejectedValue(new Error('SMTP'));
    await SendResetPasswordOtp(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to send OTP. Please try again.' });
  });

  it('sends OTP successfully', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ registrationmethod: 'email', password: 'hashed' }]);
    bcrypt.compare.mockResolvedValue(true);
    crypto.randomInt.mockReturnValue(123456);
    getOtpEmailTemplate.mockReturnValue('<html/>');
    sendMail.mockResolvedValue(true);
    await SendResetPasswordOtp(req, res);
    expect(otpStore.add).toHaveBeenCalledWith('u@test.com', expect.objectContaining({ otp: '123456' }));
    expect(sendMail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'OTP sent to your email address. Please check your inbox.' });
  });
});

/* VerifyOtp tests */
describe('VerifyOtp()', () => {
  let req, res;
  beforeEach(() => {
    req = { body: { otp: '111111' }, user: { email: 'u@test.com' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('returns 400 when otp missing', async () => {
    req.body.otp = undefined;
    await VerifyOtp(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'OTP is required.' });
  });

  it('returns 410 when otp session missing', async () => {
    otpStore.get.mockReturnValue(null);
    await VerifyOtp(req, res);
    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'OTP expired or invalid. Please request a new one.' });
  });

  it('returns 410 when otp already validated', async () => {
    otpStore.get.mockReturnValue({ validated: true });
    await VerifyOtp(req, res);
    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'OTP already verified. You can now reset your password.' });
  });

  it('returns 410 when otp expired', async () => {
    const otpData = { otp: '111111', expiresAt: Date.now() - 1000, attempt: 3, validated: false };
    otpStore.get.mockReturnValue(otpData);
    await VerifyOtp(req, res);
    expect(otpStore.remove).toHaveBeenCalledWith('u@test.com');
    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'OTP has expired. Please request a new one.' });
  });

  it('returns 401 when otp invalid and decrements attempts', async () => {
    const otpData = { otp: '222222', expiresAt: Date.now() + 10000, attempt: 3, validated: false };
    otpStore.get.mockReturnValue(otpData);
    await VerifyOtp(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid OTP.2 attempts left.' });
  });

  it('verifies otp successfully', async () => {
    const otpData = { otp: '111111', expiresAt: Date.now() + 10000, attempt: 3, validated: false };
    otpStore.get.mockReturnValue(otpData);
    await VerifyOtp(req, res);
    expect(otpStore.add).toHaveBeenCalledWith('u@test.com', expect.objectContaining({ validated: true }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'OTP verified successfully. You can now reset your password.' });
  });

  it('handles unexpected errors', async () => {
    otpStore.get.mockImplementation(() => { throw new Error('boom'); });
    await VerifyOtp(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to Verify OTP. Please try again.' });
  });
});

/* setNewPassword tests */
describe('setNewPassword()', () => {
  let req, res;
  beforeEach(() => {
    req = { headers: { 'user-agent': 'UA' }, body: { newPassword: 'NewPass123!' }, user: { email: 'u@test.com' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn(), cookie: jest.fn().mockReturnThis() };
  });

  it('returns 400 when newPassword missing', async () => {
    req.body.newPassword = undefined;
    await setNewPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Email and new password are required.' });
  });

  it('returns 422 when password syntax invalid', async () => {
    checkPasswordSyntax.mockReturnValue({ success: false, message: 'bad' });
    await setNewPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'bad' });
  });

  it('returns 410 when user not found', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([]);
    await setNewPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found.' });
  });

  it('returns 410 when otp session missing', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'u@test.com' }]);
    otpStore.get.mockReturnValue(null);
    await setNewPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Password reset session expired or invalid. Please request a new one.' });
  });

  it('returns 410 when otp not validated', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'u@test.com' }]);
    otpStore.get.mockReturnValue({ validated: false });
    await setNewPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'OTP not verified. Please verify OTP before resetting password.' });
  });

  it('returns 410 when updatePassword returns empty', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'u@test.com' }]);
    otpStore.get.mockReturnValue({ validated: true });
    bcrypt.hash.mockResolvedValue('hpass');
    updatePassword.mockResolvedValue([]);
    await setNewPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to reset password. Please try again.' });
  });

  it('returns 503 when deleteActiveSession fails', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'u@test.com' }]);
    otpStore.get.mockReturnValue({ validated: true });
    bcrypt.hash.mockResolvedValue('hpass');
    updatePassword.mockResolvedValue([{ email: 'u@test.com' }]);
    deleteActiveSessionByEmail.mockResolvedValue(false);
    await setNewPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error occured while deleting session. Please try again later' });
  });

  it('returns 503 when insertActiveSession fails', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'u@test.com' }]);
    otpStore.get.mockReturnValue({ validated: true });
    bcrypt.hash.mockResolvedValue('hpass');
    updatePassword.mockResolvedValue([{ email: 'u@test.com' }]);
    deleteActiveSessionByEmail.mockResolvedValue(true);
    jwt.sign.mockReturnValue('tkn');
    insertActiveSession.mockResolvedValue(false);
    await setNewPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error while storing current session details' });
  });

  it('resets password successfully', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'u@test.com' }]);
    otpStore.get.mockReturnValue({ validated: true });
    bcrypt.hash.mockResolvedValue('hpass');
    updatePassword.mockResolvedValue([{ email: 'u@test.com' }]);
    deleteActiveSessionByEmail.mockResolvedValue(true);
    jwt.sign.mockReturnValue('tkn');
    insertActiveSession.mockResolvedValue([{ token: 'tkn' }]);
    addSecurityAlert.mockResolvedValue(true);
    await setNewPassword(req, res);
    expect(bcrypt.hash).toHaveBeenCalledWith('NewPass123!', 10);
    expect(updatePassword).toHaveBeenCalledWith('u@test.com', 'hpass');
    expect(insertActiveSession).toHaveBeenCalledWith(expect.objectContaining({ token: 'tkn', email: 'u@test.com' }));
    expect(res.cookie).toHaveBeenCalledWith('token', 'tkn', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Password reset successfully.' });
  });

  it('resets password successfully', async () => {
    req.headers = {  'user-agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"  }
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'u@test.com' }]);
    otpStore.get.mockReturnValue({ validated: true });
    bcrypt.hash.mockResolvedValue('hpass');
    updatePassword.mockResolvedValue([{ email: 'u@test.com' }]);
    deleteActiveSessionByEmail.mockResolvedValue(true);
    jwt.sign.mockReturnValue('tkn');
    insertActiveSession.mockResolvedValue([{ token: 'tkn' }]);
    addSecurityAlert.mockResolvedValue(true);
    await setNewPassword(req, res);
    expect(bcrypt.hash).toHaveBeenCalledWith('NewPass123!', 10);
    expect(updatePassword).toHaveBeenCalledWith('u@test.com', 'hpass');
    expect(insertActiveSession).toHaveBeenCalledWith(expect.objectContaining({ token: 'tkn', email: 'u@test.com' }));
    expect(res.cookie).toHaveBeenCalledWith('token', 'tkn', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Password reset successfully.' });
  });

  it('handles unexpected errors', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockRejectedValue(new Error('boom'));
    await setNewPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to reset password. Please try again.' });
  });

  it('returns 410 when addActiveSessionStatus returns empty array', async () => {
    checkPasswordSyntax.mockReturnValue({ success: true });
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'u@test.com' }]);
    otpStore.get.mockReturnValue({ validated: true });
    bcrypt.hash.mockResolvedValue('hashedPass');
    updatePassword.mockResolvedValue([{ email: 'u@test.com' }]);
    deleteActiveSessionByEmail.mockResolvedValue(true);
    jwt.sign.mockReturnValue('jwtToken');

    insertActiveSession.mockResolvedValue([]);  // IMPORTANT

    const req = {
        headers: { 'user-agent': 'UA' },
        body: { newPassword: 'NewPass123!' },
        user: { email: 'u@test.com' }
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn().mockReturnThis()
    };

    await setNewPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error while storing current session details",
    });
  });
});
