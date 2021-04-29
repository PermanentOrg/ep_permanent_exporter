import type { Application } from 'express';
import { router } from './api';

const expressCreateServer = (
  hookName: string,
  context: { app: Application },
) => {
  context.app.use('/p/:pad/permanent', router);
};

export { expressCreateServer };
