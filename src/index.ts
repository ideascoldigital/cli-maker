export { CLI } from './command/command';
export { ParamType } from './interfaces';
export { stripAnsiCodes, ProgressIndicator, showSuccess, showError, showWarning, showInfo, createTable, formatParameterTable } from './common';
export { createSetupCommand, loadSetupConfig } from './setup';

// Re-export CLIOptions and Command separately to avoid circular dependency issues
export type { CLIOptions, Command, IntroAnimationOptions, SetupCommandOptions, SetupStep, LoadConfigOptions } from './interfaces';
