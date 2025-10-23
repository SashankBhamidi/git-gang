#!/usr/bin/env node

const fs = require('fs');
const { checkEntryProfanity } = require('./validation-utils');

async function checkEntry(entry) {
  const nameMatch = entry.match(/^\[([^\]]+)\]/);
  const messageMatch = entry.match(/ - (.+)$/);

  const name = nameMatch ? nameMatch[1] : '';
  const message = messageMatch ? messageMatch[1] : '';

  const profanityCheck = await checkEntryProfanity(name, message);

  return {
    ...profanityCheck,
    name,
    message
  };
}

async function main() {
  const entry = process.argv[2];
  const username = process.argv[3];
  const prNumber = process.argv[4];

  if (!entry || !username || !prNumber) {
    console.log('Usage: node check-profanity.js "entry" "username" "pr_number"');
    process.exit(1);
  }

  const result = await checkEntry(entry);

  if (result.hasProfanity) {
    console.log('Profanity detected');
    console.log(`Entry: ${entry}`);
    console.log(`Username: ${username}`);
    console.log(`PR: #${prNumber}`);
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `profanity_detected=true\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `entry=${entry}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `username=${username}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `pr_number=${prNumber}\n`);
    }
  } else {
    console.log('No profanity detected');
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `profanity_detected=false\n`);
    }
  }
}

main();
