#!/usr/bin/env node

/**
 * Shared validation utilities for Git Gang contribution processing
 */

const fs = require('fs');

const MAINTAINERS = ['SashankBhamidi', 'github-actions[bot]'];
const ENTRY_REGEX = /^\[([^\]]+)\]\(https:\/\/github\.com\/([^)]+)\)(?: - (.+))?$/;

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  } else {
    console.log(`${name}=${value}`);
  }
}

function setError(message) {
  setOutput('valid', 'false');
  setOutput('error_message', message);
  console.error(`Validation Error: ${message}`);
}

function capitalizeWords(str) {
  // Preserve special cases like O'Brien, McDonald, Mary-Jane
  return str.split(' ')
    .map(word => {
      // Handle hyphenated names (Mary-Jane)
      if (word.includes('-')) {
        return word.split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join('-');
      }
      // Handle names with apostrophes (O'Brien, D'Angelo)
      if (word.includes("'")) {
        return word.split("'")
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join("'");
      }
      // Handle names starting with Mc/Mac (McDonald, MacLeod)
      if (word.toLowerCase().startsWith('mc') && word.length > 2) {
        return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
      }
      if (word.toLowerCase().startsWith('mac') && word.length > 3) {
        return 'Mac' + word.charAt(3).toUpperCase() + word.slice(4).toLowerCase();
      }
      // Standard capitalization
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function parseSimpleFormat(text) {
  const nameMatch = text.match(/Name:\s*(.+?)(?:\r?\n|$)/i);
  const usernameMatch = text.match(/Username:\s*(.+?)(?:\r?\n|$)/i);
  const messageMatch = text.match(/Message:\s*(.*?)(?:\r?\n|$)/i);

  if (!nameMatch || !usernameMatch) {
    return null;
  }

  return {
    name: capitalizeWords(nameMatch[1].trim()),
    username: usernameMatch[1].trim().replace(/^@/, ''),
    message: messageMatch ? messageMatch[1].trim() : ''
  };
}

function validateFormat(line) {
  // Try to parse as simple format first (Name:/Username:/Message:)
  const simpleFormatData = parseSimpleFormat(line);
  if (simpleFormatData) {
    const { name, username, message } = simpleFormatData;

    // Validate username format
    if (!/^[a-z\d](?:[a-z\d]|[-_](?=[a-z\d])){0,38}$/i.test(username)) {
      return { valid: false, error: 'Invalid GitHub username format' };
    }

    // Convert to markdown link format
    const markdownEntry = `[${name}](https://github.com/${username})${message ? ' - ' + message : ''}`;
    return { valid: true, name, username, message, entry: markdownEntry };
  }

  // Fall back to markdown link format validation
  const match = line.match(ENTRY_REGEX);
  if (!match) {
    return { valid: false, error: 'Format is incorrect. Use format: Name: Your Name, Username: yourusername, Message: Your message' };
  }

  const [, name, username, message] = match;

  // Additional validation checks
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Username cannot be empty' };
  }

  // Basic username validation (GitHub username rules: alphanumeric, hyphens, underscores, max 39 chars)
  if (!/^[a-z\d](?:[a-z\d]|[-_](?=[a-z\d])){0,38}$/i.test(username)) {
    return { valid: false, error: 'Invalid GitHub username format' };
  }

  return { valid: true, name, username, message, entry: line };
}

function checkExistingContributor(username) {
  try {
    const contributors = fs.readFileSync('CONTRIBUTORS.md', 'utf8');
    const regex = new RegExp(`https://github\\.com/${username}\\)`, 'i');
    return regex.test(contributors);
  } catch (error) {
    console.warn(`Warning: Could not read CONTRIBUTORS.md: ${error.message}`);
    return false;
  }
}

function sanitizeInput(input) {
  // Remove potential shell injection characters and trim
  return input.replace(/[;&|`$(){}[\]<>]/g, '').trim();
}

module.exports = {
  MAINTAINERS,
  ENTRY_REGEX,
  setOutput,
  setError,
  capitalizeWords,
  parseSimpleFormat,
  validateFormat,
  checkExistingContributor,
  sanitizeInput
};
