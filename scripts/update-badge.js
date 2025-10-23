#!/usr/bin/env node

const fs = require('fs');

function updateBadge() {
  try {
    // Read CONTRIBUTORS.md to get count
    const contributors = fs.readFileSync('CONTRIBUTORS.md', 'utf8');
    const countMatch = contributors.match(/Total contributors: (\d+)/);
    const count = countMatch ? countMatch[1] : '0';

    // Read README.md
    const readme = fs.readFileSync('README.md', 'utf8');

    // Update the contributors badge
    const updatedReadme = readme.replace(
      /!\[Contributors\]\(https:\/\/img\.shields\.io\/badge\/contributors-\d+-brightgreen\.svg\?style=flat-square\)/,
      `![Contributors](https://img.shields.io/badge/contributors-${count}-brightgreen.svg?style=flat-square)`
    );

    // Only write if content changed
    if (updatedReadme !== readme) {
      fs.writeFileSync('README.md', updatedReadme);
      console.log(`Badge updated to show ${count} contributors`);
    } else {
      console.log(`Badge already shows ${count} contributors (no update needed)`);
    }

  } catch (error) {
    console.error('Failed to update badge:', error.message);
    process.exit(1);
  }
}

updateBadge();