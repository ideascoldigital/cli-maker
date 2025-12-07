#!/usr/bin/env node

/**
 * Example demonstrating the use of CLI static methods
 * These methods can be used anywhere without creating a CLI instance
 */

const { CLI } = require('../dist/index.js');

async function main() {
  console.log('=== CLI Static Methods Example ===\n');

  // Example 1: Ask for visible input
  const name = await CLI.askQuestion('What is your name? ');
  console.log(`Hello, ${name}!\n`);

  // Example 2: Ask for hidden input (password-like)
  const secret = await CLI.askHiddenQuestion('Enter a secret key: ');
  console.log(`Secret received! Length: ${secret.length} characters\n`);

  // Example 3: Use in a custom validation loop
  let validEmail = false;
  let email;
  
  while (!validEmail) {
    email = await CLI.askQuestion('Enter your email: ');
    if (email.includes('@')) {
      validEmail = true;
      console.log(`✓ Valid email: ${email}\n`);
    } else {
      console.log('✗ Invalid email. Please try again.\n');
    }
  }

  console.log('=== All inputs collected successfully! ===');
}

main().catch(console.error);
