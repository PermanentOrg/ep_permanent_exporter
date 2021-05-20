/* eslint-disable no-console -- console logging is a useful initial prototype */

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import { getAuthor4Token } from 'ep_etherpad-lite/node/db/AuthorManager';
import type {
  Handler,
  Request,
  Response,
} from 'express';
import { getSyncConfig, setSyncConfig } from '../database';

const hasValidLookingCookies = (req: Request): boolean => (
  'cookies' in req
  && 'permMFA' in req.cookies
  && 'permSession' in req.cookies
);

const getPadPermanentConfig: Handler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  console.log('get permanent config for pad id', req.params.pad);
  try {
    const author = await getAuthor4Token(req.cookies.token);
    const { credentials, sync } = await getSyncConfig(req.params.pad, author);
    res.json({
      loggedInToPermanent: hasValidLookingCookies(req) && credentials !== 'invalid',
      sync,
    });
  } catch (err: unknown) {
    res.json({
      err,
    });
  }
};

const setPadPermanentConfig: Handler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  console.log('post permanent config for pad id', req.params.pad);
  console.log('body:', req.body);
  res.json({
    saved: true,
  });
};

const router = express.Router({ mergeParams: true });
router.use([
  cookieParser(),
]);
router.get('/', getPadPermanentConfig);
router.put('/', bodyParser.json());
router.put('/', setPadPermanentConfig);

export { router };
