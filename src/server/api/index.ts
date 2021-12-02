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
  'signedCookies' in req
  && 'permanentToken' in req.signedCookies
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
    console.log('author is ' + author);
    const config = await getSyncConfig(req.params.pad, author);

    if (!hasTokenCookie(req)) {
      res.status(401).json({
        loggedInToPermanent: false,
        sync: config.sync,
      });
      return;
    }

    if (config.sync !== false // todo
    ) {
      const status = config.sync === true ? 200 : 202;
      res.status(status).json({
        loggedInToPermanent: true,
        sync: config.sync,
      });
      return;
    }

    const accessToken = req.signedCookies.permanentToken;

    setSyncConfig(req.params.pad, author, {
      sync: 'pending',
      credentials: {
        type: 'token',
        token: accessToken,
      },
    });

    res.status(202).json({
      loggedInToPermanent: true,
      sync: 'pending',
    });

    setImmediate(() => {
      console.log(req.signedCookies);
      console.log('token? ' + accessToken);
      getSyncTarget(accessToken)
        .then((target) => setSyncConfig(req.params.pad, author, {
          sync: true,
          credentials: {
            type: 'token',
            token: accessToken,
          },
          target,
        }))
        .catch((error: unknown) => {
          console.log('Error trying to find/create Etherpad folder', typeof error, error);
          console.log((error as object).toString());
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

  // TODO: set cookie expiration time to match token expiration time
  res.cookie('permanentToken', JSON.stringify(permanent.getAccessToken()), {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    signed: true,
    path: '/',
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
