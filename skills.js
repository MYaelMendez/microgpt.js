/**
 * Skills Framework for microgpt.js
 * Zero-dependency modular skill system for extending GPT capabilities
 * 
 * Core concepts:
 * - Skills are modular extensions that can hook into different stages
 * - Skills can be loaded from JSON, Markdown, or JS modules
 * - Maintains zero-dependency philosophy
 */

/**
 * Base Skill class - all skills should extend this or conform to this interface
 */
export class Skill {
  constructor(config = {}) {
    this.name = config.name || 'unnamed-skill';
    this.description = config.description || '';
    this.enabled = config.enabled !== false;
    this.priority = config.priority || 0; // Higher priority runs first
  }

  /**
   * Called before processing input tokens
   * @param {Array} tokens - Input token array
   * @returns {Array} Modified tokens or original
   */
  async preProcess(tokens) {
    return tokens;
  }

  /**
   * Called after generating logits but before sampling
   * @param {Array} logits - Model output logits
   * @param {Object} context - Current generation context
   * @returns {Array} Modified logits or original
   */
  async postProcess(logits, context) {
    return logits;
  }

  /**
   * Called when a tool/function call is detected
   * @param {string} toolName - Name of the tool being called
   * @param {Object} args - Arguments for the tool
   * @returns {Object} Tool result
   */
  async onToolCall(toolName, args) {
    return null; // Skill doesn't handle this tool
  }

  /**
   * Validate input/output for sovereignty checks
   * @param {any} data - Data to validate
   * @param {string} type - 'input' or 'output'
   * @returns {Object} { valid: boolean, issues: string[] }
   */
  validate(data, type) {
    return { valid: true, issues: [] };
  }

  /**
   * Initialize the skill (called once on load)
   */
  async initialize() {
    // Override in subclasses
  }

  /**
   * Cleanup when skill is unloaded
   */
  async cleanup() {
    // Override in subclasses
  }
}

/**
 * SkillManager - Manages loading, lifecycle, and execution of skills
 */
export class SkillManager {
  constructor() {
    this.skills = new Map();
    this.hooks = {
      preProcess: [],
      postProcess: [],
      toolCall: [],
      validate: []
    };
  }

  /**
   * Register a skill instance
   * @param {Skill} skill - Skill instance to register
   */
  async register(skill) {
    if (!(skill instanceof Skill)) {
      throw new Error('Skill must be an instance of Skill class');
    }

    await skill.initialize();
    this.skills.set(skill.name, skill);
    
    // Sort hooks by priority (higher first)
    const sortByPriority = (a, b) => b.priority - a.priority;
    
    if (skill.preProcess !== Skill.prototype.preProcess) {
      this.hooks.preProcess.push(skill);
      this.hooks.preProcess.sort(sortByPriority);
    }
    
    if (skill.postProcess !== Skill.prototype.postProcess) {
      this.hooks.postProcess.push(skill);
      this.hooks.postProcess.sort(sortByPriority);
    }
    
    if (skill.onToolCall !== Skill.prototype.onToolCall) {
      this.hooks.toolCall.push(skill);
      this.hooks.toolCall.sort(sortByPriority);
    }
    
    if (skill.validate !== Skill.prototype.validate) {
      this.hooks.validate.push(skill);
      this.hooks.validate.sort(sortByPriority);
    }

    return this;
  }

  /**
   * Unregister a skill by name
   * @param {string} name - Skill name
   */
  async unregister(name) {
    const skill = this.skills.get(name);
    if (!skill) return false;

    await skill.cleanup();
    this.skills.delete(name);
    
    // Remove from hooks
    for (const hookType in this.hooks) {
      this.hooks[hookType] = this.hooks[hookType].filter(s => s.name !== name);
    }
    
    return true;
  }

  /**
   * Execute preProcess hooks
   * @param {Array} tokens - Input tokens
   * @returns {Array} Processed tokens
   */
  async executePreProcess(tokens) {
    let processed = tokens;
    for (const skill of this.hooks.preProcess) {
      if (skill.enabled) {
        processed = await skill.preProcess(processed);
      }
    }
    return processed;
  }

