/* eslint-disable no-console -- console logging is a useful initial prototype */

import type {
  Application,
  Handler,
  Request,
  Response,
} from 'express';
import bodyParser from 'body-parser';
import { get, set } from 'ep_etherpad-lite/node/db/DB';

const getPadPermanentConfig: Handler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  console.log('get permanent config for pad id', req.params.pad);
  try {
    const value = await get(`permanent:${req.params.pad}`);
    res.json({
      value,
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
  set(`permanent:${req.params.pad}`, req.body);
  res.json({
    saved: true,
  });
};

const expressCreateServer = (
  hookName: string,
  context: { app: Application },
) => {
  context.app.get('/p/:pad/permanent', getPadPermanentConfig);
  context.app.put('/p/:pad/permanent', bodyParser.json());
  context.app.put('/p/:pad/permanent', setPadPermanentConfig);
};

export { expressCreateServer };
