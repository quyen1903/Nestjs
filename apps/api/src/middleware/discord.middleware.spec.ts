import { DiscordMiddleware } from './discord.middleware';

describe('DiscordMiddleware', () => {
  it('forwards safe request metadata without body or query values', () => {
    const discordService = {
      sendToFormatCode: jest.fn(),
    };
    const middleware = new DiscordMiddleware(discordService as any);
    const next = jest.fn();

    middleware.use(
      {
        method: 'POST',
        path: '/v1/api/auth/user/loginManual',
        originalUrl: '/v1/api/auth/user/loginManual?token=secret-token',
        body: {
          email: 'buyer@example.test',
          password: 'secret-password',
        },
        query: {
          token: 'secret-token',
        },
        requestId: 'request-1',
      } as any,
      {} as any,
      next,
    );

    const payload = discordService.sendToFormatCode.mock.calls[0][0];
    const serializedPayload = JSON.stringify(payload);

    expect(payload).toEqual({
      title: 'Method: POST',
      code: JSON.stringify({
        method: 'POST',
        path: '/v1/api/auth/user/loginManual',
        requestId: 'request-1',
      }),
      message: '/v1/api/auth/user/loginManual',
    });
    expect(serializedPayload).not.toContain('buyer@example.test');
    expect(serializedPayload).not.toContain('secret-password');
    expect(serializedPayload).not.toContain('secret-token');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
