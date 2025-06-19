#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Generate random alphanumeric token
 */
function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'CTF-';
  
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}

/**
 * Generate participants configuration
 */
function generateParticipants(count = 35) {
  const participants = [];
  const usedTokens = new Set();
  
  for (let i = 1; i <= count; i++) {
    let token;
    
    // Ensure unique token
    do {
      token = generateToken();
    } while (usedTokens.has(token));
    
    usedTokens.add(token);
    
    participants.push({
      token: token,
      name: `Player${i.toString().padStart(2, '0')}`
    });
  }
  
  return { participants };
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const count = args[0] ? parseInt(args[0]) : 35;
  
  if (isNaN(count) || count <= 0) {
    console.error('Error: Count must be a positive number');
    process.exit(1);
  }
  
  // Only show progress messages if output is not being redirected
  const isOutputRedirected = !process.stdout.isTTY;
  
  if (!isOutputRedirected) {
    console.log(`🎯 Generating ${count} participants...`);
  }
  
  // Create new config
  let config = {};
  
  // Generate new participants
  const participantConfig = generateParticipants(count);
  config.participants = participantConfig.participants;
  
  try {
    const yamlContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      quotingType: '"',
      forceQuotes: true
    });
    
    console.log(yamlContent);

    if (!isOutputRedirected) {
      console.log(`✅ Generated ${count} participants`);
    }
  } catch (error) {
    console.error('❌ Error writing file:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateParticipants, generateToken };