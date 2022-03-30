/* eslint-disable no-console -- console logging is a useful initial prototype */

import { debounce } from 'lodash';
import { pluginSettings } from './settings';
import { getSyncConfigs, deleteSyncConfig } from './database';
import { uploadText } from './permanent-client';
import { getOrRefreshToken } from './permanent-oauth';
import type { SyncConfigEnabled } from './database';

interface Pad {
  atext: {
    text: string,
  },
  head: number,
  id: string,
}

const debounceUpdate = debounce(async (pad: Pad): Promise<void> => {
  console.log('Debouncing on update', pad.head, 'for pad id', pad.id, 'after', pluginSettings.waitMilliseconds, 'ms');

  (await getSyncConfigs(pad.id))
    .filter((config): config is SyncConfigEnabled => config.sync === true)
    .forEach(async ({ credentials, target }) => {
      const authorToken = await getOrRefreshToken(credentials.author);
      switch(authorToken.status) {
        case 'missing':
          deleteSyncConfig(pad.id, credentials.author);
          return;
        case 'live':
          try {
            await uploadText(
              authorToken.token,
              target,
              `${pad.id}.r${pad.head}.txt`,
              `${pad.id}.r${pad.head}.txt`,
              `Text of ${pad.id} at revision ${pad.head}`,
              pad.atext.text,
            );
          } catch (err: any) {
            console.log('Error uploading text', credentials.author, pad.id, typeof err, err);
          }
          return;
        default:
          // todo what could possibly have happened here
          return;
      }
    });
}, pluginSettings.waitMilliseconds);

const padUpdate = (hookName: string, args: { pad: Pad }) => {
  const { pad } = args;
  debounceUpdate(pad);
};

export { padUpdate };
