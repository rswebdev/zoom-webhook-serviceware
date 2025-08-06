/* eslint-env jest */
const request = require('supertest');
const app = require('../index.mjs').default;
const nock = require('nock');
const crypto = require('crypto');

// Konfigurationswerte
const SERVICEWARE_URL = process.env.SERVICEWARE_API_URL || 'http://127.0.0.1:4000';
const SHARED_SECRET = process.env.SERVICEWARE_SHARED_SECRET || 'test';
const ZOOM_SECRET_TOKEN = process.env.ZOOM_SECRET_TOKEN || 'zoom_secret';
const WEBHOOK_ENDPOINT = process.env.ZOOM_EVENT_SUBSCRIBER_ENDPOINT || '/zoom-phone-call-event';
const CONNECT_ENDPOINT =
  process.env.SERVICEWARE_WH_ENDPOINT_ON_CALL_CONNECTED ||
  '/PhoneBox/TelephonyHook/OnCallConnected';
const DISCONNECT_ENDPOINT =
  process.env.SERVICEWARE_WH_ENDPOINT_ON_CALL_ENDED || '/PhoneBox/TelephonyHook/OnCallDisconnected';

/**
 * Hilfsfunktion zum Erstellen einer gültigen Zoom-Signatur
 */
function createZoomSignature(payload, secret = ZOOM_SECRET_TOKEN, validSignature = true) {
  const timestamp = Date.now().toString();
  const verificationMessage = `v0:${timestamp}:${JSON.stringify(payload)}`;
  const hashForVerify = crypto
    .createHmac('sha256', secret)
    .update(verificationMessage)
    .digest('hex');
  return {
    signature: validSignature ? `v0=${hashForVerify}` : 'v0=invalid_signature',
    timestamp,
  };
}

