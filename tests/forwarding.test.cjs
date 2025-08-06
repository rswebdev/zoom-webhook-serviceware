const request = require('supertest');
const app = require('../index.js').default || require('../index.js');
const nock = require('nock');

const SERVICEWARE_URL = process.env.SERVICEWARE_API_URL || 'http://serviceware-mock:4000';
const SHARED_SECRET = process.env.SERVICEWARE_SHARED_SECRET || 'test';

// Beispiel-Event für Zoom
const zoomEvent = {
  event: 'phone.caller_connected',
  payload: {
    callee: { phone_number: '+49123456789' },
    caller: { phone_number: '+4987654321' },
  },
};

describe('Zoom Event Weiterleitung', () => {
  beforeAll(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });
  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('leitet ein Event an Serviceware weiter', async () => {
    const scope = nock(SERVICEWARE_URL, {
      reqheaders: {
        'authorization': `Bearer ${SHARED_SECRET}`,
        'content-type': 'application/json',
      },
    })
      .post('/PhoneBox/TelephonyHook/OnCallConnected', {
        toNumber: '+49123456789',
        fromNumber: '+4987654321',
      })
      .reply(200, { status: 'received', event: 'OnCallConnected' });

    // Simuliere gültige Zoom-Signatur
    const timestamp = Date.now().toString();
    const secret = process.env.ZOOM_SECRET_TOKEN || 'test';
    const crypto = require('crypto');
    const verificationMessage = `v0:${timestamp}:${JSON.stringify(zoomEvent)}`;
    const hashForVerify = crypto.createHmac('sha256', secret).update(verificationMessage).digest('hex');
    const signature = `v0=${hashForVerify}`;

    const res = await request(app)
      .post('/zoom-phone-call-events')
      .set('x-zm-signature', signature)
      .set('x-zm-request-timestamp', timestamp)
      .send(zoomEvent);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Authorized');
    expect(scope.isDone()).toBe(true);
  });
});
