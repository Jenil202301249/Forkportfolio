import { checkToken } from '../../../../src/controllers/user/checkToken.controller.js';
import * as findUser from '../../../../src/db/findUser.js';
import * as activeSession from '../../../../src/db/getActiveSession.js';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

// Helper to build mock res
const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

describe('checkToken.controller', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, JWT_SECRET: 'secret' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('Should return 401 when token cookie is missing', async () => {
    const req = { cookies: {} };
    const res = buildRes();

    await checkToken(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'token is not present' });
  });

  test('Should return 503 when getActiveSessionByToken returns null (DB error)', async () => {
    const req = { cookies: { token: 'abc' } };
    const res = buildRes();

    jest.spyOn(activeSession, 'getActiveSessionByToken').mockResolvedValue(null);

    await checkToken(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error while verifying token' });
  });

  test('Should clear cookie and return 401 when no active session found', async () => {
    const req = { cookies: { token: 'abc' } };
    const res = buildRes();

    jest.spyOn(activeSession, 'getActiveSessionByToken').mockResolvedValue([]);

    await checkToken(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'unauthorized request' });
  });

  test('Should return 503 when searchUserByEmail returns null (DB error)', async () => {
    const req = { cookies: { token: 'abc' } };
    const res = buildRes();

    jest.spyOn(activeSession, 'getActiveSessionByToken').mockResolvedValue([{
      token: 'abc',
    }]);
    jwt.verify.mockReturnValue({ email: 'e@e.com' });
    jest.spyOn(findUser, 'searchUserByEmail').mockResolvedValue(null);

    await checkToken(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error while verifying token' });
  });

  test('Should clear cookie and return 410 when user not found (invalid token)', async () => {
    const req = { cookies: { token: 'abc' } };
    const res = buildRes();

    jest.spyOn(activeSession, 'getActiveSessionByToken').mockResolvedValue([{
      token: 'abc',
    }]);
    jwt.verify.mockReturnValue({ email: 'e@e.com' });
    jest.spyOn(findUser, 'searchUserByEmail').mockResolvedValue([]);

    await checkToken(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'invalid token' });
  });

  test('Should return 200 when token is valid and user exists', async () => {
    const req = { cookies: { token: 'valid' } };
    const res = buildRes();

    jest.spyOn(activeSession, 'getActiveSessionByToken').mockResolvedValue([{ token: 'valid' }]);
    jwt.verify.mockReturnValue({ email: 'user@example.com' });
    jest.spyOn(findUser, 'searchUserByEmail').mockResolvedValue([{ email: 'user@example.com' }]);

    await checkToken(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'already logged in' });
  });

  test('Should handle jwt.verify throwing and return 500', async () => {
    const req = { cookies: { token: 'bad' } };
    const res = buildRes();

    jest.spyOn(activeSession, 'getActiveSessionByToken').mockResolvedValue([{ token: 'bad' }]);
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

    await checkToken(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'failed to check token, please try again' });
  });
});
