import fs from 'fs';
import path from 'path';
import readline from 'readline';
import crypto from 'crypto';
import os from 'os';
import { Colors } from './colors';
import { Command, ParamType, SetupCommandOptions, SetupStep, LoadConfigOptions } from './interfaces';
import { Validator } from './command/validator';

/**
 * Generates an interactive "setup" command to configure global variables for the CLI.
 * Stores the resulting config in ~/.cli-maker/<cliName>-config.json by default.
 */
export function createSetupCommand(cliName: string, options: SetupCommandOptions): Command {
  const commandName = options.name || 'setup';
  const description = options.description || 'Configure CLI defaults';
  const validator = new Validator();

  const configFile = buildConfigPath(cliName, options.configFileName);

  return {
    name: commandName,
    description,
    params: [],
    action: async () => {
      let passphrase: string | undefined;
      if (options.encryption?.enabled) {
        passphrase = await askPassphrase(options.encryption.prompt || 'Passphrase (not stored)');
      }

      const existingConfig = loadConfig(configFile, options.steps, passphrase);
      const answers: Record<string, any> = { ...existingConfig };

      console.log(`\n${Colors.BgBlue}${Colors.FgWhite} SETUP ${Colors.Reset} ${Colors.FgBlue}Configure your CLI step by step${Colors.Reset}\n`);

      for (const step of options.steps) {
        const value = await askForStep(step, answers[step.name], validator);
        if (value !== undefined) {
          answers[step.name] = value;
        }
      }

      ensureDir(path.dirname(configFile));
      const encoded = encodePasswords(options.steps, answers, passphrase);
      fs.writeFileSync(configFile, JSON.stringify(encoded, null, 2), 'utf-8');

      console.log(`\n${Colors.Success}✅ Config stored in ${configFile}${Colors.Reset}\n`);

      if (options.onComplete) {
        options.onComplete(answers);
      }
    }
  };
}

/**
 * Helper to read the setup config programáticamente.
 */
export function loadSetupConfig(cliName: string, steps: SetupStep[], options?: LoadConfigOptions): Record<string, any> {
  const configFile = buildConfigPath(cliName, options?.configFileName);
  return loadConfig(configFile, steps, options?.passphrase);
}

/**
 * Helper to get the raw setup config without decryption.
 * Use this for non-sensitive values. For Password fields, use loadSetupConfig with steps and passphrase.
 */
export function getRawConfig(cliName: string, options?: { configFileName?: string }): Record<string, any> {
  const configFile = buildConfigPath(cliName, options?.configFileName);
  try {
    if (fs.existsSync(configFile)) {
      return JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    }
  } catch {
    // ignore malformed or unreadable files
  }
  return {};
}

/**
 * Helper to get a specific config value from the setup config.
 * This is a simplified version that doesn't require steps and reads the raw config.
 * Note: Password fields will remain encrypted/encoded unless you use loadSetupConfig with steps and passphrase.
 */
export function getConfigValue(cliName: string, key: string, options?: { configFileName?: string }): any {
  const config = getRawConfig(cliName, options);
  return config[key];
}

function buildConfigPath(cliName: string, customName?: string) {
  const safeName = (customName || `${cliName}-config.json`).replace(/[^a-z0-9._-]/gi, '-');
  const home = os.homedir();
  return path.join(home, '.cli-maker', safeName);
}

function loadConfig(file: string, steps: SetupStep[], passphrase?: string): Record<string, any> {
  try {
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
      return decodePasswords(steps, raw, passphrase);
    }
  } catch {
    // ignore malformed or unreadable files
  }
  return {};
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

async function askForStep(step: SetupStep, existing: any, validator: Validator): Promise<any> {
  let rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(resolve => rl.question(q, resolve));

  const label = `${Colors.Bright}${step.name}${Colors.Reset} ${Colors.FgGray}(${step.description})${Colors.Reset}`;
  console.log(label);
  if (step.options && step.options.length > 0) {
    console.log(`${Colors.FgGray}Opciones: ${step.options.join(', ')}${Colors.Reset}`);
  }
  if (existing !== undefined) {
    const display = step.type === ParamType.Password ? '********' : existing;
    console.log(`${Colors.FgYellow}Actual value:${Colors.Reset} ${display}`);
  } else if (step.defaultValue !== undefined) {
    const displayDefault = step.type === ParamType.Password ? '********' : step.defaultValue;
    console.log(`${Colors.FgYellow}Default value:${Colors.Reset} ${displayDefault}`);
  }

  let finalValue: any;
  let done = false;
  while (!done) {
    if (step.type === ParamType.List && step.options && step.options.length > 0) {
      const chosen = await askListOption(step, rl);
      finalValue = step.options[chosen];
      done = true;
    } else {
      const prompt = `${Colors.FgGreen}>${Colors.Reset} `;
      let input: string;
      
      if (step.type === ParamType.Password) {
        // Close readline to avoid interference with raw mode
        rl.close();
        input = await readHiddenInput(prompt);
        // Recreate readline for potential next iterations
        rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      } else {
        input = await ask(prompt);
      }
      
      const candidateRaw = input === '' ? (existing ?? step.defaultValue ?? '') : input;
      const candidate = typeof candidateRaw === 'boolean' ? String(candidateRaw) : candidateRaw;
      const validation = validator.validateParam(candidate, step.type, step.required, step.options, step.name);
      if (validation.error) {
        console.log(validation.error);
      } else {
        finalValue = validation.value;
        done = true;
      }
    }
  }

  rl.close();
  return finalValue;
}

