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
  const outputFile = args[1] || path.join(__dirname, '..', 'config', 'participants.yaml');
  
  if (isNaN(count) || count <= 0) {
    console.error('Error: Count must be a positive number');
    process.exit(1);
  }
  
  console.log(`🎯 Generating ${count} participants...`);
  
  const config = generateParticipants(count);
  
  try {
    const yamlContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      quotingType: '"',
      forceQuotes: true
    });
    
    fs.writeFileSync(outputFile, yamlContent, 'utf8');
    console.log(`✅ Generated ${count} participants in ${outputFile}`);
    
    // Display first few for verification
    console.log('\n📋 Sample participants:');
    config.participants.slice(0, 5).forEach(p => {
      console.log(`  - ${p.name}: ${p.token}`);
    });
    
    if (count > 5) {
      console.log(`  ... and ${count - 5} more`);
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