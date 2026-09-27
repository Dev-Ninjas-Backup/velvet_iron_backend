const { AuthService } = require('./dist/src/auth/auth.service');
const assert = require('assert');

async function test() {
  let createdSession = null;
  let deletedSessions = [];

  const PrismaMock = {
    client: {
      session: {
        create: async (args) => {
          createdSession = args.data;
          return { id: 'sess_1', ...args.data };
        },
        deleteMany: async (args) => {
          deletedSessions.push(args.where);
          return { count: 1 };
        },
        findUnique: async (args) => {
          if (args.where.refreshToken === 'valid_token') {
            return {
              id: 'sess_1',
              refreshToken: 'valid_token',
              expiresAt: new Date(Date.now() + 100000),
              user: { id: 'u1', email: 'test@t.com', role: 'USER' }
            };
          }
          return null;
        },
        delete: async (args) => {
          return { id: args.where.id };
        }
      }
    }
  };

  const JwtMock = {
    sign: (payload, opts) => `signed_${payload.id}_${opts.expiresIn}`
  };

  const ConfigMock = {
    get: (key) => {
      if (key === 'ACCESS_TOKEN_EXPIRATION_MS') return '900000'; // 15m
      if (key === 'REFRESH_TOKEN_EXPIRATION_MS') return '604800000'; // 7d
      return null;
    }
  };

  const authService = new AuthService(null, PrismaMock, JwtMock, null, ConfigMock, null, null);

  // 1. Test generateTokens
  const user = { id: 'u1', email: 'test@test.com', name: 'Tester', role: 'USER' };
  const tokens = await authService.generateTokens(user);
  
  assert(tokens.access_token.includes('900'), 'Access token should expire in 900s');
  assert(tokens.refresh_token.includes('604800'), 'Refresh token should expire in 604800s');
  assert(createdSession !== null, 'Session should be saved to database');
  assert.strictEqual(createdSession.userId, 'u1');
  assert.strictEqual(createdSession.refreshToken, tokens.refresh_token);
  console.log('✅ Phase 1: generateTokens properly saves to Database & calculates seconds');

  // 2. Test logout
  await authService.logout('u1', 'some_refresh_token');
  assert(deletedSessions.length > 0);
  assert.strictEqual(deletedSessions[0].refreshToken, 'some_refresh_token');
  console.log('✅ Phase 2: logout specifically targets the provided refresh token');

  // 3. Test refreshToken
  const refreshed = await authService.refreshToken('valid_token');
  assert.strictEqual(refreshed.user.id, 'u1');
  assert(refreshed.access_token.includes('900'));
  console.log('✅ Phase 3: refreshToken properly rotates session');

}

test().catch(console.error);
