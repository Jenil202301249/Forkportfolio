// tests/registerWithGoogle.controller.spec.js
import jwt from 'jsonwebtoken';
import { UAParser } from 'ua-parser-js'; // kept for parity with controller
import axios from 'axios';
import bcrypt from 'bcrypt';
import { registerWithGoogle } from '../../../../src/controllers/user/registerWithGoogle.controller.js';

import { searchUserByEmail } from '../../../../src/db/findUser.js';
import { insertUser } from '../../../../src/db/insertUser.js';
import { insertActiveSession } from '../../../../src/db/insertActiveSession.js';
import { updateProfileImage } from '../../../../src/db/updateProfileImage.js';

jest.mock('../../../../src/db/findUser.js');
jest.mock('../../../../src/db/insertUser.js');
jest.mock('../../../../src/db/insertActiveSession.js');
jest.mock('../../../../src/db/updateProfileImage.js');
jest.mock('axios');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

beforeEach(() => {
  jest.resetAllMocks();
});

describe('registerWithGoogle()', () => {
  let req, res;

  beforeEach(() => {
    req = {
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      body: { access_token: 'valid-google-token' },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn().mockReturnThis(),
    };

    // sensible defaults
    axios.get.mockResolvedValue({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://example.com/pic.jpg',
        id: 'google-id-123',
      },
    });
    jwt.sign.mockReturnValue('jwtToken');
  });

  it('should return 400 if access_token is missing', async () => {
    req.body.access_token = undefined;

    await registerWithGoogle(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Missing Google token" });
  });

  it('should return 504 if google oauth returns no data', async () => {
    axios.get.mockResolvedValue({ data: null });

    await registerWithGoogle(req, res);

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to get data from google oauth" });
  });

  it('should return 503 if searchUserByEmail returns null (db error)', async () => {
    searchUserByEmail.mockResolvedValue(null);

    await registerWithGoogle(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Database error occurred." });
  });

  it('should return 409 if user exists with normal registration method', async () => {
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'test@example.com', registrationmethod: 'normal' }]);

    await registerWithGoogle(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User already exists with this email. Please login using email and password.",
    });
  });


  //NULL
  it('should login existing google-registered user and store active session (existing user path)', async () => {
    req.headers = { 'user-agent' : null };
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'test@example.com', registrationmethod: 'google' }]);
    // insertActiveSession should return truthy value (controller only checks falsy)
    insertActiveSession.mockResolvedValue([{ token: 'jwtToken' }]);

    await registerWithGoogle(req, res);

    // controller uses status(201) for existing-user-success branch
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith('token', 'jwtToken', expect.any(Object));
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Login Successfully" });
    expect(insertActiveSession).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalled();
  });


  //GIVEN 
  it('should login existing google-registered user and store active session (existing user path)', async () => {
    req.headers = { 'user-agent' : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" };
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'test@example.com', registrationmethod: 'google' }]);
    // insertActiveSession should return truthy value (controller only checks falsy)
    insertActiveSession.mockResolvedValue([{ token: 'jwtToken' }]);

    await registerWithGoogle(req, res);

    // controller uses status(201) for existing-user-success branch
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith('token', 'jwtToken', {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Login Successfully" });
    expect(insertActiveSession).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalled();
  });

  //SIMPLE CASE
  it('should login existing google-registered user and store active session (existing user path)', async () => {
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'test@example.com', registrationmethod: 'google' }]);
    // insertActiveSession should return truthy value (controller only checks falsy)
    insertActiveSession.mockResolvedValue([{ token: 'jwtToken' }]);

    await registerWithGoogle(req, res);

    // controller uses status(201) for existing-user-success branch
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith('token', 'jwtToken', expect.any(Object));
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Login Successfully" });
    expect(insertActiveSession).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalled();
  });

  it('should create a new user when none exists and register successfully (new user path)', async () => {
    searchUserByEmail.mockResolvedValue([]); // no existing user
    insertUser.mockResolvedValue([{ id: 2, email: 'test@example.com' }]);
    updateProfileImage.mockResolvedValue(true);
    insertActiveSession.mockResolvedValue([{ token: 'jwtToken' }]);
    bcrypt.hash.mockResolvedValue('hashed-google-id');

    await registerWithGoogle(req, res);

    expect(insertUser).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test User',
      email: 'test@example.com',
      Password: 'hashed-google-id',
      method: "google",
    }));
    // controller returns 200 for new-user-success branch
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.cookie).toHaveBeenCalledWith('token', 'jwtToken',{
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "user regestered successfully." });
  });

  it('should create a new user when none exists and register successfully (new user path)', async () => {
    req.headers = { 'user-agent' : null };
    searchUserByEmail.mockResolvedValue([]); // no existing user
    insertUser.mockResolvedValue([{ id: 2, email: 'test@example.com' }]);
    updateProfileImage.mockResolvedValue(true);
    insertActiveSession.mockResolvedValue([{ token: 'jwtToken' }]);
    bcrypt.hash.mockResolvedValue('hashed-google-id');

    await registerWithGoogle(req, res);

    expect(insertUser).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test User',
      email: 'test@example.com',
      Password: 'hashed-google-id',
      method: "google",
    }));
    // controller returns 200 for new-user-success branch
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.cookie).toHaveBeenCalledWith('token', 'jwtToken', expect.any(Object));
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "user regestered successfully." });
  });
  it('should create a new user when none exists and register successfully (new user path)', async () => {
    req.headers = { 'user-agent' : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" };
    searchUserByEmail.mockResolvedValue([]); // no existing user
    insertUser.mockResolvedValue([{ id: 2, email: 'test@example.com' }]);
    updateProfileImage.mockResolvedValue(true);
    insertActiveSession.mockResolvedValue([{ token: 'jwtToken' }]);
    bcrypt.hash.mockResolvedValue('hashed-google-id');

    await registerWithGoogle(req, res);

    expect(insertUser).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test User',
      email: 'test@example.com',
      Password: 'hashed-google-id',
      method: "google",
    }));
    // controller returns 200 for new-user-success branch
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.cookie).toHaveBeenCalledWith('token', 'jwtToken', expect.any(Object));
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "user regestered successfully." });
  });

  it('should still succeed creating new user even if updateProfileImage fails (logs but continues)', async () => {
    searchUserByEmail.mockResolvedValue([]);
    insertUser.mockResolvedValue([{ id: 3, email: 'test2@example.com' }]);
    updateProfileImage.mockResolvedValue(false); // simulate profile update fail
    insertActiveSession.mockResolvedValue([{ token: 'jwtToken' }]);
    bcrypt.hash.mockResolvedValue('hashed-google-id');

    await registerWithGoogle(req, res);

    expect(insertUser).toHaveBeenCalled();
    expect(updateProfileImage).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.cookie).toHaveBeenCalledWith('token', 'jwtToken', expect.any(Object));
  });

  it('should return 503 when insertActiveSession fails for existing user', async () => {
    searchUserByEmail.mockResolvedValue([{ id: 1, email: 'test@example.com', registrationmethod: 'google' }]);
    insertActiveSession.mockResolvedValue(false); // failure

    await registerWithGoogle(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Database error while storing current session details" });
  });

  it('should return 503 when insertActiveSession fails for new user', async () => {
    searchUserByEmail.mockResolvedValue([]); // no existing user
    insertUser.mockResolvedValue([{ id: 2, email: 'test@example.com' }]);
    bcrypt.hash.mockResolvedValue('hashed-google-id');
    updateProfileImage.mockResolvedValue(true);
    insertActiveSession.mockResolvedValue(false); // insertion failed

    await registerWithGoogle(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Database error while storing current session details" });
  });

  it('should return 500 when an unexpected error occurs (e.g., axios throws)', async () => {
    axios.get.mockRejectedValue(new Error('network down'));

    await registerWithGoogle(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Google authentication failed." });
  });

  it('should return 503 if user creation fails (insertUser returns null)', async () => {
    searchUserByEmail.mockResolvedValue([]);  // no existing user
    bcrypt.hash.mockResolvedValue('hashed-google-id');

    // simulate DB failure
    insertUser.mockResolvedValue(null);

    await registerWithGoogle(req, res);

    expect(insertUser).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      Password: 'hashed-google-id',
      method: 'google'
    });

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error occurred during user creation."
    });
  });
});
