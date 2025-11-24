import { logoutUser, logoutUserSession, logoutAllUserSessions } from '../../../../src/controllers/user/logout.controller.js';
import * as deleteActiveSession from '../../../../src/db/deleteActiveSession.js';

// Helper to build mock res
const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

describe('logout.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logoutUser', () => {
    test('Should return 503 when DB returns falsy for deleting session by token', async () => {
      const req = { cookies: { token: 'abc' } };
      const res = buildRes();

      jest.spyOn(deleteActiveSession, 'deleteActiveSessionByToken').mockResolvedValue(null);

      await logoutUser(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error while logging out user' });
    });

    test('Should clear cookie and respond 200 on successful logout', async () => {
      const req = { cookies: { token: 'abc' } };
      const res = buildRes();

      jest.spyOn(deleteActiveSession, 'deleteActiveSessionByToken').mockResolvedValue(true);

      await logoutUser(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User logged out successfully' });
    });

    test('Should handle thrown errors and return 500', async () => {
      const req = { cookies: { token: 'abc' } };
      const res = buildRes();

      jest.spyOn(deleteActiveSession, 'deleteActiveSessionByToken').mockImplementation(() => { throw new Error('boom'); });

      await logoutUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to log out user, please try again' });
    });
  });

  describe('logoutUserSession', () => {
    test('Should return 503 when DB returns falsy for deleting specific session', async () => {
      const req = { body: { token: 'session-token' } };
      const res = buildRes();

      jest.spyOn(deleteActiveSession, 'deleteActiveSessionByToken').mockResolvedValue(null);

      await logoutUserSession(req, res);

      expect(deleteActiveSession.deleteActiveSessionByToken).toHaveBeenCalledWith('session-token');
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error while logging out user' });
    });

    test('Should return 200 when session logout succeeds without clearing cookie', async () => {
      const req = { body: { token: 'session-token' } };
      const res = buildRes();

      jest.spyOn(deleteActiveSession, 'deleteActiveSessionByToken').mockResolvedValue(true);

      await logoutUserSession(req, res);

      expect(res.clearCookie).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'session logged out successfully' });
    });

    test('Should handle thrown errors and return 500 for session logout', async () => {
      const req = { body: { token: 'session-token' } };
      const res = buildRes();

      jest.spyOn(deleteActiveSession, 'deleteActiveSessionByToken').mockImplementation(() => { throw new Error('boom'); });

      await logoutUserSession(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to log out user session, please try again' });
    });
  });

  describe('logoutAllUserSessions', () => {
    test('Should return 503 when DB returns falsy for deleting by email', async () => {
      const req = { user: { email: 'user@example.com' } };
      const res = buildRes();

      jest.spyOn(deleteActiveSession, 'deleteActiveSessionByEmail').mockResolvedValue(null);

      await logoutAllUserSessions(req, res);

      expect(deleteActiveSession.deleteActiveSessionByEmail).toHaveBeenCalledWith('user@example.com');
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Database error while logging out user' });
    });

    test('Should clear cookie and respond 200 when all sessions logout succeeds', async () => {
      const req = { user: { email: 'user@example.com' } };
      const res = buildRes();

      jest.spyOn(deleteActiveSession, 'deleteActiveSessionByEmail').mockResolvedValue(true);

      await logoutAllUserSessions(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'all session logged out successfully' });
    });

    test('Should handle thrown errors and return 500 for all sessions logout', async () => {
      const req = { user: { email: 'user@example.com' } };
      const res = buildRes();

      jest.spyOn(deleteActiveSession, 'deleteActiveSessionByEmail').mockImplementation(() => { throw new Error('boom'); });

      await logoutAllUserSessions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to log out all user sessions, please try again' });
    });
  });
});
