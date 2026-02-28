export { CLI } from './command/command';
export { ParamType } from './interfaces';
export {
  stripAnsiCodes,
  ProgressIndicator,
  ProgressBar,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  createTable,
  formatParameterTable,
} from './common';
export { createSetupCommand, loadSetupConfig, getRawConfig, getConfigValue, prompt, hiddenPrompt } from './setup';
export { InteractiveSession, renderMarkdown, getBuiltInSlashCommands } from './session/index';

// Re-export CLIOptions and Command separately to avoid circular dependency issues
export type { CLIOptions, Command, IntroAnimationOptions, SetupCommandOptions, SetupStep, LoadConfigOptions, SessionOptions, SessionContext, SessionMessage, SessionTheme, Tool, ToolParameter, SlashCommand } from './interfaces';
