export enum ParamType {
  Text = 'text',
  Number = 'number',
  Custom = 'custom',
  List = 'list',
  Boolean = 'boolean',
  Email = 'email',
  Phone = 'phone',
  Url = 'url',
  Package = "Package",
  Password = "password",
  /** Repeated entries. Each item is itself a set of params (see CommandParam.itemParams). */
  Array = 'array',
}

export interface CommandParam {
  name: string;
  description: string;
  type?: ParamType;
  required?: boolean;
  options?: any[];
  /**
   * Lazy loader for List options. Resolved at prompt time so huge lists
   * are only materialized when the user actually needs to pick one.
   * Receives previously collected answers so options can depend on prior params.
   * Ignored when `options` is already set.
   */
  optionsLoader?: (answers: Record<string, any>) => any[] | Promise<any[]>;
  /**
   * Conditional visibility. If provided and returns false, the param is
   * skipped in interactive mode (no prompt, value left undefined).
   * Receives previously collected answers.
   */
  when?: (answers: Record<string, any>) => boolean;
  /**
   * Default value used when the user presses Enter without typing.
   * Either a static value or a function (sync/async) that receives
   * previously collected answers.
   */
  defaultValue?: any | ((answers: Record<string, any>) => any | Promise<any>);
  /**
   * Force the searchable picker (type-to-filter + pagination).
   * Auto-enabled when option count exceeds `pageSize * 2` (default >20).
   */
  searchable?: boolean;
  /**
   * Number of rows shown at once in the interactive list picker.
   * Default: 10.
   */
  pageSize?: number;
  /**
   * Custom display label for each option. Receives the raw option value,
   * returns the string shown in the picker. Defaults to `String(opt)`.
   * The selected value passed to the action remains the raw option.
   */
  optionLabel?: (option: any) => string;
  /**
   * For `ParamType.Array` only — the params asked for each item in the loop.
   * Each item's answers form a sub-object pushed onto the result array.
   * Supports the same advanced features (when/optionsLoader/defaultValue)
   * but `answers` inside an item only sees fields of THAT item.
   */
  itemParams?: CommandParam[];
  /** Minimum number of items required (default: 0). */
  minItems?: number;
  /** Maximum number of items allowed (default: unlimited). */
  maxItems?: number;
  /** Custom render of each accepted item in the prompt loop. */
  itemLabel?: (item: any, index: number) => string;
}

export interface Command {
  name: string;
  description: string;
  params: CommandParam[];
  subcommands?: Command[];
  action: (args: { [key: string]: any }) => void | Promise<void>;
}

export interface IntroAnimationOptions {
  /**
   * Enable or disable the intro animation. Disabled by default to avoid unexpected output.
   */
  enabled?: boolean;
  /**
   * Choose a preset style for the intro animation (e.g., 'retro-space', 'hacker', 'vaporwave').
   */
  preset?: string;
  /**
   * Animate text reveal. Defaults to true when intro is enabled.
   */
  animateText?: boolean;
  /**
   * Controls when to show the intro: 'always', 'never', or undefined (default is once).
   */
  introMode?: 'always' | 'never';
  /**
   * Title shown in the intro animation. Defaults to the CLI name.
   */
  title?: string;
  /**
   * Subtitle shown under the title. Defaults to the CLI description.
   */
  subtitle?: string;
  /**
   * Extra lines that appear under the subtitle.
   */
  lines?: string[];
  /**
   * Frames used to animate the leading icon/spinner.
   */
  frames?: string[];
  /**
   * Optional ASCII art block appended under the subtitle/lines.
   */
  asciiArt?: string[];
  /**
   * Delay in milliseconds between frames.
   */
  speedMs?: number;
  /**
   * How many times to loop through the frames. Defaults to 2.
   */
  loops?: number;
  /**
   * When true, the intro only appears once per machine (default). Set to false to show always.
   */
  showOnce?: boolean;
  /**
   * Override the file name used to remember that the intro has been shown.
   */
  storageKey?: string;
  /**
   * Left padding before the content block.
   */
  padding?: number;
}

export interface CLIOptions {
  interactive?: boolean;
  version?: string;
  branding?: boolean;
  introAnimation?: IntroAnimationOptions;
  /**
   * Toggle built-in default commands auto-registered by the CLI.
   * Each flag defaults to true (command shown). Set to false to hide it.
   */
  defaultCommands?: DefaultCommandsOptions;
}

export interface DefaultCommandsOptions {
  /**
   * Show the built-in `rotate-passphrase` command. Default: true.
   */
  rotatePassphrase?: boolean;
  /**
   * Show the built-in `ai-guide` command (machine-readable CLI spec). Default: true.
   */
  aiGuide?: boolean;
}

export interface SetupStep extends CommandParam {
  /**
   * Optional default value used when user presses Enter.
   */
  defaultValue?: any;
}

