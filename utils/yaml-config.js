const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * YAML Configuration Utility
 */
class YamlConfig {
  /**
   * Load YAML configuration file
   */
  static loadConfig(yamlPath) {
    try {
      if (!fs.existsSync(yamlPath)) {
        console.log(`⚠️  No config file found at ${yamlPath}`);
        return null;
      }
      
      console.log(`📄 Loading YAML config: ${yamlPath}`);
      const yamlContent = fs.readFileSync(yamlPath, 'utf8');
      return yaml.load(yamlContent);
    } catch (error) {
      console.error(`❌ Error loading YAML config from ${yamlPath}:`, error.message);
      return null;
    }
  }

  /**
   * Load main configuration file
   */
  static loadMainConfig() {
    const yamlPath = path.join(__dirname, '..', 'config', 'config.yaml');
    return this.loadConfig(yamlPath);
  }

  /**
   * Load challenges from main config
   */
  static loadChallenges() {
    const config = this.loadMainConfig();
    return config?.challenges || [];
  }

  /**
   * Load participants from main config
   */
  static loadParticipants() {
    const config = this.loadMainConfig();
    return config?.participants || [];
  }

  /**
   * Load organizers from main config
   */
  static loadOrganizers() {
    const config = this.loadMainConfig();
    return config?.organizers || [];
  }

  /**
   * Validate challenge data structure
   */
  static validateChallenges(challenges) {
    const errors = [];
    
    challenges.forEach((challenge, index) => {
      const prefix = `Challenge ${index + 1}`;
      
      if (!challenge.name || typeof challenge.name !== 'string') {
        errors.push(`${prefix}: Missing or invalid name`);
      }
      
      if (!challenge.description || typeof challenge.description !== 'string') {
        errors.push(`${prefix}: Missing or invalid description`);
      }
      
      if (!challenge.flag || typeof challenge.flag !== 'string') {
        errors.push(`${prefix}: Missing or invalid flag`);
      }
      
      if (!challenge.points || typeof challenge.points !== 'number' || challenge.points <= 0) {
        errors.push(`${prefix}: Missing or invalid points (must be positive number)`);
      }
      
      // Hint is optional
      if (challenge.hint && typeof challenge.hint !== 'string') {
        errors.push(`${prefix}: Invalid hint (must be string)`);
      }
    });
    
    return errors;
  }

  /**
   * Validate participant data structure
   */
  static validateParticipants(participants) {
    const errors = [];
    const tokens = new Set();
    
    participants.forEach((participant, index) => {
      const prefix = `Participant ${index + 1}`;
      
      if (!participant.token || typeof participant.token !== 'string') {
        errors.push(`${prefix}: Missing or invalid token`);
      } else if (tokens.has(participant.token)) {
        errors.push(`${prefix}: Duplicate token "${participant.token}"`);
      } else {
        tokens.add(participant.token);
      }
      
      if (!participant.name || typeof participant.name !== 'string') {
        errors.push(`${prefix}: Missing or invalid name`);
      }
    });
    
    return errors;
  }

  /**
   * Validate organizer data structure
   */
  static validateOrganizers(organizers) {
    const errors = [];
    const tokens = new Set();
    
    organizers.forEach((organizer, index) => {
      const prefix = `Organizer ${index + 1}`;
      
      if (!organizer.token || typeof organizer.token !== 'string') {
        errors.push(`${prefix}: Missing or invalid token`);
      } else if (tokens.has(organizer.token)) {
        errors.push(`${prefix}: Duplicate token "${organizer.token}"`);
      } else {
        tokens.add(organizer.token);
      }
      
      if (!organizer.name || typeof organizer.name !== 'string') {
        errors.push(`${prefix}: Missing or invalid name`);
      }
    });
    
    return errors;
  }

  /**
   * Save configuration to YAML file
   */
  static saveConfig(data, filePath) {
    try {
      const yamlContent = yaml.dump(data, {
        indent: 2,
        lineWidth: 120,
        quotingType: '"',
        forceQuotes: true
      });
      
      fs.writeFileSync(filePath, yamlContent, 'utf8');
      console.log(`✅ Configuration saved to ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Error saving config to ${filePath}:`, error.message);
      return false;
    }
  }

  /**
   * Generate sample YAML configurations
   */
  static generateSampleConfigs() {
    const configDir = path.join(__dirname, '..', 'config');
    
    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Sample challenges
    const sampleChallenges = {
      challenges: [
        {
          name: "Web Challenge 1",
          description: "Find the hidden flag in the web application",
          flag: "CTF{web_security_basics}",
          points: 100,
          hint: "Look at the page source code"
        },
        {
          name: "Crypto Challenge 1",
          description: "Decode the encrypted message",
          flag: "CTF{caesar_cipher_decoded}",
          points: 150,
          hint: "Try different shift values"
        }
      ]
    };

    // Sample participants
    const sampleParticipants = {
      participants: [
        {
          token: "TEAM-001",
          name: "Team Alpha"
        },
        {
          token: "TEAM-002",
          name: "Team Beta"
        }
      ]
    };

    // Sample organizers
    const sampleOrganizers = {
      organizers: [
        {
          token: "ADMIN-001",
          name: "Admin User"
        }
      ]
    };

    // Save sample files
    this.saveConfig(sampleChallenges, path.join(configDir, 'challenges.sample.yaml'));
    this.saveConfig(sampleParticipants, path.join(configDir, 'participants.sample.yaml'));
    this.saveConfig(sampleOrganizers, path.join(configDir, 'organizers.sample.yaml'));
  }
}

module.exports = YamlConfig;