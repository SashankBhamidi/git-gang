#!/usr/bin/env node

/**
 * Comprehensive validation script with profanity checking
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
  sanitizeInput,
  checkEntryProfanity
} = require('./validation-utils');

async function validateContribution() {
  try {
    const content = fs.readFileSync('ADD_YOUR_NAME.md', 'utf8');
    const lines = content.split('\n');

    // Check if file has required template structure
    const hasTitle = content.includes('# Add Your Name Here');
    const hasInstructions = content.includes('Want to join the Git Gang?');
    const hasSectionMarker = content.includes('Add your entry below this line');

    if (!hasTitle || !hasInstructions || !hasSectionMarker) {
      setError('ADD_YOUR_NAME.md template structure is missing. Please keep the original template and only fill in your details below "Add your entry below this line".');
      return false;
    }

    // Check if the entry section has the list format markers
    const entryContent = content.substring(content.indexOf('Add your entry below this line'));
    const hasListFormat = entryContent.includes('- Name:') && entryContent.includes('- Username:') && entryContent.includes('- Message:');

    if (!hasListFormat) {
      setError('Please use the list format: "- Name:", "- Username:", "- Message:" (with dashes). Do not remove the template structure.');
      return false;
    }

    const sectionIndex = lines.findIndex(line => line.includes('Add your entry below this line'));
    if (sectionIndex === -1) {
      setError('Could not find the entry section in ADD_YOUR_NAME.md');
      return false;
    }

    const entrySection = lines.slice(sectionIndex + 1).join('\n').trim();
    const simpleFormatData = parseSimpleFormat(entrySection);
    let newEntry, username, name, message;

    if (simpleFormatData) {
      // Simple format processing
      const { name: parsedName, username: parsedUsername, message: parsedMessage } = simpleFormatData;
      username = sanitizeInput(parsedUsername);
      name = sanitizeInput(parsedName);
      message = parsedMessage ? sanitizeInput(parsedMessage) : '';
      const messageText = message ? ` - ${message}` : '';
      newEntry = `[${name}](https://github.com/${username})${messageText}`;

      // Validate the generated entry format
      const validation = validateFormat(newEntry);
      if (!validation.valid) {
        setError(validation.error);
        return false;
      }

      // Use the converted entry if available (simple format was converted to markdown)
      newEntry = validation.entry || newEntry;
      username = sanitizeInput(validation.username);
      name = sanitizeInput(validation.name);
      message = validation.message ? sanitizeInput(validation.message) : '';
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
        setError('Your entry is not in the correct format. Please use: Name: Your Name, Username: your-username, Message: Optional message (or the markdown link format)');
        return false;
      }

      const validation = validateFormat(newEntry);
      if (!validation.valid) {
        setError(validation.error);
        return false;
      }

      // Use the converted entry if available
      newEntry = validation.entry || newEntry;
      username = sanitizeInput(validation.username);
      name = sanitizeInput(validation.name);
      message = validation.message ? sanitizeInput(validation.message) : '';
    }

    // Check for existing contributor (except maintainers)
    if (!MAINTAINERS.includes(username) && checkExistingContributor(username)) {
      setError(`@${username} has already been added to the contributors list.`);
      return false;
    }

    // Check for profanity
    const profanityCheck = await checkEntryProfanity(name, message);

    setOutput('valid', 'true');
    setOutput('entry', newEntry);
    setOutput('username', username);
    setOutput('name', name);
    setOutput('message', message || '');
    setOutput('profanity_detected', profanityCheck.hasProfanity ? 'true' : 'false');
    setOutput('profanity_in_name', profanityCheck.profanityInName ? 'true' : 'false');
    setOutput('profanity_in_message', profanityCheck.profanityInMessage ? 'true' : 'false');

    if (profanityCheck.hasProfanity) {
      console.log('WARNING: Potential profanity detected in contribution');
      if (profanityCheck.profanityInName) {
        console.log('  - Detected in name field');
      }
      if (profanityCheck.profanityInMessage) {
        console.log('  - Detected in message field');
      }
    } else {
      console.log('SUCCESS: Contribution validated successfully');
    }

    return true;

  } catch (error) {
    setError(`Validation failed: ${error.message}`);
    return false;
  }
}

// Run validation
validateContribution().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
