#!/usr/bin/env node

import { CLI } from '../index';
import { createCommand } from './commands';

const cli = new CLI(
  "cli",
  "A simple CLI builder",
  {
    interactive: true,
    version: '1.0.2',
    introAnimation: {
      enabled: true,
      title: 'CLI Maker',
      subtitle: 'A simple CLI builder',
      introMode: 'always',
      preset: 'hacker'
    }
  },
);

const versionCommand = {
  name: 'version',
  description: 'Show CLI version',
  params: [],
  action: () => {
    console.log(`\n${cli.getName()} version: ${cli.getOptions()?.version}\n`);
  }
};

cli.command(createCommand);
cli.command(versionCommand);

cli.parse(process.argv);
