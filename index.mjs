import express, { json } from 'express';
import { createHmac } from 'crypto';
import * as dotenv from 'dotenv';
import axios from 'axios';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import logger from './logger.mjs';

dotenv.config();

const app = express();

// Logging aktivieren
app.use(morgan('combined'));

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(rateLimit({ windowMs: 60 * 1000, max: 60 }));

// Healthcheck-Route
app.get('/health', (req, res) => res.status(200).send('OK'));

/**
 * 
 * @param {string} secret 
 * @param {string} timestamp 
 * @param {string} message 
 * @returns {string}
 */
const hashedSignature = (secret, timestamp, message) => {
  const verificationMessage = `v0:${timestamp}:${message}`;
  const hashForVerify = createHmac('sha256', secret).update(verificationMessage).digest('hex');
  return `v0=${hashForVerify}`;
};


/**
 * 
 * @param {Request<any, any, WebHookBody<WebHookBodyCallConnect | WebHookBodyCallDisconnect | WebHookBodyURLValidation>>} req 
 * @param {Response} res 
 * @param {string} secretToken 
 */
const webHookHandler = async (req, res, secretToken) => {
  
  const hZoomSignature = req.header('x-zm-signature');
  const hZoomRequestTimestamp = req.header('x-zm-request-timestamp');
  
  /**
   * @type {'endpoint.url_validation' | 'phone.caller_connected' | 'phone.caller_ended'}
   */
  const bEvent = req.body.event;
  const bPayload = req.body.payload;

  const verificationSignature = hashedSignature(secretToken, hZoomRequestTimestamp, JSON.stringify(req.body));

  /**
   * @type {{ message: WebHookBodyValidationResponse | 'Authorized' | 'Unauthorized' | ''; status: number }}
   */
  let response = { message: '', status: 500 };

  if (hZoomSignature === verificationSignature) {
    logger.info('Signature verified successfully');
    if (bEvent === 'endpoint.url_validation') {
      const hashForValidate = createHmac('sha256', process.env.ZOOM_VERIFICATION_TOKEN).update(bPayload.plainToken).digest('hex');

      response = {
        message: {
          plainToken: bPayload.plainToken,
          encryptedToken: hashForValidate
        },
        status: 200
      };

      res.status(response.status);
      res.json(response.message);
    } else {
      response = { message: 'Authorized', status: 200 };

      res.status(response.status);
      res.json(response);

      /**
       * @type {ServicewareOnCallPostData}
       */
      const postData = {
        toNumber: '',
        fromNumber: ''
      };

      if (bEvent === 'phone.caller_connected') {
        // POST to Serviceware OnCallConnect
        postData.toNumber = bPayload.callee.phone_number
        postData.fromNumber = bPayload.caller.phone_number

        await axios.post(`${process.env.SERVICEWARE_API_URL}${process.env.SERVICEWARE_WH_ENDPOINT_ON_CALL_CONNECTED}`, postData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SERVICEWARE_SHARED_SECRET}`
          }
        }).then(() => {
          logger.info('OnCallConnect event posted to Serviceware successfully');
        }).catch((error) => {
          logger.error('Error posting OnCallConnect event to Serviceware:', error);
        });
      } else if (bEvent === 'phone.caller_ended') {
        // POST to Serviceware OnCallDisconnect
        postData.toNumber = bPayload.callee.phone_number
        postData.fromNumber = bPayload.caller.phone_number
        
        await axios.post(`${process.env.SERVICEWARE_API_URL}${process.env.SERVICEWARE_WH_ENDPOINT_ON_CALL_ENDED}`, postData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SERVICEWARE_SHARED_SECRET}`
          }
        }).then(() => {
          logger.info('OnCallDisconnect event posted to Serviceware successfully');
        }).catch((error) => {
          logger.error('Error posting OnCallDisconnect event to Serviceware:', error);
        });
      }
    }
  } else {
    response = { message: 'Unauthorized', status: 401 };

    res.status(response.status);
    res.json(response);
  }
};

app.post('/zoom-phone-call-events', json(), async (req, res) => await webHookHandler(req, res, process.env.ZOOM_SECRET_TOKEN));

export default app;
