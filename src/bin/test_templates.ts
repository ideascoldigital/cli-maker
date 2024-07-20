export const testCli = `import test from 'node:test';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { cli } from '../../cli';

describe("CLI", () => {
  test("Validate CLI default params", () => {
    assert.equal(cli.getName(), "{{cliName}}");
    assert.equal(cli.getDescription(), "{{cliDescription}}");
    assert.equal(cli.getCommands().length, 1);
    assert.equal(cli.getOptions()?.interactive, true);
    assert.equal(cli.getOptions()?.version, undefined);
  });

  test("required params for first command", () => {
    const firstCommand = cli.getCommands()[0];

    assert.equal(cli.getCommands().length, 1);
    assert.equal(firstCommand.params.length, 1);
    assert.equal(firstCommand.params[0].required, true);
  });
});
`

export const testLib = `import test from 'node:test';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Greet } from '../../lib';

describe("Lib", () => {
  test("should return the message", () => {
    const message = Greet('John');
    assert.equal(message, 'Hello, John!');
  });
});
`
