#!/usr/bin/env node

import { CLI } from '../index';
import { createCommand } from './commands';

const cli = new CLI(
  "cli",
  "A simple CLI builder",
  {
    interactive: true,
    version: '1.0.0',
  }
);

cli.command(createCommand);

cli.parse(process.argv);
