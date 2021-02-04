const eejsBlock_exportColumn = (hook_name: string, args: { content: string }) => {
  args.content = args.content + "<div>Hello from ep_permanent_exporter</div>";
};

export { eejsBlock_exportColumn };
