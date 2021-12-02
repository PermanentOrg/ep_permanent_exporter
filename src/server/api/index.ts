/* eslint-disable no-console -- console logging is a useful initial prototype */

import express from 'express';
import { getAuthor4Token } from 'ep_etherpad-lite/node/db/AuthorManager';
import {
  SyncConfig,
  deleteAuthorToken,
  deleteSyncConfig,
  getSyncConfig,
  setAuthorToken,
  setSyncConfig,
} from '../database';
import { getSyncTarget } from '../permanent-client';
import { authorTokenIsLive, client, getOrRefreshToken } from '../permanent-oauth';
import { pluginSettings } from '../settings';
import type {
  Handler,
  Request,
  Response,
} from 'express';

const authorIsLoggedInToPermanent: Handler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const author = await getAuthor4Token(req.cookies.token);
  const { status } = await getOrRefreshToken(author);
  switch(status) {
    case 'refreshing':
      res.json({ loginStatus: 'pending' });
      return;
    case 'missing':
      res.json({ loginStatus: 'logged-out' });
      return;
    case 'valid':
      res.json({ loginStatus: 'logged-in' });
      return;
    default:
      // log an error? idk
      res.json({ loginStatus: 'logged-out' });
      return;
  }
};

const getPadPermanentConfig: Handler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const author = await getAuthor4Token(req.cookies.token);
    const { sync } = await getSyncConfig(req.params.pad, author);
    res.json({
      sync,
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
    const authorToken = await getOrRefreshToken(author);

    if (!authorTokenIsLive(authorToken)) {
      res.status(401).json({
        sync: config.sync,
      });
      return;
    }

    if (config.sync !== false) {
      const status = config.sync === true ? 200 : 202;
      res.status(status).json({
        sync: config.sync,
      });
      return;
    }

    setSyncConfig(req.params.pad, author, {
      sync: 'pending',
      credentials: {
        type: 'author',
        author,
      },
    });

    res.status(202).json({
      sync: 'pending',
    });

    setImmediate(() => {
      getSyncTarget(authorToken)
        .then((target) => setSyncConfig(req.params.pad, author, {
          sync: true,
          credentials: {
            type: 'author',
            author: author,
          },
          target,
        }))
        .catch((error: unknown) => {
          console.log('Error trying to find/create Etherpad folder', typeof error, error);
          console.log((error as object).toString());
          deleteSyncConfig(req.params.pad, author);
          // TODO: delete author token because it's invalid, maybe?
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
  // todo: save current URL to database to redirect to after
  res.redirect(client.authorizeUrl(
    `${req.protocol}://${req.get('host')}/permanent/callback`,
    'offline_access',
    'state',
  ));
}

const completeOauth: Handler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { code, state } = req.query;
  const author = await getAuthor4Token(req.cookies.token);

  try {
    const token = await client.completeAuthorization(
      `${req.protocol}://${req.get('host')}/permanent/callback`,
      code as string,
      'offline_access',
      state as string,
    );

    await setAuthorToken(author, {
      status: 'valid',
      token,
    });

    // todo: load old URL from database to redirect to
    res.redirect(`${req.baseUrl}/`);
  } catch(error: unknown) {
    await deleteAuthorToken(author);
    console.log('Error completing OAuth authorization grant', error);
    res.status(401).json({ loginStatus: 'logged-out' });
  }
}

const router = express.Router({ mergeParams: true });
router.get('/p/:pad/permanent', getPadPermanentConfig);
router.post('/p/:pad/permanent', enableSync);
router.delete('/p/:pad/permanent', disableSync);
router.get('/permanent/auth', redirectIdP);
router.get('/permanent/callback', completeOauth);
router.get('/permanent/status', authorIsLoggedInToPermanent);

export { router };
