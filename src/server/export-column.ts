const eejsBlock_exportColumn = (hookName: string, args: { content: string }) => {
  args.content += '<div>Hello from ep_permanent_exporter</div>';
};

export { eejsBlock_exportColumn };