  /**
   * Execute postProcess hooks
   * @param {Array} logits - Model logits
   * @param {Object} context - Generation context
   * @returns {Array} Processed logits
   */
  async executePostProcess(logits, context) {
    let processed = logits;
    for (const skill of this.hooks.postProcess) {
      if (skill.enabled) {
        processed = await skill.postProcess(processed, context);
      }
    }
    return processed;
  }

  /**
   * Execute tool call hooks
   * @param {string} toolName - Tool name
   * @param {Object} args - Tool arguments
   * @returns {Object} Tool result or null
   */
  async executeToolCall(toolName, args) {
    for (const skill of this.hooks.toolCall) {
      if (skill.enabled) {
        const result = await skill.onToolCall(toolName, args);
        if (result !== null) {
          return result; // First skill to handle wins
        }
      }
    }
    return null;
  }

  /**
   * Execute validation hooks
   * @param {any} data - Data to validate
   * @param {string} type - 'input' or 'output'
   * @returns {Object} Validation results
   */
  async executeValidation(data, type) {
    const allIssues = [];
    let allValid = true;

    for (const skill of this.hooks.validate) {
      if (skill.enabled) {
        const result = skill.validate(data, type);
        if (!result.valid) {
          allValid = false;
          allIssues.push(...result.issues.map(issue => `[${skill.name}] ${issue}`));
        }
      }
    }

    return { valid: allValid, issues: allIssues };
  }

  /**
   * Get skill by name
   * @param {string} name - Skill name
   * @returns {Skill|undefined}
   */
  get(name) {
    return this.skills.get(name);
  }

  /**
   * List all registered skills
   * @returns {Array} Array of skill names
   */
  list() {
    return Array.from(this.skills.keys());
  }

  /**
   * Get skill information
   * @returns {Array} Array of skill info objects
   */
  getInfo() {
    return Array.from(this.skills.values()).map(skill => ({
      name: skill.name,
      description: skill.description,
      enabled: skill.enabled,
      priority: skill.priority
    }));
  }
}

/**
 * Load a skill from a JSON configuration
 * @param {Object} config - JSON configuration
 * @returns {Skill} Skill instance
 */
export function loadFromJSON(config) {
  class JSONSkill extends Skill {
    constructor(cfg) {
      super(cfg);
      this.config = cfg;
    }

    async preProcess(tokens) {
      if (this.config.preProcess && typeof this.config.preProcess === 'function') {
        return this.config.preProcess(tokens);
      }
      return tokens;
    }

    async postProcess(logits, context) {
      if (this.config.postProcess && typeof this.config.postProcess === 'function') {
        return this.config.postProcess(logits, context);
      }
      return logits;
    }

    validate(data, type) {
      if (this.config.validate && typeof this.config.validate === 'function') {
        return this.config.validate(data, type);
      }
      return { valid: true, issues: [] };
    }
  }

  return new JSONSkill(config);
}

/**
 * Load a skill from a Markdown file content
 * @param {string} markdown - Markdown content
 * @returns {Skill} Skill instance
 */
export function loadFromMarkdown(markdown) {
  // Parse markdown to extract skill metadata and instructions
  const lines = markdown.split('\n');
  const config = {
    name: 'markdown-skill',
    description: '',
    instructions: []
  };

  let inMetadata = false;
  let inInstructions = false;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      config.name = line.slice(2).trim().toLowerCase().replace(/\s+/g, '-');
    } else if (line.startsWith('## Metadata')) {
      inMetadata = true;
      inInstructions = false;
    } else if (line.startsWith('## Instructions')) {
      inInstructions = true;
      inMetadata = false;
    } else if (inMetadata && line.includes(':')) {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key === 'description') config.description = value;
      if (key === 'priority') config.priority = parseInt(value);
    } else if (inInstructions && line.trim()) {
      config.instructions.push(line.trim());
    }
  }

  class MarkdownSkill extends Skill {
    constructor(cfg) {
      super(cfg);
      this.instructions = cfg.instructions || [];
    }
  }

  return new MarkdownSkill(config);
}

export default { Skill, SkillManager, loadFromJSON, loadFromMarkdown };
