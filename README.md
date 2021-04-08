# ep_permanent_exporter

An [Etherpad Lite](https://etherpad.org/) plugin to allow saving pads
to [Permanent.org](https://www.permanent.org/).

## Installation

This package is not yet being published. Instead, you will need to build &
package it locally, and then install the resulting plugin through Etherpad.

```sh
npm run install
npm run build
npm pack
```

That should produce a file named `ep_permanent_exporter-0.0.1.tgz` or so;
follow the Etherpad instructions for installing plugins.

## Development

This plugin is written in TypeScript.

After setting up an Etherpad Lite instance, and building,
[install](https://docs.npmjs.com/cli/v6/commands/npm-install) the repository
with npm: `npm install path/to/ep_permanent_exporter`.

Note that you will also need to manually keep a symlink to the Etherpad source
directory in the `node_modules` of this repo:

```sh
npm install --no-save path/to/etherpad-lite/src/
```

See also [this comment on
etherpad-lite#4047](https://github.com/ether/etherpad-lite/issues/4047#issuecomment-634962074).
Installing the packaged version of the plugin avoids this issue, but makes for
slower development.


### Architecture

The plugin is composed of a few distinct pieces:

- The front-end needs to present an interface for the user to enter information
  on which Permanent Archive to store the pad in
- The back-end needs to listen on an API for that information, and persist it
- The back-end needs to wait for updates to a pad, and sync it to Permanent
