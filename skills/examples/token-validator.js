/**
 * Example Skill: Token Validator
 * Demonstrates sovereignty checks and validation
 */

import { Skill } from '../../skills.js';

export class TokenValidatorSkill extends Skill {
  constructor(config = {}) {
    super({
      name: 'token-validator',
      description: 'Validates token sequences for sovereignty and safety',
      priority: 100, // High priority to run early
      ...config
    });
    
    this.maxSequenceLength = config.maxSequenceLength || 1024;
    this.blockedPatterns = config.blockedPatterns || [];
  }

  validate(data, type) {
    const issues = [];
    let valid = true;

    // Validate input tokens
    if (type === 'input' && Array.isArray(data)) {
      if (data.length > this.maxSequenceLength) {
        valid = false;
        issues.push(`Token sequence length ${data.length} exceeds maximum ${this.maxSequenceLength}`);
      }

      // Check for invalid token IDs (sovereignty check)
      // Note: In real usage, you should also check against vocab_size as upper bound
      for (const token of data) {
        if (typeof token !== 'number' || token < 0) {
          valid = false;
          issues.push(`Invalid token ID: ${token}`);
        }
      }
    }

    return { valid, issues };
  }

  async preProcess(tokens) {
    // Validate before processing
    const validation = this.validate(tokens, 'input');
    
    if (!validation.valid) {
      console.warn(`[${this.name}] Validation issues:`, validation.issues);
      // Optionally truncate or fix tokens
      if (tokens.length > this.maxSequenceLength) {
        return tokens.slice(0, this.maxSequenceLength);
      }
    }

    return tokens;
  }
}

export default TokenValidatorSkill;
