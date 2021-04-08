/* eslint-disable no-console -- console logging is a useful initial prototype */

import { debounce } from 'lodash';
import { pluginSettings } from './settings';

interface Pad {
  atext: {
    text: string,
  },
  head: number,
  id: string,
}

const debounceUpdate = debounce((pad: Pad) => {
  console.log('Debouncing on update', pad.head, 'for pad id', pad.id, 'after', pluginSettings.waitMilliseconds, 'ms');
  console.log(pad.atext.text);
}, pluginSettings.waitMilliseconds);

const padUpdate = (hookName: string, args: { pad: Pad }) => {
  const { pad } = args;
  console.log('Received update', pad.head, 'for pad id', pad.id);
  debounceUpdate(pad);
};

export { padUpdate };