async function askListOption(step: SetupStep, rl: readline.Interface): Promise<number> {
  const ask = (q: string) => new Promise<string>(resolve => rl.question(q, resolve));
  step.options = step.options || [];
  step.options.forEach((opt, idx) => {
    console.log(`  ${Colors.FgCyan}${idx + 1}.${Colors.Reset} ${opt}`);
  });
  let selected = -1;
  while (selected < 0 || selected >= step.options.length) {
    const answer = await ask(`${Colors.FgGreen}Select option (1-${step.options.length}):${Colors.Reset} `);
    const num = parseInt(answer, 10);
    if (!isNaN(num) && num >= 1 && num <= step.options.length) {
      selected = num - 1;
    } else {
      console.log(`${Colors.Warning}Invalid option.${Colors.Reset}`);
    }
  }
  return selected;
}

function encodePasswords(steps: SetupStep[], data: Record<string, any>, passphrase?: string): Record<string, any> {
  const result: Record<string, any> = { ...data };
  steps.forEach(step => {
    if (step.type === ParamType.Password && result[step.name] !== undefined) {
      const str = String(result[step.name]);
      if (passphrase) {
        result[step.name] = encryptWithPassphrase(str, passphrase);
      } else {
        result[step.name] = { __b64: true, value: Buffer.from(str, 'utf-8').toString('base64') };
      }
    }
  });
  return result;
}

function decodePasswords(steps: SetupStep[], data: Record<string, any>, passphrase?: string): Record<string, any> {
  const result: Record<string, any> = { ...data };
  steps.forEach(step => {
    const value = result[step.name];
    if (step.type === ParamType.Password && value && typeof value === 'object') {
      if (value.__enc && value.data && passphrase) {
        const decrypted = decryptWithPassphrase(value, passphrase);
        result[step.name] = decrypted;
      } else if (value.__b64 && value.value) {
        try {
          result[step.name] = Buffer.from(value.value, 'base64').toString('utf-8');
        } catch {
          result[step.name] = undefined;
        }
      }
    }
  });
  return result;
}

/**
 * Prompts the user for hidden input (password-like).
 * The input is not displayed on the screen.
 */
export async function hiddenPrompt(prompt: string): Promise<string> {
  return readHiddenInput(prompt);
}

/**
 * Prompts the user for visible input.
 */
export async function prompt(question: string): Promise<string> {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function readHiddenInput(prompt: string): Promise<string> {
  return new Promise(resolve => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    stdout.write(prompt);

    const onData = (char: Buffer) => {
      const key = char.toString();
      if (key === '\n' || key === '\r' || key === '\u0004') {
        stdout.write('\n');
        stdin.removeListener('data', onData);
        if (stdin.isTTY) stdin.setRawMode(false);
        stdin.pause();
        resolve(buffer);
      } else if (key === '\u0003') {
        // Ctrl+C
        stdin.removeListener('data', onData);
        if (stdin.isTTY) stdin.setRawMode(false);
        stdin.pause();
        process.exit(0);
      } else if (key === '\u007f' || key === '\b') {
        // Backspace/Delete
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          stdout.write('\b \b');
        }
      } else {
        const printableChars = key.split('').filter(c => c >= ' ' && c <= '~').join('');
        if (printableChars.length > 0) {
          buffer += printableChars;
          stdout.write('*'.repeat(printableChars.length));
        }
      }
    };

    let buffer = '';
    stdin.resume();
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.on('data', onData);
  });
}

function encryptWithPassphrase(plain: string, passphrase: string) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(passphrase, salt, 120000, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    __enc: true,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  };
}

function decryptWithPassphrase(payload: any, passphrase: string): string | undefined {
  try {
    const salt = Buffer.from(payload.salt, 'base64');
    const iv = Buffer.from(payload.iv, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');
    const data = Buffer.from(payload.data, 'base64');
    const key = crypto.pbkdf2Sync(passphrase, salt, 120000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return undefined;
  }
}

async function askPassphrase(promptText: string): Promise<string | undefined> {
  const pass = await readHiddenInput(`${Colors.FgCyan}${promptText}:${Colors.Reset} `);
  return pass || undefined;
}
