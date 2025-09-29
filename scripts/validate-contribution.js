#!/usr/bin/env node

/**
 * Basic validation script without profanity checking
 * Uses shared validation-utils module
 */

const fs = require('fs');
const {
  MAINTAINERS,
  ENTRY_REGEX,
  setOutput,
  setError,
  parseSimpleFormat,
  validateFormat,
  checkExistingContributor,
  sanitizeInput
} = require('./validation-utils');

function main() {
  try {
    const content = fs.readFileSync('ADD_YOUR_NAME.md', 'utf8');
    const lines = content.split('\n');

    const sectionIndex = lines.findIndex(line => line.includes('Add your entry below this line'));
    if (sectionIndex === -1) {
      setError('Could not find the entry section in ADD_YOUR_NAME.md');
      return;
    }

    const entrySection = lines.slice(sectionIndex + 1).join('\n').trim();
    const simpleFormatData = parseSimpleFormat(entrySection);
    let newEntry, username;

    if (simpleFormatData) {
      // Simple format processing
      const { name, username: user, message } = simpleFormatData;
      username = sanitizeInput(user);
      const sanitizedName = sanitizeInput(name);
      const sanitizedMessage = message ? sanitizeInput(message) : '';
      const messageText = sanitizedMessage ? ` - ${sanitizedMessage}` : '';
      newEntry = `[${sanitizedName}](https://github.com/${username})${messageText}`;

      // Validate the generated entry format
      const validation = validateFormat(newEntry);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
    } else {
      // Legacy markdown format processing
      const trimmedLines = lines.filter(line => line.trim());
      for (let i = trimmedLines.length - 1; i >= 0; i--) {
        if (ENTRY_REGEX.test(trimmedLines[i])) {
          newEntry = trimmedLines[i];
          break;
        }
      }

      if (!newEntry) {
        setError('No valid entry found. Please add your name using the simple format:\nName: Your Name\nUsername: your-username\nMessage: Optional message');
        return;
      }

      const validation = validateFormat(newEntry);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      username = sanitizeInput(validation.username);
    }

    // Check for existing contributor (except maintainers)
    if (!MAINTAINERS.includes(username) && checkExistingContributor(username)) {
      setError(`@${username} has already been added to the contributors list.`);
      return;
    }

    setOutput('valid', 'true');
    setOutput('entry', newEntry);
    setOutput('username', username);
    console.log('Contribution validated successfully!');

  } catch (error) {
    setError(`Validation failed: ${error.message}`);
  }
}

main();
