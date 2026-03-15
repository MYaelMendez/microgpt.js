/**
 * Example Skill: Temperature Control
 * Demonstrates how to create a skill that modifies inference behavior
 */

import { Skill } from '../../skills.js';

export class TemperatureControlSkill extends Skill {
  constructor(config = {}) {
    super({
      name: 'temperature-control',
      description: 'Controls sampling temperature dynamically based on context',
      priority: 10,
      ...config
    });
    
    this.baseTemperature = config.baseTemperature || 0.5;
    this.minTemperature = config.minTemperature || 0.1;
    this.maxTemperature = config.maxTemperature || 1.0;
  }

  /**
   * Adjust temperature dynamically based on context
   * @param {Array} logits - Model output logits (Value objects with .div() method)
   * @param {Object} context - Generation context with position info
   * @returns {Array} Temperature-scaled logits
   */
  async postProcess(logits, context) {
    // Adjust temperature based on context
    // For example, lower temperature at the end of sequences
    const position = context.position || 0;
    const maxPosition = context.maxPosition || 16;
    
    // Decrease temperature as we approach max length for more coherent endings
    const positionRatio = position / maxPosition;
    const temperature = this.baseTemperature * (1 - 0.3 * positionRatio);
    const adjustedTemp = Math.max(this.minTemperature, Math.min(this.maxTemperature, temperature));
    
    // Apply temperature scaling (logits are Value objects from microgpt.js)
    return logits.map(l => l.div(adjustedTemp));
  }
}

export default TemperatureControlSkill;