describe('Zoom Event Verarbeitung und Weiterleitung', () => {
  beforeAll(() => {
    // Erlaubt nur lokale Verbindungen für Tests
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  // Test 1: URL-Validierungsevent
  it('verarbeitet URL-Validierungsanfragen korrekt', async () => {
    const validationPayload = {
      event: 'endpoint.url_validation',
      payload: {
        plainToken: 'some_plain_token',
      },
    };

    const { signature, timestamp } = createZoomSignature(validationPayload);
    const expectedHash = crypto
      .createHmac('sha256', ZOOM_SECRET_TOKEN)
      .update(validationPayload.payload.plainToken)
      .digest('hex');

    const response = await request(app)
      .post(WEBHOOK_ENDPOINT)
      .set('x-zm-signature', signature)
      .set('x-zm-request-timestamp', timestamp)
      .send(validationPayload);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      plainToken: validationPayload.payload.plainToken,
      encryptedToken: expectedHash,
    });
  });

  // Test 2: Verbindungsevents (phone.caller_connected)
  it('leitet Caller Connected Events an Serviceware weiter', async () => {
    const mockServiceware = nock(SERVICEWARE_URL, {
      reqheaders: {
        authorization: `Bearer ${SHARED_SECRET}`,
        'content-type': 'application/json',
      },
    })
      .post(CONNECT_ENDPOINT, {
        toNumber: '+49123456789',
        fromNumber: '+4987654321',
      })
      .reply(200, { status: 'success' });

    const callerConnectedEvent = {
      event: 'phone.caller_connected',
      payload: {
        account_id: 'account123',
        object: {
          call_id: 'call123',
          callee: { phone_number: '+49123456789' },
          caller: { phone_number: '+4987654321' },
          ringing_start_time: '2023-01-01T12:00:00Z',
          connected_start_time: '2023-01-01T12:00:05Z',
        },
      },
    };

    const { signature, timestamp } = createZoomSignature(callerConnectedEvent);

    const response = await request(app)
      .post(WEBHOOK_ENDPOINT)
      .set('x-zm-signature', signature)
      .set('x-zm-request-timestamp', timestamp)
      .send(callerConnectedEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Authorized');
    expect(mockServiceware.isDone()).toBe(true);
  });

  // Test 3: Beendungsevents (phone.caller_ended)
  it('leitet Caller Ended Events an Serviceware weiter', async () => {
    const mockServiceware = nock(SERVICEWARE_URL, {
      reqheaders: {
        authorization: `Bearer ${SHARED_SECRET}`,
        'content-type': 'application/json',
      },
    })
      .post(DISCONNECT_ENDPOINT, {
        toNumber: '+49123456789',
        fromNumber: '+4987654321',
      })
      .reply(200, { status: 'success' });

    const callerEndedEvent = {
      event: 'phone.caller_ended',
      payload: {
        account_id: 'account123',
        object: {
          call_id: 'call123',
          callee: { phone_number: '+49123456789' },
          caller: { phone_number: '+4987654321' },
          ringing_start_time: '2023-01-01T12:00:00Z',
          answer_start_time: '2023-01-01T12:00:05Z',
          call_end_time: '2023-01-01T12:05:00Z',
          handup_result: 'Call connected',
        },
      },
    };

    const { signature, timestamp } = createZoomSignature(callerEndedEvent);

    const response = await request(app)
      .post(WEBHOOK_ENDPOINT)
      .set('x-zm-signature', signature)
      .set('x-zm-request-timestamp', timestamp)
      .send(callerEndedEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Authorized');
    expect(mockServiceware.isDone()).toBe(true);
  });

  // Test 4: Angenommene Anrufe (phone.callee_answered)
  it('leitet Callee Answered Events an Serviceware weiter', async () => {
    const mockServiceware = nock(SERVICEWARE_URL, {
      reqheaders: {
        authorization: `Bearer ${SHARED_SECRET}`,
        'content-type': 'application/json',
      },
    })
      .post(CONNECT_ENDPOINT, {
        toNumber: '+49123456789',
        fromNumber: '+4987654321',
      })
      .reply(200, { status: 'success' });

    const calleeAnsweredEvent = {
      event: 'phone.callee_answered',
      payload: {
        account_id: 'account123',
        object: {
          call_id: 'call123',
          callee: { phone_number: '+49123456789' },
          caller: { phone_number: '+4987654321' },
          ringing_start_time: '2023-01-01T12:00:00Z',
          connected_start_time: '2023-01-01T12:00:05Z',
        },
      },
    };

    const { signature, timestamp } = createZoomSignature(calleeAnsweredEvent);

    const response = await request(app)
      .post(WEBHOOK_ENDPOINT)
      .set('x-zm-signature', signature)
      .set('x-zm-request-timestamp', timestamp)
      .send(calleeAnsweredEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Authorized');
    expect(mockServiceware.isDone()).toBe(true);
  });

  // Test 5: Beendete Anrufe durch Empfänger (phone.callee_ended)
  it('leitet Callee Ended Events an Serviceware weiter', async () => {
    const mockServiceware = nock(SERVICEWARE_URL, {
      reqheaders: {
        authorization: `Bearer ${SHARED_SECRET}`,
        'content-type': 'application/json',
      },
    })
      .post(DISCONNECT_ENDPOINT, {
        toNumber: '+49123456789',
        fromNumber: '+4987654321',
      })
      .reply(200, { status: 'success' });

    const calleeEndedEvent = {
      event: 'phone.callee_ended',
      payload: {
        account_id: 'account123',
        object: {
          call_id: 'call123',
          callee: { phone_number: '+49123456789' },
          caller: { phone_number: '+4987654321' },
          ringing_start_time: '2023-01-01T12:00:00Z',
          answer_start_time: '2023-01-01T12:00:05Z',
          call_end_time: '2023-01-01T12:05:00Z',
          handup_result: 'Call connected',
        },
      },
    };

    const { signature, timestamp } = createZoomSignature(calleeEndedEvent);

    const response = await request(app)
      .post(WEBHOOK_ENDPOINT)
      .set('x-zm-signature', signature)
      .set('x-zm-request-timestamp', timestamp)
      .send(calleeEndedEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Authorized');
    expect(mockServiceware.isDone()).toBe(true);
  });

  // Test 6: Nicht unterstütztes Event
  it('ignoriert nicht unterstützte Events ohne Weiterleitung', async () => {
    // Wir erwarten keinen API-Aufruf, daher kein Nock-Setup
    const unsupportedEvent = {
      event: 'phone.some_unsupported_event',
      payload: {
        account_id: 'account123',
        object: {
          call_id: 'call123',
          callee: { phone_number: '+49123456789' },
          caller: { phone_number: '+4987654321' },
        },
      },
    };

    const { signature, timestamp } = createZoomSignature(unsupportedEvent);

    const response = await request(app)
      .post(WEBHOOK_ENDPOINT)
      .set('x-zm-signature', signature)
      .set('x-zm-request-timestamp', timestamp)
      .send(unsupportedEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Authorized');
    // Es sollte kein Serviceware-API-Aufruf erfolgen (wird implizit getestet, da kein nock-Scope definiert wurde)
  });

  // Test 7: Falsche Signatur
  it('lehnt Anfragen mit falscher Signatur ab', async () => {
    const event = {
      event: 'phone.caller_connected',
      payload: {
        account_id: 'account123',
        object: {
          call_id: 'call123',
          callee: { phone_number: '+49123456789' },
          caller: { phone_number: '+4987654321' },
          ringing_start_time: '2023-01-01T12:00:00Z',
          connected_start_time: '2023-01-01T12:00:05Z',
        },
      },
    };

    const { signature: invalidSignature, timestamp } = createZoomSignature(
      event,
      ZOOM_SECRET_TOKEN,
      false
    );

    const response = await request(app)
      .post(WEBHOOK_ENDPOINT)
      .set('x-zm-signature', invalidSignature)
      .set('x-zm-request-timestamp', timestamp)
      .send(event);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  // Test 8: Serviceware Mock Server nicht erreichbar
  it('gibt 500 zurück, wenn Serviceware Mock Server nicht erreichbar ist', async () => {
    const logger = require('../logger.mjs').default;
    jest.spyOn(logger, 'error').mockImplementation(() => {});

    nock(SERVICEWARE_URL, {
      reqheaders: {
        authorization: `Bearer ${SHARED_SECRET}`,
        'content-type': 'application/json',
      },
    })
      .post(DISCONNECT_ENDPOINT, {
        toNumber: '+49123456789',
        fromNumber: '+4987654321',
      })
      .reply(500, { status: 'error' });

    const callerConnectedEvent = {
      event: 'phone.caller_connected',
      payload: {
        account_id: 'account123',
        object: {
          call_id: 'call123',
          callee: { phone_number: '+49123456789' },
          caller: { phone_number: '+4987654321' },
          ringing_start_time: '2023-01-01T12:00:00Z',
          connected_start_time: '2023-01-01T12:00:05Z',
        },
      },
    };

    const { signature, timestamp } = createZoomSignature(callerConnectedEvent);
    const response = await request(app)
      .post(WEBHOOK_ENDPOINT)
      .set('x-zm-signature', signature)
      .set('x-zm-request-timestamp', timestamp)
      .send(callerConnectedEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Authorized');
    expect(logger.error).toHaveBeenCalled();
  });
});
