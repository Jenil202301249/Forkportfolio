import { loginWithGoogle } from '../../../../src/controllers/user/loginWithGoogle.controller.js';
import * as findUser from '../../../../src/db/findUser.js';
import * as insertActive from '../../../../src/db/insertActiveSession.js';
import * as insertUser from '../../../../src/db/insertUser.js';
import * as updateImage from '../../../../src/db/updateProfileImage.js';
import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('axios');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// Helpers to build req/res
const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

const buildReq = (body = {}, headers = {}) => ({ body, headers });

describe('loginWithGoogle.controller', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, JWT_SECRET: 'secret', JWT_EXPIRE: '7d' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('Should return 400 when access_token is missing', async () => {
    const req = buildReq({}, { 'user-agent': 'Mozilla/5.0' });
    const res = buildRes();

    await loginWithGoogle(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing Google Access token.' });
  });

  test('Should return 504 when Google API returns no data', async () => {
    const req = buildReq({ access_token: 'tok' }, { 'user-agent': 'UA' });
    const res = buildRes();

    axios.get.mockResolvedValue({ data: null });

    await loginWithGoogle(req, res);

    expect(axios.get).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unable to get details from google ouauth' });
  });

  test('Should return 503 when DB returns null in searchUserByEmail', async () => {
    const req = buildReq({ access_token: 'tok' }, { 'user-agent': 'UA' });
    const res = buildRes();

    axios.get.mockResolvedValue({ data: { email: 'user@ex.com' } });
    jest.spyOn(findUser, 'searchUserByEmail').mockResolvedValue(null);

    await loginWithGoogle(req, res);

    expect(findUser.searchUserByEmail).toHaveBeenCalledWith('user@ex.com');
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error in finding user' });
  });

  test('Should create user and set cookie when user not found (new google user)', async () => {
    const req = buildReq({ access_token: 'tok' }, { 'user-agent': 'UA' });
    const res = buildRes();

    const payload = { email: 'New@User.com', name: 'New User', picture: 'pic', id: 'gid' };
    axios.get.mockResolvedValue({ data: payload });
    jest.spyOn(findUser, 'searchUserByEmail').mockResolvedValue([]);
    bcrypt.hash.mockResolvedValue('hashed');
    jest.spyOn(insertUser, 'insertUser').mockResolvedValue([{ id: 1, email: 'new@user.com' }]);
    jest.spyOn(updateImage, 'updateProfileImage').mockResolvedValue(true);
    jwt.sign.mockReturnValue('jwt-token');
    jest.spyOn(insertActive, 'insertActiveSession').mockResolvedValue(1);

    await loginWithGoogle(req, res);

    expect(insertUser.insertUser).toHaveBeenCalledWith({ name: 'New User', email: 'new@user.com', Password: 'hashed', method: 'google' });
    expect(updateImage.updateProfileImage).toHaveBeenCalledWith('new@user.com', 'pic');
    expect(insertActive.insertActiveSession).toHaveBeenCalledWith(expect.objectContaining({ token: 'jwt-token', email: 'new@user.com' }));
    const expectedMaxAge = 7 * 24 * 60 * 60 * 1000;

    const [name, value, options] = res.cookie.mock.calls[0];

    expect(name).toBe("token");
    expect(value).toBe("jwt-token");
    expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: expectedMaxAge,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'user regestered successfully.' });
  });

  test('Should return 400 if existing user has normal registration method', async () => {
    const req = buildReq({ access_token: 'tok' }, { 'user-agent': 'UA' });
    const res = buildRes();

    axios.get.mockResolvedValue({ data: { email: 'user@ex.com' } });
    jest.spyOn(findUser, 'searchUserByEmail').mockResolvedValue([{ registrationmethod: 'normal', email: 'user@ex.com' }]);

    await loginWithGoogle(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User already exists with this email. Please login using email and password.' });
  });

  test('Should login existing google user and set cookie', async () => {
    const req = buildReq({ access_token: 'tok' }, { 'user-agent': 'UA' });
    const res = buildRes();

    const existing = { id: 77, email: 'ex@ex.com', registrationmethod: 'google' };
    axios.get.mockResolvedValue({ data: { email: existing.email } });
    jest.spyOn(findUser, 'searchUserByEmail').mockResolvedValue([existing]);
    jwt.sign.mockReturnValue('jwt2');
    jest.spyOn(insertActive, 'insertActiveSession').mockResolvedValue(1);

    await loginWithGoogle(req, res);

    expect(insertActive.insertActiveSession).toHaveBeenCalledWith(expect.objectContaining({ token: 'jwt2', email: 'ex@ex.com' }));
    const expectedMaxAge = 7 * 24 * 60 * 60 * 1000;

    const [name, value, options] = res.cookie.mock.calls[0];

    expect(name).toBe("token");
    expect(value).toBe("jwt2");
    expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: expectedMaxAge,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User logged in successfully' });
  });

  test('Should login existing google user and set cookie', async () => {
    const req = buildReq({ access_token: 'tok' }, { 'user-agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" });
    const res = buildRes();

    const existing = { id: 77, email: 'ex@ex.com', registrationmethod: 'google' };
    axios.get.mockResolvedValue({ data: { email: existing.email } });
    jest.spyOn(findUser, 'searchUserByEmail').mockResolvedValue([existing]);
    jwt.sign.mockReturnValue('jwt2');
    jest.spyOn(insertActive, 'insertActiveSession').mockResolvedValue(1);

    await loginWithGoogle(req, res);

    expect(insertActive.insertActiveSession).toHaveBeenCalledWith(expect.objectContaining({ token: 'jwt2',email: 'ex@ex.com',browser_type:"Chrome",os_type:"Windows" }));
    const expectedMaxAge = 7 * 24 * 60 * 60 * 1000;

    const [name, value, options] = res.cookie.mock.calls[0];

    expect(name).toBe("token");
    expect(value).toBe("jwt2");
    expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: expectedMaxAge,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User logged in successfully' });
  });
  test('Should return 503 when failed to store active session', async () => {
    const req = buildReq({ access_token: 'tok' }, { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" });
    const res = buildRes();

    const existing = { id: 77, email: 'ex@ex.com', registrationmethod: 'google' };
    axios.get.mockResolvedValue({ data: { email: existing.email } });
    jest.spyOn(findUser, 'searchUserByEmail').mockResolvedValue([existing]);
    jwt.sign.mockReturnValue('jwt2');
    jest.spyOn(insertActive, 'insertActiveSession').mockResolvedValue(null);

    await loginWithGoogle(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error while storing current session details' });
  });

  test('Should handle exception and return 401 Invalid Google token', async () => {
    const req = buildReq({ access_token: 'tok' }, { 'user-agent': 'UA' });
    const res = buildRes();

    axios.get.mockRejectedValue(new Error('bad'));

    await loginWithGoogle(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Google token.' });
  });

  test('Should create user and set cookie when user not found (new google user)', async () => {
    const req = buildReq({ access_token: 'tok' }, { 'user-agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" });
    const res = buildRes();

    const payload = { email: 'New@User.com', name: 'New User', picture: 'pic', id: 'gid' };
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    axios.get.mockResolvedValue({ data: payload });
    jest.spyOn(findUser, 'searchUserByEmail').mockResolvedValue([]);
    bcrypt.hash.mockResolvedValue('hashed');
    jest.spyOn(insertUser, 'insertUser').mockResolvedValue([{ id: 1, email: 'new@user.com' }]);
    jest.spyOn(updateImage, 'updateProfileImage').mockResolvedValue(null);
    jwt.sign.mockReturnValue('jwt-token');
    jest.spyOn(insertActive, 'insertActiveSession').mockResolvedValue(1);

    await loginWithGoogle(req, res);

    expect(insertUser.insertUser).toHaveBeenCalledWith({ name: 'New User', email: 'new@user.com', Password: 'hashed', method: 'google' });
    expect(updateImage.updateProfileImage).toHaveBeenCalledWith('new@user.com', 'pic');
    expect(insertActive.insertActiveSession).toHaveBeenCalledWith(expect.objectContaining({ token: 'jwt-token',email: 'new@user.com',browser_type:"Chrome",os_type:"Windows" }));
    expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("failed to update image to google image for user with id: "),
        "new@user.com"
    );

    expect(insertActive.insertActiveSession).toHaveBeenCalledWith(expect.objectContaining({ token: 'jwt-token', email: 'new@user.com' }));
    const expectedMaxAge = 7 * 24 * 60 * 60 * 1000;

    const [name, value, options] = res.cookie.mock.calls[0];

    expect(name).toBe("token");
    expect(value).toBe("jwt-token");
    expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: expectedMaxAge,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'user regestered successfully.' });
    
  });

  test('Should return 503 when insert user return null', async () => {
    const req = buildReq({ access_token: 'tok' }, { 'user-agent': 'UA' });
    const res = buildRes();

    const payload = { email: 'New@User.com', name: 'New User', picture: 'pic', id: 'gid' };
    axios.get.mockResolvedValue({ data: payload });
    jest.spyOn(findUser, 'searchUserByEmail').mockResolvedValue([]);
    bcrypt.hash.mockResolvedValue('hashed');
    jest.spyOn(insertUser, 'insertUser').mockResolvedValue(null);

    await loginWithGoogle(req, res);

    expect(insertUser.insertUser).toHaveBeenCalledWith({ name: 'New User', email: 'new@user.com', Password: 'hashed', method: 'google' });
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error occurred during user creation.' });
  });

  test('Should create user and set cookie when user not found (new google user)', async () => {
    const req = buildReq({ access_token: 'tok' }, { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" });
    const res = buildRes();

    const payload = { email: 'New@User.com', name: 'New User', picture: 'pic', id: 'gid' };
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    axios.get.mockResolvedValue({ data: payload });
    jest.spyOn(findUser, 'searchUserByEmail').mockResolvedValue([]);
    bcrypt.hash.mockResolvedValue('hashed');
    jest.spyOn(insertUser, 'insertUser').mockResolvedValue([{ id: 1, email: 'new@user.com' }]);
    jest.spyOn(updateImage, 'updateProfileImage').mockResolvedValue(null);
    jwt.sign.mockReturnValue('jwt-token');
    jest.spyOn(insertActive, 'insertActiveSession').mockResolvedValue(0);

    await loginWithGoogle(req, res);

    expect(insertUser.insertUser).toHaveBeenCalledWith({ name: 'New User', email: 'new@user.com', Password: 'hashed', method: 'google' });
    expect(updateImage.updateProfileImage).toHaveBeenCalledWith('new@user.com', 'pic');
    expect(insertActive.insertActiveSession).toHaveBeenCalledWith(expect.objectContaining({ token: 'jwt-token',email: 'new@user.com',browser_type:"Chrome",os_type:"Windows" }));
    expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("failed to update image to google image for user with id: "),
        "new@user.com"
    );
});
    test('Should return 503 when failed to store active session in new user', async () => {
        const req = buildReq(
            { access_token: 'tok' },
            { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        );
        const res = buildRes();

        const payload = { name: 'New User', email: 'new@user.com', picture: 'pic', id: 'gid' };

        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        axios.get.mockResolvedValue({ data: payload });
        jest.spyOn(findUser, 'searchUserByEmail').mockResolvedValue([]);
        bcrypt.hash.mockResolvedValue('hashed');
        jest.spyOn(insertUser, 'insertUser').mockResolvedValue([{ id: 1, email: 'new@user.com' }]);

        // IMPORTANT: Spy BEFORE calling controller
        jest.spyOn(updateImage, 'updateProfileImage').mockResolvedValue(null);

        jwt.sign.mockReturnValue('jwt2');

        // simulate failure of active session insert
        jest.spyOn(insertActive, 'insertActiveSession').mockResolvedValue(null);

        await loginWithGoogle(req, res);

        expect(insertUser.insertUser).toHaveBeenCalledWith({
            name: 'New User',
            email: 'new@user.com',
            Password: 'hashed',
            method: 'google'
        });

        expect(updateImage.updateProfileImage).toHaveBeenCalledWith('new@user.com', 'pic');

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining("failed to update image to google image for user with id: "),
            "new@user.com"
        );

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Database error while storing current session details'
        });
    });


});
