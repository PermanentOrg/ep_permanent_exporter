import eejs from 'ep_etherpad-lite/node/eejs';

const eejsBlock_exportColumn = (hookName: string, args: { content: string }) => {
  args.content += eejs.require('ep_permanent_exporter/templates/exportColumn.html');
};

export { eejsBlock_exportColumn };
