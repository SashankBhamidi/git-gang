#!/usr/bin/env node

const fs = require('fs');

async function checkProfanityAPI(text, retryCount = 0) {
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 5000;
  const RETRY_DELAYS = [1000, 2000, 3000]; // Exponential backoff

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(
      `https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(text)}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    const result = await response.text();
    return result.toLowerCase() === 'true';
  } catch (error) {
    console.log(`API check failed for "${text}" (attempt ${retryCount + 1}/${MAX_RETRIES}): ${error.message}`);

    // Retry logic with exponential backoff
    if (retryCount < MAX_RETRIES - 1) {
      const delay = RETRY_DELAYS[retryCount];
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return checkProfanityAPI(text, retryCount + 1);
    }

    // Fail closed - flag for manual review if API is unavailable
    console.warn(`Profanity API unavailable after ${MAX_RETRIES} attempts. Flagging for manual review.`);
    return true; // Return true to trigger manual review
  }
}

async function checkEntry(entry) {
  const nameMatch = entry.match(/^\[([^\]]+)\]/);
  const messageMatch = entry.match(/ - (.+)$/);

  const name = nameMatch ? nameMatch[1] : '';
  const message = messageMatch ? messageMatch[1] : '';

  const profanityInName = name ? await checkProfanityAPI(name) : false;
  const profanityInMessage = message ? await checkProfanityAPI(message) : false;

  return {
    hasProfanity: profanityInName || profanityInMessage,
    name,
    message,
    profanityInName,
    profanityInMessage
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
