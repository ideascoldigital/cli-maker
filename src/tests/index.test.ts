import test from 'node:test';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { CLI, ParamType, stripAnsiCodes, Command } from '../index';

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
        assert.match(cleanedOutput, /Missing required parameters/, "Expected error message about missing required parameters");
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

  describe("Subcommands", () => {
    test("should handle subcommands", () => {
      const cli = new CLI("Test CLI", "A test CLI");

      const parentCommand: Command = {
        name: "project",
        description: "Project management",
        params: [],
        action: () => {},
        subcommands: [
          {
            name: "create",
            description: "Create a new project",
            params: [
              { name: "name", description: "Project name", required: true },
              { name: "type", description: "Project type", required: false }
            ],
            action: (args: any) => {
              assert.equal(args.name, "myproject");
              assert.equal(args.type, "web");
            }
          },
          {
            name: "delete",
            description: "Delete a project",
            params: [
              { name: "name", description: "Project name", required: true },
              { name: "force", description: "Force delete", required: false, type: ParamType.Boolean }
            ],
            action: (args: any) => {
              assert.equal(args.name, "oldproject");
              assert.equal(args.force, true);
            }
          }
        ]
      };

      cli.command(parentCommand);

      // Test subcommand execution
      cli.setOptions({ interactive: false });
      const argv = ["", "", "project", "create", "--name=myproject", "--type=web"];

      // Capture console.log to avoid output during tests
      const originalLog = console.log;
      console.log = () => {};

      try {
        cli.parse(argv);
      } finally {
        console.log = originalLog;
      }

      assert.equal(cli.getCommands().length, 1);
      assert.equal(cli.getCommands()[0].subcommands?.length, 2);
    });

    test("should show help for subcommands", () => {
      const cli = new CLI("Test CLI", "A test CLI");

      const parentCommand: Command = {
        name: "project",
        description: "Project management",
        params: [],
        action: () => {},
        subcommands: [
          {
            name: "create",
            description: "Create a new project",
            params: [
              { name: "name", description: "Project name", required: true }
            ],
            action: () => {}
          }
        ]
      };

      cli.command(parentCommand);

      // Redirect console.log to capture output
      const originalLog = console.log;
      let output = '';
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      cli.parse(["", "", "project", "create", "--help"]);

      // Restore console.log
      console.log = originalLog;

      assert.match(output, /Test CLI project create/);
      assert.match(output, /USAGE/);
      assert.match(output, /PARAMETERS/);
      assert.match(output, /name/);
      assert.match(output, /Project name/);
    });

    test("should handle unknown subcommand by executing parent command", () => {
      const cli = new CLI("Test CLI", "A test CLI");

      let parentActionCalled = false;
      const parentCommand: Command = {
        name: "project",
        description: "Project management",
        params: [],
        action: () => {
          parentActionCalled = true;
        },
        subcommands: [
          {
            name: "create",
            description: "Create a new project",
            params: [],
            action: () => {}
          }
        ]
      };

      cli.command(parentCommand);

      // Redirect console.log to capture output
      const originalLog = console.log;
      let output = '';
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      cli.setOptions({ interactive: false, branding: true });
      cli.parse(["", "", "project", "unknown"]);

      // Restore console.log
      console.log = originalLog;

      // Should execute parent command and show branding
      assert.equal(parentActionCalled, true);
      assert.match(output, /Like this CLI\?/);
    });

    test("should handle nested subcommands", () => {
      const cli = new CLI("Test CLI", "A test CLI");

      const nestedCommand: Command = {
        name: "deploy",
        description: "Deploy application",
        params: [],
        action: () => {},
        subcommands: [
          {
            name: "staging",
            description: "Deploy to staging",
            params: [
              { name: "version", description: "Version to deploy", required: true }
            ],
            action: (args: any) => {
              assert.equal(args.version, "1.0.0");
            }
          }
        ]
      };

      const parentCommand: Command = {
        name: "app",
        description: "Application management",
        params: [],
        action: () => {},
        subcommands: [nestedCommand]
      };

      cli.command(parentCommand);

      cli.setOptions({ interactive: false });
      const argv = ["", "", "app", "deploy", "staging", "--version=1.0.0"];

      // Capture console.log to avoid output during tests
      const originalLog = console.log;
      console.log = () => {};

      try {
        cli.parse(argv);
      } finally {
        console.log = originalLog;
      }

      assert.equal(cli.getCommands()[0].subcommands?.length, 1);
      assert.equal(cli.getCommands()[0].subcommands?.[0].subcommands?.length, 1);
    });
  });

  describe("Help and Branding", () => {
    test("should display global help", () => {
      const cli = new CLI("Test CLI", "A test CLI");

      const command = {
        name: "test",
        description: "Test command",
        params: [],
        action: () => {}
      };

      cli.command(command);

      // Redirect console.log to capture output
      const originalLog = console.log;
      let output = '';
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      cli.parse(["", "", "--help"]);

      // Restore console.log
      console.log = originalLog;

      assert.match(output, /Test CLI/);
      assert.match(output, /A test CLI/);
      assert.match(output, /USAGE/);
      assert.match(output, /COMMANDS/);
      assert.match(output, /OPTIONS/);
      assert.match(output, /test/);
      assert.match(output, /Test command/);
    });

    test("should display branding when enabled", () => {
      const cli = new CLI("Test CLI", "A test CLI", { branding: true });

      let actionCalled = false;
      const command = {
        name: "test",
        description: "Test command",
        params: [],
        action: () => {
          actionCalled = true;
        }
      };

      cli.command(command);

      // Redirect console.log to capture output
      const originalLog = console.log;
      let output = '';
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      cli.setOptions({ interactive: false, branding: true });
      cli.parse(["", "", "test"]);

      // Restore console.log
      console.log = originalLog;

      assert.equal(actionCalled, true, "Command action should have been called");
      assert.match(output, /Like this CLI\?/);
      assert.match(output, /github\.com\/ideascoldigital\/cli-maker/);
    });

    test("should not display branding when disabled", () => {
      const cli = new CLI("Test CLI", "A test CLI", { branding: false });

      const command = {
        name: "test",
        description: "Test command",
        params: [],
        action: () => {}
      };

      cli.command(command);

      // Redirect console.log to capture output
      const originalLog = console.log;
      let output = '';
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      cli.setOptions({ interactive: false });
      cli.parse(["", "", "test"]);

      // Restore console.log
      console.log = originalLog;

      assert.doesNotMatch(output, /Like this CLI\?/);
      assert.doesNotMatch(output, /github\.com/);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle unknown command", () => {
      const cli = new CLI("Test CLI", "A test CLI");

      // Redirect console.log to capture output
      const originalLog = console.log;
      let output = '';
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      cli.parse(["", "", "unknown"]);

      // Restore console.log
      console.log = originalLog;

      const cleanedOutput = stripAnsiCodes(output);
      assert.match(cleanedOutput, /Unknown command/);
      assert.match(cleanedOutput, /Available commands/);
    });

    test("should handle empty arguments", () => {
      const cli = new CLI("Test CLI", "A test CLI");

      // Redirect console.log to capture output
      const originalLog = console.log;
      let output = '';
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      cli.parse(["", ""]);

      // Restore console.log
      console.log = originalLog;

      assert.match(output, /Test CLI/);
      assert.match(output, /USAGE/);
    });

    test("should handle command with no parameters", () => {
      const cli = new CLI("Test CLI", "A test CLI");

      let actionCalled = false;
      const command = {
        name: "simple",
        description: "Simple command",
        params: [],
        action: () => {
          actionCalled = true;
        }
      };

      cli.command(command);

      cli.setOptions({ interactive: false });
      cli.parse(["", "", "simple"]);

      assert.equal(actionCalled, true);
    });

    test("should handle boolean parameters correctly", () => {
      const cli = new CLI("Test CLI", "A test CLI");

      let capturedArgs: any = null;
      const command = {
        name: "booltest",
        description: "Boolean test command",
        params: [
          { name: "flag", description: "A boolean flag", required: false, type: ParamType.Boolean }
        ],
        action: (args: any) => {
          capturedArgs = args;
        }
      };

      cli.command(command);

      cli.setOptions({ interactive: false });
      cli.parse(["", "", "booltest", "--flag=true"]);

      assert.equal(capturedArgs.flag, true);
    });
  });
});
