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
import { client, getSyncTarget } from '../permanent-client';
import { pluginSettings } from '../settings';
import type {
  Handler,
  Request,
  Response,
} from 'express';

const { cookieSecret } = pluginSettings;

const hasTokenCookie = (req: Request): boolean => (
  'cookies' in req
  && 'permanentToken' in req.cookies
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
      loggedInToPermanent: hasTokenCookie(req),
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

    if (!hasTokenCookie(req)) {
      res.status(401).json({
        loggedInToPermanent: false,
        sync: config.sync,
      });
      return;
    }

    const { permMFA, permSession } = req.cookies;

    if (config.sync !== false // todo
    ) {
      const status = config.sync === true ? 200 : 202;
      res.status(status).json({
        loggedInToPermanent: true,
        sync: config.sync,
      });
      return;
    }
      /*
    setSyncConfig(req.params.pad, author, {
      sync: 'pending',
      credentials: {
        type: 'cookies',
        session: permSession,
        mfa: permMFA,
      },
    });
       */

    res.status(202).json({
      loggedInToPermanent: true,
      sync: 'pending',
    });

    setImmediate(() => {
      getSyncTarget(permSession, permMFA)
        .then((target) => true /*setSyncConfig(req.params.pad, author, {
          sync: true,
          credentials: {
            type: 'cookies',
            session: permSession,
            mfa: permMFA,
          },
          target,
        })*/)
        .catch((error: unknown) => {
          console.log('Error trying to find/create Etherpad folder', typeof error, error);
          /* TODO: delete token cookie and delete sync config if any
          setSyncConfig(req.params.pad, author, {
            sync: 'invalid',
            credentials: {
              type: 'cookies',
              session: permSession,
              mfa: permMFA,
            },
          });
          */
        });
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
      loggedInToPermanent: hasTokenCookie(req),
      sync: config.sync,
    });
  } catch (err: unknown) {
    res.json({
      err,
    });
  }
};

const redirectIdP: Handler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  console.log('Redirecting Permanent login request');
  console.log(req);
  res.redirect(client.authorizeUrl(
    `${req.protocol}://${req.get('host')}/permanent/callback`,
    'offline',
    'state',
  ));
}

const completeOauth: Handler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { code, state } = req.query;
  const permanent = await client.completeAuthorization(
    `${req.protocol}://${req.get('host')}/permanent/callback`,
    code as string,
    'offline',
    state as string,
  );

  console.log(permanent.getAccessToken());
  res.cookie('permanentToken', JSON.stringify(permanent.getAccessToken()), {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    signed: true,
  });

  res.redirect(`${req.baseUrl}/`);
}

const router = express.Router({ mergeParams: true });
router.use([
  cookieParser(cookieSecret),
]);
router.get('/p/:pad/permanent', getPadPermanentConfig);
router.post('/p/:pad/permanent', enableSync);
router.delete('/p/:pad/permanent', disableSync);
router.get('/permanent/auth', redirectIdP);
router.get('/permanent/callback', completeOauth);

export { router };
