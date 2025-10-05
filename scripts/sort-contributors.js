#!/usr/bin/env node

const fs = require('fs');

const MAINTAINERS = ['SashankBhamidi', 'github-actions[bot]'];

function sortContributors() {
  try {
    const content = fs.readFileSync('CONTRIBUTORS.md', 'utf8');
    const lines = content.split('\n');

    // Extract contributor entries
    const maintainerEntries = [];
    const regularEntries = [];
    const otherLines = [];

    for (const line of lines) {
      // Match both "- [Name]..." and "[Name]..." formats
      const entryMatch = line.match(/^-?\s*\[([^\]]+)\]\(https:\/\/github\.com\/([^)]+)\)/);

      if (entryMatch) {
        const name = entryMatch[1];
        const username = entryMatch[2];

        if (MAINTAINERS.includes(username)) {
          maintainerEntries.push(line);
        } else {
          const firstName = name.split(' ')[0].toLowerCase();
          regularEntries.push({ firstName, line });
        }
      } else {
        otherLines.push(line);
      }
    }

    // Sort regular entries alphabetically by first name
    regularEntries.sort((a, b) => a.firstName.localeCompare(b.firstName));

    // Calculate total count
    const totalCount = maintainerEntries.length + regularEntries.length;

    // Rebuild the file
    let output = '';
    let addedContent = false;

    for (const line of otherLines) {
      if (line.includes('## Our Contributors') && !addedContent) {
        output += line + '\n\n';
        output += `Total contributors: ${totalCount}\n\n`;

        // Add maintainer entries first
        for (const entry of maintainerEntries) {
          output += entry + '\n';
        }

        // Add sorted regular entries
        for (const entry of regularEntries) {
          output += entry.line + '\n';
        }

        addedContent = true;
      } else if (!line.startsWith('Total contributors:')) {
        output += line + '\n';
      }
    }

    fs.writeFileSync('CONTRIBUTORS.md', output.trim() + '\n');
    console.log(`Contributors sorted (${totalCount} total: ${maintainerEntries.length} maintainers, ${regularEntries.length} regular)`);

  } catch (error) {
    console.error('Failed to sort contributors:', error.message);
    process.exit(1);
  }
}

sortContributors();