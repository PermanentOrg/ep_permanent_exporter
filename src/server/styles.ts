import eejs from 'ep_etherpad-lite/node/eejs';

const eejsBlock_styles = (hookName: string, args: { content: string }) => {
  args.content += eejs.require('ep_permanent_exporter/templates/styles.html');
};

export { eejsBlock_styles };
