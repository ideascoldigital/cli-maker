import test from "node:test"
import { describe, it } from "node:test"
import assert, { ok } from "node:assert/strict"

import { CLI } from '../index';

const cli = new CLI("Demo CLI", "A simple CLI to demonstrate the CLI library");

describe("CLI", () => {
  test("Validate CLI default params", () => {
    assert.equal(cli.getName(), "Demo CLI");
    assert.equal(cli.getDescription(), "A simple CLI to demonstrate the CLI library");
    assert.equal(cli.getCommands().length, 0);
    assert.equal(cli.getOptions()?.askForMissingParam, false);
    assert.equal(cli.getOptions()?.showAlwaysParams, true);
    assert.equal(cli.getOptions()?.version, "1.0.0");
  });

  test("required params", () => {
    const command = {
      name: "test",
      description: "test command",
      params: [
        { name: "param1", description: "param1 description", required: true },
        { name: "param2", description: "param2 description", required: false },
      ],
      action: () => {},
    };
    cli.command(command);

    const firstCommand = cli.getCommands()[0];

    assert.equal(cli.getCommands().length, 1);
    assert.equal(firstCommand.params.length, 2);
    assert.equal(firstCommand.params[0].required, true);
    assert.equal(firstCommand.params[1].required, false);
  });
});
