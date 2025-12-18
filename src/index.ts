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

// Re-export CLIOptions and Command separately to avoid circular dependency issues
export type { CLIOptions, Command, IntroAnimationOptions, SetupCommandOptions, SetupStep, LoadConfigOptions } from './interfaces';
