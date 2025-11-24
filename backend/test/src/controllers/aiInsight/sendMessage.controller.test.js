import { sendMessage } from '../../../../src/controllers/aiInsight/sendMessage.controller.js';

// Mock the external agent module to avoid real side effects
jest.mock('../../../../src/utils/agent.js', () => ({
  __esModule: true,
  default: {
    invoke: jest.fn(),
  },
}));

import app from '../../../../src/utils/agent.js';

// Helper to create mock req/res
const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('sendMessage controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 400 when message is missing', async () => {
    const req = { body: {}, user: { email: 'u@e.com' } };
    const res = createMockRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'message is required' });
    expect(app.invoke).not.toHaveBeenCalled();
  });

  test('should call app.invoke with correct payload and return 200 with reply', async () => {
    const user = {
      email: 'a@b.com',
      name: 'Alice',
      profileimage: 'img.png',
      riskprofile: 'Moderate',
      investmentexperience: '2y',
      theme: 'dark',
      aisuggestion: true,
      financialgoals: 'retirement',
      investmenthorizon: 'long',
    };

    const message = { text: 'Hello', screenWidth: 1280 };

    app.invoke.mockResolvedValueOnce({
      messages: [{ content: 'ignored' }, { content: 'Hi there!' }],
    });

    const req = { body: { message }, user };
    const res = createMockRes();

    await sendMessage(req, res);

    expect(app.invoke).toHaveBeenCalledTimes(1);
    const [arg1, arg2] = app.invoke.mock.calls[0];

    expect(arg1).toEqual({
      messages: [
        {
          role: 'user',
          content: message.text,
          additional_kwargs: {
            userDetails: {
              emailId: user.email,
              name: user.name,
              profileImage: user.profileimage,
              riskProfile: user.riskprofile,
              investmentExperience: user.investmentexperience,
              themePreferences: user.theme,
              aiSuggestionsEnabled: user.aisuggestion,
              financialGoals: user.financialgoals,
              investmentHorizon: user.investmenthorizon,
            },
            screenWidth: message.screenWidth,
          },
        },
      ],
    });

    expect(arg2).toEqual({
      configurable: {
        thread_id: user.email,
        userDetails: {
          emailId: user.email,
          name: user.name,
          profileImage: user.profileimage,
          riskProfile: user.riskprofile,
          investmentExperience: user.investmentexperience,
          themePreferences: user.theme,
          aiSuggestionsEnabled: user.aisuggestion,
          financialGoals: user.financialgoals,
          investmentHorizon: user.investmenthorizon,
        },
      },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ reply: 'Hi there!' });
  });

  test('should set default name to "User" when user.name is missing', async () => {
    const user = {
      email: 'c@d.com',
      profileimage: 'pic.jpg',
      riskprofile: 'High',
      investmentexperience: '5y',
      theme: 'light',
      aisuggestion: false,
      financialgoals: 'education',
      investmenthorizon: 'medium',
    };

    const message = { text: 'Test', screenWidth: 800 };

    app.invoke.mockResolvedValueOnce({
      messages: [{ content: 'ignored' }, { content: 'response' }],
    });

    const req = { body: { message }, user };
    const res = createMockRes();

    await sendMessage(req, res);

    const [, arg2] = app.invoke.mock.calls[0];
    expect(arg2.configurable.userDetails.name).toBe('User');

    const [arg1] = app.invoke.mock.calls[0];
    expect(arg1.messages[0].additional_kwargs.userDetails.name).toBe('User');

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('should use optional chaining safely when req.user is undefined', async () => {
    const message = { text: 'Hi', screenWidth: 1024 };
    app.invoke.mockResolvedValueOnce({ messages: [{ content: 'ignored' }, { content: 'ok' }] });

    const req = { body: { message } }; // no user on req
    const res = createMockRes();

    await sendMessage(req, res);

    // Should pass undefined email as thread_id and keep fields undefined
    const [, arg2] = app.invoke.mock.calls[0];
    expect(arg2.configurable.thread_id).toBeUndefined();
    expect(arg2.configurable.userDetails.emailId).toBeUndefined();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ reply: 'ok' });
  });

  test('should handle agent errors and return 500 with details', async () => {
    const err = new Error('boom');
    app.invoke.mockRejectedValueOnce(err);

    const req = { body: { message: { text: 'Hello', screenWidth: 1200 } }, user: { email: 'x@y.z' } };
    const res = createMockRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error', details: err.message });
  });

  test('should pick the last message content as reply', async () => {
    app.invoke.mockResolvedValueOnce({
      messages: [
        { content: 'first' },
        { content: 'second' },
        { content: 'final' },
      ],
    });

    const req = { body: { message: { text: 'go', screenWidth: 300 } }, user: { email: 'e@f.g' } };
    const res = createMockRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ reply: 'final' });
  });
});
