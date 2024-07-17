#!/usr/bin/env node

import { CLI } from '../command';

const cli = new CLI();

cli.command(
  'create',
  'Generate a base project for building a CLI',
  [],
  () => {
    // Aquí va la lógica para generar el proyecto base
    console.log('Generating base project...');
  }
);

cli.parse(process.argv);
