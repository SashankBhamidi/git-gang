#!/usr/bin/env node

const fs = require('fs');
const { ENTRY_REGEX, validateFormat } = require('./validation-utils');

function addToContributors(entry) {
  try {
    let contributors = fs.readFileSync('CONTRIBUTORS.md', 'utf8');

    contributors = contributors.trim() + '\n- ' + entry + '\n';

    fs.writeFileSync('CONTRIBUTORS.md', contributors);

  } catch (error) {
    console.error('Failed to add entry to contributors:', error.message);
    process.exit(1);
  }
}

function main() {
  const entry = process.argv[2];

  if (!entry) {
    console.error('No entry found to process');
    process.exit(1);
  }

  // Validate entry format before processing
  const validation = validateFormat(entry);
  if (!validation.valid) {
    console.error(`Invalid entry format: ${validation.error}`);
    process.exit(1);
  }

  addToContributors(entry);
  console.log('Entry added to contributors!');
}

main();