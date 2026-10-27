import nock from 'nock';
import { afterEach, beforeEach } from 'vitest';

// The tests never touch the network and never read real tokens.
beforeEach(() => {
  process.env.CLIENT_ID = 'test-client-id';
  process.env.CLIENT_SECRET = 'test-client-secret';
  delete process.env.FONDARO_BASE_URL;
  delete process.env.FONDARO_AUTHORIZE_BASE_URL;
  nock.disableNetConnect();
});

afterEach(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});
