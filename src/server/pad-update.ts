/* eslint-disable no-console -- console logging is a useful initial prototype */

import { debounce } from 'lodash';
import { pluginSettings } from './settings';
import { getSyncConfigs } from './database';
import { uploadText } from './permanent-client';
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
    .forEach(({ credentials, target }) => uploadText(
      credentials.token,
      target,
      `${pad.id}.r${pad.head}.txt`,
      `${pad.id}.r${pad.head}.txt`,
      `Text of ${pad.id} at revision ${pad.head}`,
      pad.atext.text,
    ));
  // TODO: error handling to set invalid credentials on failure
}, pluginSettings.waitMilliseconds);

const padUpdate = (hookName: string, args: { pad: Pad }) => {
  const { pad } = args;
  debounceUpdate(pad);
};

export { padUpdate };
