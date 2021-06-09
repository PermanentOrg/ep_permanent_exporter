/* eslint-disable no-console -- console logging is a useful initial prototype */

import cookieParser from 'cookie-parser';
import express from 'express';
import { getAuthor4Token } from 'ep_etherpad-lite/node/db/AuthorManager';
import {
  SyncConfig,
  deleteSyncConfig,
  getSyncConfig,
  setSyncConfig,
} from '../database';
import type {
  Handler,
  Request,
  Response,
} from 'express';

const hasSessionCookies = (req: Request): boolean => (
  'cookies' in req
  && 'permMFA' in req.cookies
  && 'permSession' in req.cookies
);

const isInvalidSession = (req: Request, config: SyncConfig): boolean => (
  hasSessionCookies(req)
  && config.sync === 'invalid'
  && req.cookies.permMFA === config.credentials.mfa
  && req.cookies.permSession === config.credentials.session
);

const getPadPermanentConfig: Handler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  console.log('get permanent config for pad id', req.params.pad);
  try {
    const author = await getAuthor4Token(req.cookies.token);
    const config = await getSyncConfig(req.params.pad, author);
    res.json({
      loggedInToPermanent: hasSessionCookies(req) && !isInvalidSession(req, config),
      sync: config.sync,
    });
  } catch (err: unknown) {
    res.json({
      err,
    });
  }
};

const enableSync: Handler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const author = await getAuthor4Token(req.cookies.token);
    const config = await getSyncConfig(req.params.pad, author);

    if (!hasSessionCookies(req) || isInvalidSession(req, config)) {
      res.status(401).json({
        loggedInToPermanent: false,
        sync: config.sync,
      });
      return;
    }

    const { permMFA, permSession } = req.cookies;

    if (config.sync !== false
      && config.credentials.mfa === permMFA
      && config.credentials.session === permSession
    ) {
      const status = config.sync === true ? 200 : 202;
      res.status(status).json({
        loggedInToPermanent: true,
        sync: config.sync,
      });
      return;
    }

    setSyncConfig(req.params.pad, author, {
      sync: 'pending',
      credentials: {
        type: 'cookies',
        session: permSession,
        mfa: permMFA,
      },
    });

    res.status(202).json({
      loggedInToPermanent: true,
      sync: 'pending',
    });

    setImmediate(() => {
      // TODO: validate credentials, get/create Etherpad folder, save target in db
      deleteSyncConfig(req.params.pad, author);
    });
  } catch (err: unknown) {
    res.json({
      err,
    });
  }
};

const disableSync: Handler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const author = await getAuthor4Token(req.cookies.token);
    const config = await getSyncConfig(req.params.pad, author);
    deleteSyncConfig(req.params.pad, author);
    res.status(202).json({
      loggedInToPermanent: hasSessionCookies(req) && !isInvalidSession(req, config),
      sync: config.sync,
    });
  } catch (err: unknown) {
    res.json({
      err,
    });
  }
};

const router = express.Router({ mergeParams: true });
router.use([
  cookieParser(),
]);
router.get('/', getPadPermanentConfig);
router.post('/', enableSync);
router.delete('/', disableSync);

export { router };
