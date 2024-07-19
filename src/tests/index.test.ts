import test from "node:test";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { CLI } from '../index';

function stripAnsiCodes(str: string): string {
  return str.replace(/[\u001b\u009b][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

describe("CLI", () => {
  test("Validate CLI default params", () => {
    const cli = new CLI("Demo CLI", "A simple CLI to demonstrate the CLI library");

    assert.equal(cli.getName(), "Demo CLI");
    assert.equal(cli.getDescription(), "A simple CLI to demonstrate the CLI library");
    assert.equal(cli.getCommands().length, 0);
    assert.equal(cli.getOptions()?.interactive, true);
    assert.equal(cli.getOptions()?.askForMissingParam, false);
    assert.equal(cli.getOptions()?.showAlwaysParams, true);
    assert.equal(cli.getOptions()?.version, "1.0.0");
  });

  test("required params", () => {
    const cli = new CLI("Demo CLI", "A simple CLI to demonstrate the CLI library");
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

  describe("Parse command", () => {
    const cli = new CLI("Demo CLI", "A simple CLI to demonstrate the CLI library");
    const command = {
      name: "test",
      description: "test command",
      params: [
        { name: "param1", description: "param1 description", required: true },
        { name: "param2", description: "param2 description", required: false },
      ],
      action: (args: { [key: string]: any }) => {
        assert.equal(args.param1, "value1");
        assert.equal(args.param2, "value2");
      },
    };
    cli.command(command);

    test("should show error when param required is not provided", () => {
      const argv = ["", "", "test", "--param2=value1"];

      // Redirigir stdout
      const originalWrite = process.stdout.write.bind(process.stdout);
      let output = '';
      process.stdout.write = ((chunk: any, encoding?: BufferEncoding, callback?: (error?: Error | null) => void): boolean => {
        if (typeof encoding === 'function') {
          callback = encoding;
          encoding = undefined;
        }
        output += chunk.toString();
        if (callback) callback();
        return true;
      }) as typeof process.stdout.write;

      const originalProcessExit = process.exit.bind(process);
      let capturedExitCode: number | undefined;
      process.exit = ((code?: number): never => {
        capturedExitCode = code;
        throw new Error(`Exit with code ${code}`);
      }) as typeof process.exit;

      try {
        cli.parse(argv);
        assert.fail("Expected cli.parse to throw an error or exit");
      } catch (error) {
        assert.equal(capturedExitCode, 1, "Expected exit code 1");
        const cleanedOutput = stripAnsiCodes(output);
        assert.match(cleanedOutput, /Missing required parameters: param1/, "Expected error message about missing required parameters");
      } finally {
        process.exit = originalProcessExit;
        process.stdout.write = originalWrite;
      }

      assert.equal(cli.getCommands().length, 1);
    });
  });
});
