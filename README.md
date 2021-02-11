# ep_permanent_exporter

An [Etherpad Lite](https://etherpad.org/) plugin to allow saving pads
to [Permanent.org](https://www.permanent.org/).

## Development

This plugin is written in TypeScript, and so must be built with
`npm run build`.

After setting up an Etherpad Lite instance,
[install](https://docs.npmjs.com/cli/v6/commands/npm-install) the repository
with npm: `npm install path/to/ep_permanent_exporter`.

### Architecture

The plugin is composed of a few distinct pieces:

- The front-end needs to present an interface for the user to enter information
  on which Permanent Archive to store the pad in
- The back-end needs to listen on an API for that information, and persist it
- The back-end needs to wait for updates to a pad, and sync it to Permanent
