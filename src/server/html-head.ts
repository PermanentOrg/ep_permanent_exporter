import { pluginSettings } from './settings';

const eejsBlock_htmlHead = (hookName: string, args: { content: string }) => {
  args.content += `<meta name="monetization" content="${pluginSettings.wallet}">`;
};

export { eejsBlock_htmlHead };
