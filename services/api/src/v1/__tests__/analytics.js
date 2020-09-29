const { indexEvent, refreshIndex, ensureIndex } = require('./../../lib/utils/analytics');
const { setupDb, teardownDb, request, createUser } = require('../../test-helpers');

const testIndex = 'bedrock-analytics-test-sessions';

jest.setTimeout(20 * 1000);

const indexEvents = async (events) => {
  await ensureIndex(testIndex, { recreate: true });
  let i = 0;
  for (const event of events) {
    event.timestamp = Date.parse(event['date-created']);
    if (i === 0) {
      event.deletedAt = new Date();
    }
    if (i < 5) {
      event.isFirstFive = true;
    }
    await indexEvent(testIndex, event);
    i += 1;
  }
  await refreshIndex(testIndex);
};

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => {
  await teardownDb();
});

describe('/1/analytics', () => {
  describe('POST /search', () => {
    it('should allow analytics search (admin)', async () => {
      const user = await createUser({ roles: ['admin'] });
      const sessions = [
        { kwh: 1, userId: user.id },
        { kwh: 2, userId: user.id },
        { kwh: 1, userId: user.id },
      ];
      await indexEvents(sessions);
      const response = await request(
        'POST',
        '/1/analytics/search',
        {
          index: testIndex,
        },
        { user }
      );
      expect(response.status).toBe(200);
      expect(response.body.hits.hits.length).toBe(3);
    });
    it('should deny analytics for non-admin', async () => {
      const user = await createUser({ roles: ['consumer'] });
      const sessions = [
        { kwh: 1, userId: user.id },
        { kwh: 2, userId: user.id },
        { kwh: 1, userId: user.id },
      ];
      await indexEvents(sessions);
      const response = await request(
        'POST',
        '/1/analytics/search',
        {
          index: testIndex,
        },
        { user }
      );
      expect(response.status).toBe(401);
    });
  });
  describe('POST /fetch', () => {
    it('should allow fetch', async () => {
      const user = await createUser({ roles: ['admin'] });
      const sessions = [
        { kwh: 1, userId: user.id, id: '1' },
        { kwh: 2, userId: user.id, id: '2' },
        { kwh: 1, userId: user.id, id: '3' },
      ];
      await indexEvents(sessions);
      const response = await request(
        'POST',
        '/1/analytics/fetch',
        {
          index: testIndex,
          field: 'id',
          value: '2',
        },
        { user }
      );
      expect(response.status).toBe(200);
      expect(response.body.id).toBe('2');
      expect(response.body.kwh).toBe(2);
      expect(response.body.userId).toBe(user.id);
    });
    it('should deny fetch for a non-admin', async () => {
      const user = await createUser({ roles: ['consumer'] });
      const sessions = [
        { kwh: 1, userId: user.id },
        { kwh: 2, userId: user.id },
        { kwh: 1, userId: user.id },
      ];
      await indexEvents(sessions);
      const response = await request(
        'POST',
        `/1/analytics/fetch?accountId=${user.accountId}`,
        {
          index: testIndex,
          field: 'id',
          value: '2',
        },
        { user }
      );
      expect(response.status).toBe(401);
    });
  });
  describe('POST /mongodb-status', () => {
    it('should allow', async () => {
      const user = await createUser({ roles: ['admin'] });
      const sessions = [
        { kwh: 1, userId: user.id, id: '1' },
        { kwh: 2, userId: user.id, id: '2' },
        { kwh: 1, userId: user.id, id: '3' },
      ];
      await indexEvents(sessions);
      const response = await request('POST', `/1/analytics/mongodb-status`, {}, { user });
      expect(response.status).toBe(200);
      console.log('response.body', response.body);
    });
    it('should deny for a non-admin', async () => {
      const user = await createUser({ roles: ['consumer'] });
      const response = await request('POST', `/1/analytics/mongodb-status`, {}, { user });
      expect(response.status).toBe(401);
    });
  });
});
