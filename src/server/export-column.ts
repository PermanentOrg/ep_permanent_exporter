import eejs from 'ep_etherpad-lite/node/eejs';
import { pluginSettings } from './settings';

const eejsBlock_exportColumn = (hookName: string, args: { content: string }) => {
  args.content += eejs.require(
    'ep_permanent_exporter/templates/exportColumn.html',
    {
      loginUrl: pluginSettings.loginUrl,
    },
  );
};

export { eejsBlock_exportColumn };
