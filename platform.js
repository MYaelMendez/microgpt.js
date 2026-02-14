/**
 * microgpt.js Modular Platform
 * Main integration file for skills, embeddings, and sovereignty
 * 
 * This extends the base microgpt.js with a modular skill system
 * while maintaining zero-dependency philosophy
 */

import { SkillManager } from './skills.js';
import { ValidationEngine, SovereigntyValidator, SelfDiagnostic } from './sovereignty.js';
import { SimpleEmbedding, EmbeddingStore } from './embeddings.js';

/**
 * MicroGPT Platform - Extended version with skills support
 */
export class MicroGPTPlatform {
  constructor(config = {}) {
    this.skillManager = new SkillManager();
    this.validationEngine = new ValidationEngine();
    this.selfDiagnostic = new SelfDiagnostic();
    this.embedder = new SimpleEmbedding(config.embeddingDimensions || 16);
    this.embeddingStore = new EmbeddingStore();
    
    this.config = {
      enableSovereignty: config.enableSovereignty !== false,
      enableValidation: config.enableValidation !== false,
      enableDiagnostics: config.enableDiagnostics !== false,
      ...config
    };

    this._initializeDefaultValidators();
    this._initializeDiagnostics();
  }

  /**
   * Initialize default sovereignty validators
   * @private
   */
  _initializeDefaultValidators() {
    if (this.config.enableSovereignty) {
      const sovereigntyValidator = new SovereigntyValidator({
        name: 'default-sovereignty',
        description: 'Ensures local, sovereign operation',
        enabled: true
      });
      this.validationEngine.addValidator(sovereigntyValidator);
    }
  }

  /**
   * Initialize diagnostic checks
   * @private
   */
  _initializeDiagnostics() {
    if (this.config.enableDiagnostics) {
      this.selfDiagnostic.registerCheck('skills-loaded', async () => {
        const skills = this.skillManager.list();
        return {
          status: skills.length > 0 ? 'ok' : 'warning',
          message: `${skills.length} skills loaded`
        };
      });

      this.selfDiagnostic.registerCheck('validation-active', async () => {
        const validators = this.validationEngine.getValidators();
        return {
          status: validators.length > 0 ? 'ok' : 'warning',
          message: `${validators.length} validators active`
        };
      });

      this.selfDiagnostic.registerCheck('embeddings-available', async () => {
        return {
          status: this.embedder ? 'ok' : 'error',
          message: this.embedder ? 'Embedding system operational' : 'Embeddings unavailable'
        };
      });
    }
  }

  /**
   * Register a skill
   * @param {Skill} skill - Skill instance
   */
  async registerSkill(skill) {
    await this.skillManager.register(skill);
    console.log(`[Platform] Registered skill: ${skill.name}`);
  }

  /**
   * Load skills from directory (for Node.js environments)
   * @param {string} directory - Directory path
   */
  async loadSkillsFromDirectory(directory) {
    // This would be implemented for specific environments
    console.log(`[Platform] Skills directory loading not implemented yet: ${directory}`);
  }

  /**
   * Process tokens with pre-processing hooks
   * @param {Array} tokens - Input tokens
   * @returns {Array} Processed tokens
   */
  async preprocessTokens(tokens) {
    // Validate input if enabled
    if (this.config.enableValidation) {
      const validation = await this.skillManager.executeValidation(tokens, 'input');
      if (!validation.valid && validation.issues.length > 0) {
        console.warn('[Platform] Input validation issues:', validation.issues);
      }
    }

    // Execute pre-processing hooks
    return await this.skillManager.executePreProcess(tokens);
  }

  /**
   * Process logits with post-processing hooks
   * @param {Array} logits - Model output logits
   * @param {Object} context - Generation context
   * @returns {Array} Processed logits
   */
  async postprocessLogits(logits, context) {
    // Execute post-processing hooks
    const processed = await this.skillManager.executePostProcess(logits, context);

    // Validate output if enabled
    if (this.config.enableValidation) {
      const validation = await this.skillManager.executeValidation(processed, 'output');
      if (!validation.valid && validation.issues.length > 0) {
        console.warn('[Platform] Output validation issues:', validation.issues);
      }
    }

    return processed;
  }

  /**
   * Handle tool calls
   * @param {string} toolName - Tool name
   * @param {Object} args - Tool arguments
   * @returns {any} Tool result
   */
  async handleToolCall(toolName, args) {
    return await this.skillManager.executeToolCall(toolName, args);
  }

  /**
   * Generate embedding for text
   * @param {string} text - Input text
   * @returns {Float32Array} Embedding vector
   */
  generateEmbedding(text) {
    return this.embedder.encode(text);
  }

  /**
   * Store embedding with metadata
   * @param {string} key - Unique identifier
   * @param {string} text - Text to embed
   * @param {Object} metadata - Additional metadata
   */
  storeEmbedding(key, text, metadata = {}) {
    const embedding = this.generateEmbedding(text);
    this.embeddingStore.store(key, embedding, metadata);
  }

  /**
   * Search for similar embeddings
   * @param {string} query - Query text
   * @param {number} k - Number of results
   * @returns {Array} Search results
   */
  searchSimilar(query, k = 5) {
    const queryEmbedding = this.generateEmbedding(query);
    return this.embeddingStore.search(queryEmbedding, k);
  }

  /**
   * Run system diagnostics
   * @returns {Object} Diagnostic results
   */
  async runDiagnostics() {
    if (!this.config.enableDiagnostics) {
      return { status: 'disabled' };
    }
    return await this.selfDiagnostic.runDiagnostics();
  }

  /**
   * Get platform status
   * @returns {Object} Platform status information
   */
  getStatus() {
    return {
      skills: this.skillManager.getInfo(),
      validators: this.validationEngine.getValidators(),
      embeddings: {
        count: this.embeddingStore.size(),
        dimensions: this.embedder.dimensions
      },
      config: this.config
    };
  }

  /**
   * Enable/disable sovereignty mode
   * @param {boolean} enabled - Whether to enable
   */
  setSovereigntyMode(enabled) {
    this.config.enableSovereignty = enabled;
    // Update actual validator instances, not just their info
    for (const validator of this.validationEngine.validators) {
      if (validator.name.includes('sovereignty')) {
        validator.enabled = enabled;
      }
    }
  }
}

/**
 * Create a platform instance with default configuration
 * @param {Object} config - Configuration options
 * @returns {MicroGPTPlatform} Platform instance
 */
export function createPlatform(config = {}) {
  return new MicroGPTPlatform(config);
}

export default {
  MicroGPTPlatform,
  createPlatform
};
