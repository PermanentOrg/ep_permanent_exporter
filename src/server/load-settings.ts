// eslint-disable-next-line import/no-mutable-exports -- needed for promise
let loadSettings;

interface PermanentExporterSettings {
  waitMilliseconds: number;
}

const pluginSettings: Promise<PermanentExporterSettings> = new Promise((resolve, reject) => {
  loadSettings = (hookName: string, context: any) => {
    if (context.settings.ep_permanent_exporter) {
      // todo: validate that settings contains all expected keys
      //       with values of the correct types
      resolve(context.settings.ep_permanent_exporter as PermanentExporterSettings);
    } else {
      reject(new Error('Missing ep_permanent_exporter section in settings.json'));
    }
  };
});

export { loadSettings, pluginSettings };
