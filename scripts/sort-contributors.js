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

    // Rebuild the file using array for better performance
    const outputParts = [];
    let addedContent = false;

    for (const line of otherLines) {
      if (line.includes('## Our Contributors') && !addedContent) {
        outputParts.push(line);
        outputParts.push('');
        outputParts.push(`Total contributors: ${totalCount}`);
        outputParts.push('');

        // Add maintainer entries first with consistent list format
        for (const entry of maintainerEntries) {
          const normalizedEntry = entry.trim().startsWith('-') ? entry : '- ' + entry.trim();
          outputParts.push(normalizedEntry);
        }

        // Add sorted regular entries with consistent list format
        for (const entry of regularEntries) {
          const normalizedEntry = entry.line.trim().startsWith('-') ? entry.line : '- ' + entry.line.trim();
          outputParts.push(normalizedEntry);
        }

        addedContent = true;
      } else if (!line.startsWith('Total contributors:')) {
        outputParts.push(line);
      }
    }

    fs.writeFileSync('CONTRIBUTORS.md', outputParts.join('\n') + '\n');
    console.log(`Contributors sorted (${totalCount} total: ${maintainerEntries.length} maintainers, ${regularEntries.length} regular)`);

  } catch (error) {
    console.error('Failed to sort contributors:', error.message);
    process.exit(1);
  }
}

sortContributors();