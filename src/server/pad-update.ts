/* eslint-disable no-console -- console logging is a useful initial prototype */

import { debounce } from 'lodash';
import { pluginSettings } from './load-settings';

interface Pad {
  atext: {
    text: string,
  },
  head: number,
  id: string,
}

const debounceUpdate = pluginSettings.then((settings) => debounce((pad: Pad) => {
  console.log('Debouncing on update', pad.head, 'for pad id', pad.id, 'after', settings.waitMilliseconds, 'ms');
  console.log(pad.atext.text);
}, settings.waitMilliseconds));

const padUpdate = (hookName: string, args: { pad: Pad }) => {
  const { pad } = args;
  console.log('Received update', pad.head, 'for pad id', pad.id);
  debounceUpdate.then((f) => f(pad));
};

export { padUpdate };
