import test from "node:test"
import { describe, it } from "node:test"
import assert, { ok } from "node:assert/strict"

import { CLI } from '../index';

function count() {
  return 4;
}

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
});
