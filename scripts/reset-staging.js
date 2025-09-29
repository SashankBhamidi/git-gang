#!/usr/bin/env node

const fs = require('fs');

function resetStagingFile() {
  try {
    const template = `# Add Your Name Here

Want to join the Git Gang? Just fill out the form below.

**Note:** Name can be your real name or any alias/handle you prefer.

## Add your entry below this line

Name:
Username:
Message:`;

    fs.writeFileSync('ADD_YOUR_NAME.md', template);
    console.log('Staging file reset to template');

  } catch (error) {
    console.error('Failed to reset staging file:', error.message);
    process.exit(1);
  }
}

resetStagingFile();