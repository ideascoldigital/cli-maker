import { Command, ParamType } from './interfaces';
import { Colors } from './colors';
import { hiddenPrompt } from './setup';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export function createRotatePassphraseCommand(cliName: string): Command {
  return {
    name: 'rotate-passphrase',
    description: 'Rotate the passphrase used to encrypt configuration values',
    params: [
      {
        name: 'config-file',
        description: 'Specific config file to rotate passphrase for (optional)',
        required: false,
        type: ParamType.Text
      }
    ],
    action: async (args: any) => {
      const configFileName = args['config-file'];
      
      console.log(`\n${Colors.BgYellow}${Colors.FgBlack} ROTATE PASSPHRASE ${Colors.Reset} ${Colors.FgYellow}Updating encryption passphrase${Colors.Reset}\n`);
      
      const configFile = buildConfigPath(cliName, configFileName);
      
      // Check if config file exists
      if (!fs.existsSync(configFile)) {
        console.log(`${Colors.Error}❌ Config file not found: ${configFile}${Colors.Reset}\n`);
        console.log(`${Colors.FgGray}Run the setup command first to create a configuration.${Colors.Reset}\n`);
        return;
      }
      
      // Load raw config to check if it has encrypted fields
      const rawConfig = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      const hasEncryptedFields = Object.values(rawConfig).some((value: any) => 
        value && typeof value === 'object' && (value.__enc || value.__b64)
      );
      
      if (!hasEncryptedFields) {
        console.log(`${Colors.Warning}⚠️  No encrypted fields found in config file.${Colors.Reset}\n`);
        console.log(`${Colors.FgGray}The configuration doesn't contain any password fields that require encryption.${Colors.Reset}\n`);
        return;
      }
      
      try {
        // Get current passphrase
        console.log(`${Colors.FgCyan}Enter current passphrase to decrypt existing configuration:${Colors.Reset}`);
        const currentPassphrase = await hiddenPrompt('Current passphrase: ');
        
        if (!currentPassphrase) {
          console.log(`${Colors.Error}❌ Current passphrase is required.${Colors.Reset}\n`);
          return;
        }
        
        // Try to decrypt with current passphrase to validate it
        const decryptedConfig = await tryDecryptConfig(rawConfig, currentPassphrase);
        if (!decryptedConfig) {
          console.log(`${Colors.Error}❌ Invalid current passphrase. Unable to decrypt configuration.${Colors.Reset}\n`);
          return;
        }
        
        // Get new passphrase
        console.log(`\n${Colors.FgCyan}Enter new passphrase for encryption:${Colors.Reset}`);
        const newPassphrase = await hiddenPrompt('New passphrase: ');
        
        if (!newPassphrase) {
          console.log(`${Colors.Error}❌ New passphrase is required.${Colors.Reset}\n`);
          return;
        }
        
        if (newPassphrase === currentPassphrase) {
          console.log(`${Colors.Warning}⚠️  New passphrase is the same as current passphrase.${Colors.Reset}\n`);
          return;
        }
        
        // Confirm new passphrase
        console.log(`${Colors.FgCyan}Confirm new passphrase:${Colors.Reset}`);
        const confirmPassphrase = await hiddenPrompt('Confirm new passphrase: ');
        
        if (newPassphrase !== confirmPassphrase) {
          console.log(`${Colors.Error}❌ Passphrases do not match.${Colors.Reset}\n`);
          return;
        }
        
        // Re-encrypt with new passphrase
        const reencryptedConfig = reencryptConfig(rawConfig, decryptedConfig, newPassphrase);
        
        // Create backup of original config
        const backupFile = `${configFile}.backup.${Date.now()}`;
        fs.copyFileSync(configFile, backupFile);
        console.log(`${Colors.FgGray}📁 Backup created: ${backupFile}${Colors.Reset}`);
        
        // Write new encrypted config
        fs.writeFileSync(configFile, JSON.stringify(reencryptedConfig, null, 2), 'utf-8');
        
        console.log(`\n${Colors.Success}✅ Passphrase rotated successfully!${Colors.Reset}`);
        console.log(`${Colors.FgGray}Configuration file: ${configFile}${Colors.Reset}`);
        console.log(`${Colors.FgGray}All encrypted fields have been re-encrypted with the new passphrase.${Colors.Reset}\n`);
        
      } catch (error) {
        console.log(`${Colors.Error}❌ Error rotating passphrase: ${error instanceof Error ? error.message : 'Unknown error'}${Colors.Reset}\n`);
      }
    }
  };
}

function buildConfigPath(cliName: string, customName?: string): string {
  const safeName = (customName || `${cliName}-config.json`).replace(/[^a-z0-9._-]/gi, '-');
  const home = os.homedir();
  return path.join(home, '.cli-maker', safeName);
}

async function tryDecryptConfig(rawConfig: Record<string, any>, passphrase: string): Promise<Record<string, any> | null> {
  try {
    const decrypted: Record<string, any> = { ...rawConfig };
    
    for (const [key, value] of Object.entries(rawConfig)) {
      if (value && typeof value === 'object') {
        if (value.__enc && value.data) {
          // Encrypted field
          const decryptedValue = decryptWithPassphrase(value, passphrase);
          if (decryptedValue === undefined) {
            return null; // Failed to decrypt
          }
          decrypted[key] = decryptedValue;
        } else if (value.__b64 && value.value) {
          // Base64 encoded (no passphrase encryption)
          try {
            decrypted[key] = Buffer.from(value.value, 'base64').toString('utf-8');
          } catch {
            decrypted[key] = undefined;
          }
        }
      }
    }
    
    return decrypted;
  } catch {
    return null;
  }
}

function reencryptConfig(rawConfig: Record<string, any>, decryptedConfig: Record<string, any>, newPassphrase: string): Record<string, any> {
  const reencrypted: Record<string, any> = { ...rawConfig };
  
  // Re-encrypt fields that were originally encrypted
  for (const [key, value] of Object.entries(rawConfig)) {
    if (value && typeof value === 'object' && (value.__enc || value.__b64)) {
      // This field was encrypted/encoded, so re-encrypt it with new passphrase
      const decryptedValue = decryptedConfig[key];
      if (typeof decryptedValue === 'string') {
        reencrypted[key] = encryptWithPassphrase(decryptedValue, newPassphrase);
      }
    }
  }
  
  return reencrypted;
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
