export const testCliBun = `import { describe, test, expect } from "bun:test";

import { cli } from '../../cli';

describe("CLI", () => {
  test("Validate CLI default params", () => {
    expect(cli.getName()).toBe("{{cliName}}");
    expect(cli.getDescription()).toBe("{{cliDescription}}");
    expect(cli.getCommands().length).toBe(1);
    expect(cli.getOptions()?.interactive).toBe(true);
    expect(cli.getOptions()?.version).toBe("1.0.0");
  });

  test("required params for first command", () => {
    const firstCommand = cli.getCommands()[0];

    expect(cli.getCommands().length).toBe(1);
    expect(firstCommand.params.length).toBe(1);
    expect(firstCommand.params[0].required).toBe(true);
  });
});
`

export const testCliNpm = `import { describe, it } from "node:test";
import { strict as assert } from "node:assert";

import { cli } from '../../cli';

describe("CLI", () => {
  it("Validate CLI default params", () => {
    assert.equal(cli.getName(), "{{cliName}}");
    assert.equal(cli.getDescription(), "{{cliDescription}}");
    assert.equal(cli.getCommands().length, 1);
    assert.equal(cli.getOptions()?.interactive, true);
    assert.equal(cli.getOptions()?.version, "1.0.0");
  });

  it("required params for first command", () => {
    const firstCommand = cli.getCommands()[0];

    assert.equal(cli.getCommands().length, 1);
    assert.equal(firstCommand.params.length, 1);
    assert.equal(firstCommand.params[0].required, true);
  });
});

`

export const testLibBun = `import { describe, test, expect } from "bun:test";

import { Greet } from '../../lib';

describe("Lib", () => {
  test("should return the message", () => {
    const message = Greet('John');
    expect(message).toBe('Hello, John!');
  });
});
`

export const testLibNpm = `import { describe, it } from "node:test";
import { strict as assert } from "node:assert";

import { Greet } from '../../lib';

describe("Lib", () => {
  it("should return the message", () => {
    const message = Greet('John');
    assert.equal(message, 'Hello, John!');
  });
});`
