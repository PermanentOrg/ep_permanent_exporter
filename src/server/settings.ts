import * as EtherpadSettings from 'ep_etherpad-lite/node/utils/Settings';

interface PermanentExporterSettings {
  apiKey: string;
  baseUrl: string;
  padToken: string;
  loginUrl: string;
  waitMilliseconds: number;
  wallet: string;
}

if (!('ep_permanent_exporter' in EtherpadSettings)) {
  throw new Error('Missing ep_permanent_exporter section in settings.json');
}

// todo: validate that settings contains all expected keys
//       with values of the correct types
const pluginSettings = EtherpadSettings.ep_permanent_exporter as PermanentExporterSettings;

export { pluginSettings };