export interface SetupCommandOptions {
  /**
   * Name of the generated setup command. Defaults to "setup".
   */
  name?: string;
  /**
   * Description shown in help. Defaults to "Configure CLI defaults".
   */
  description?: string;
  /**
   * Steps/questions to ask the user.
   */
  steps: SetupStep[];
  /**
   * Override where the config is stored. Defaults to ~/.cli-maker/<cliName>-config.json
   */
  configFileName?: string;
  /**
   * Optional callback executed after saving the config.
   */
  onComplete?: (config: Record<string, any>) => void;
  /**
   * Enable passphrase-based encryption for password fields.
   */
  encryption?: SetupEncryptionOptions;
}

export interface SetupEncryptionOptions {
  enabled?: boolean;
  /**
   * Optional prompt shown when asking for the passphrase.
   */
  prompt?: string;
}

export interface LoadConfigOptions {
  /**
   * Custom config file name/path override (same semantics as in setup).
   */
  configFileName?: string;
  /**
   * Passphrase to decrypt encrypted password fields.
   */
  passphrase?: string;
}

// ---------------------------------------------------------------------------
// Interactive Session types
// ---------------------------------------------------------------------------

export interface SessionMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  /**
   * Present when role is 'tool' — the name of the tool that produced this message.
   */
  toolName?: string;
}

export interface ToolParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  parameters?: ToolParameter[];
  execute: (args: Record<string, any>, ctx: SessionContext) => any | Promise<any>;
}

export interface SlashCommand {
  /**
   * Command name without the '/' prefix, e.g. 'help'.
   */
  name: string;
  description: string;
  action: (args: string, ctx: SessionContext) => void | Promise<void>;
}

export interface SessionContext {
  /**
   * Conversation history for the current session.
   */
  history: SessionMessage[];
  /**
   * Registered tools.
   */
  tools: Tool[];
  /**
   * Invoke a registered tool by name.
   */
  callTool: (name: string, args: Record<string, any>) => Promise<any>;
  /**
   * Write text to stdout (respects session formatting).
   */
  print: (text: string) => void;
  /**
   * Render an async stream of string chunks token-by-token (useful for LLM streaming).
   */
  printStream: (stream: AsyncIterable<string>) => Promise<void>;
  /**
   * Render a string as formatted markdown in the terminal.
   */
  printMarkdown: (md: string) => void;
  /**
   * A reusable spinner/progress indicator.
   */
  spinner: import('./common').ProgressIndicator;
  /**
   * Reference to the running InteractiveSession instance.
   */
  session: any; // avoids circular import – typed as InteractiveSession at runtime
}

export interface SessionTheme {
  /**
   * Color for panel borders. Default: green.
   */
  borderColor?: string;
  /**
   * Border style for panels. Default: 'dashed'.
   */
  borderStyle?: 'single' | 'double' | 'dashed' | 'rounded';
  /**
   * Color for the prompt indicator. Default: green.
   */
  promptColor?: string;
  /**
   * Color for accent elements (headers, labels). Default: cyan.
   */
  accentColor?: string;
}

export interface SessionOptions {
  /**
   * Prompt string shown before each user input. Default: '> '.
   */
  prompt?: string;
  /**
   * Message displayed when the session starts (left side of welcome panel).
   */
  welcomeMessage?: string;
  /**
   * Tips or hints displayed on the right side of the welcome panel.
   * Each item has a title and body lines.
   */
  tips?: Array<{ title: string; lines: string[] }>;
  /**
   * Info lines shown below the welcome panel (e.g. version, path, model).
   */
  infoLines?: string[];
  /**
   * Visual theme for the session UI.
   */
  theme?: SessionTheme;
  /**
   * Maximum number of messages to keep in history. Default: 100.
   */
  historySize?: number;
  /**
   * Allow multi-line input with trailing backslash. Default: true.
   */
  multiLineEnabled?: boolean;
  /**
   * Custom slash commands (merged with built-ins).
   */
  slashCommands?: SlashCommand[];
  /**
   * Tools/functions that can be called during the session.
   */
  tools?: Tool[];
  /**
   * Called for every non-slash-command user message.
   */
  onMessage: (message: string, ctx: SessionContext) => void | Promise<void>;
  /**
   * Called once when the session starts, before the first prompt.
   */
  onStart?: (ctx: SessionContext) => void | Promise<void>;
  /**
   * Called once when the session ends (user types /exit or Ctrl+D).
   */
  onEnd?: (ctx: SessionContext) => void | Promise<void>;
  /**
   * Enable shell command execution via the `!` prefix. Disabled by default
   * because it executes arbitrary user input via child_process.execSync.
   * Consumers must opt in explicitly.
   */
  shellCommandsEnabled?: boolean;
  /**
   * Optional allowlist of shell command names (first whitespace-delimited
   * token of the input). When set, only commands whose first token matches
   * an entry are executed; everything else is blocked with a message.
   * Has no effect when shellCommandsEnabled is false.
   */
  allowedShellCommands?: string[];
}

export interface ShellCommandResult {
  status: 'ok' | 'disabled' | 'empty' | 'not-allowed' | 'error';
  command: string;
  output?: string;
  stderr?: string;
  exitCode?: number | null;
  message?: string;
}
