import test from 'node:test';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { CLI, ParamType, stripAnsiCodes } from '../index';

describe("CLI", () => {
  test("Validate CLI default params", () => {
    const cli = new CLI("Demo CLI", "A simple CLI to demonstrate the CLI library");

    assert.equal(cli.getName(), "Demo CLI");
    assert.equal(cli.getDescription(), "A simple CLI to demonstrate the CLI library");
    assert.equal(cli.getCommands().length, 0);
    assert.equal(cli.getOptions()?.interactive, true);
    assert.equal(cli.getOptions()?.version, "1.0.0");
  });

  test("should display version when --version flag is used", () => {
    const cli = new CLI("Demo CLI", "A simple CLI to demonstrate the CLI library");

    // Redirect console.log to capture output
    const originalLog = console.log;
    let output = '';
    console.log = (...args) => {
      output += args.join(' ') + '\n';
    };

    cli.parse(["", "", "--version"]);

    // Restore console.log
    console.log = originalLog;

    assert.match(output, /Demo CLI version: 1\.0\.0/);
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

  test("should handle package manager selection", () => {
    const cli = new CLI("Demo CLI", "A simple CLI to demonstrate the CLI library");
    const command = {
      name: "create",
      description: "test command",
      params: [
        {
          name: "package_manager",
          description: "package manager",
          required: true,
          type: ParamType.List,
          options: ['npm', 'bun'],
        },
      ],
      action: () => {}
    };
    cli.command(command);

    const firstCommand = cli.getCommands()[0];
    assert.equal(firstCommand.params[0].name, "package_manager");
    assert.equal(firstCommand.params[0].required, true);
    assert.deepEqual(firstCommand.params[0].options, ['npm', 'bun']);
  });

  describe("Parse command", () => {
    let cli = new CLI("Demo CLI", "A simple CLI to demonstrate the CLI library");
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
      cli.setOptions({ interactive: false });

      const argv = ["", "", "test", "--param2=value1"];

      // Redirect console.log to capture output
      const originalLog = console.log;
      let output = '';
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

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
        assert.match(cleanedOutput, /\nerror missing params\n\n> param1\n  > Type: undefined\n  > Description: param1 description\n\nOptional missing params\n\n/, "Expected error message about missing required parameters");
      } finally {
        process.exit = originalProcessExit;
        console.log = originalLog;
      }

      assert.equal(cli.getCommands().length, 1);
    });

    test("should support params without = like --param1 value1", () => {
      cli.setOptions({ interactive: false });

      const argv = ["", "", "test", "--param1", "value1", "--param2", "value2"];

      // This test should complete successfully without throwing an error
      try {
        cli.parse(argv);
        // If we reach here, the parsing was successful
        assert.equal(cli.getCommands().length, 1);
      } catch (error) {
        assert.fail("Expected cli.parse to not throw an error");
      }
    });
  });
});
