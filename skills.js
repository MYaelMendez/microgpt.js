/**
 * Skills Capacitor - A modular skill embedding framework for microgpt.js
 * 
 * Enables lightweight, auditable skill definitions that can hook into the inference loop.
 * Maintains zero-dependency philosophy by using pure JavaScript and markdown-based skill definitions.
 * 
 * Skills are optional extensions that users can load at their discretion.
 */

import fs from 'fs';
import path from 'path';

/**
 * Skill definition structure (parsed from markdown):
 * - name: Skill identifier
 * - version: Semantic version
 * - description: Human-readable description
 * - hooks: Object containing hook functions
 *   - beforeInference: Called before each inference step
 *   - afterInference: Called after each inference step
 *   - validate: Validation function for sovereignty checks
 *   - evaluate: Self-checking evaluation function
 */
class Skill {
  constructor(name, version, description, metadata = {}) {
    this.name = name;
    this.version = version;
    this.description = description;
    this.metadata = metadata;
    this.hooks = {
      beforeInference: null,
      afterInference: null,
      validate: null,
      evaluate: null,
    };
  }

  /**
   * Register a hook function
   */
  registerHook(hookName, hookFn) {
    if (this.hooks.hasOwnProperty(hookName)) {
      this.hooks[hookName] = hookFn;
    } else {
      throw new Error(`Unknown hook: ${hookName}`);
    }
  }

  /**
   * Execute a hook if it exists
   */
  executeHook(hookName, context) {
    const hook = this.hooks[hookName];
    if (hook && typeof hook === 'function') {
      return hook(context);
    }
    return null;
  }
}

/**
 * Skills Capacitor - Manages skill loading and execution
 */
class SkillsCapacitor {
  constructor() {
    this.skills = new Map();
    this.enabled = true;
  }

  /**
   * Parse a skill definition from markdown format
   */
  parseSkillMarkdown(content) {
    const lines = content.split('\n');
    let name = 'unnamed-skill';
    let version = '0.0.1';
    let description = '';
    let currentSection = null;
    const metadata = {};
    const codeBlocks = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Parse metadata from YAML-like frontmatter or headers
      if (line.startsWith('# ')) {
        name = line.substring(2).trim();
      } else if (line.startsWith('**Version:**')) {
        version = line.substring('**Version:**'.length).trim();
      } else if (line.startsWith('**Description:**')) {
        description = line.substring('**Description:**'.length).trim();
      } else if (line.startsWith('## ')) {
        currentSection = line.substring(3).trim().toLowerCase().replace(/\s+/g, '_');
      } else if (line.startsWith('```javascript')) {
        // Capture code blocks for hooks
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (currentSection) {
          codeBlocks[currentSection] = codeLines.join('\n');
        }
      }
    }

    const skill = new Skill(name, version, description, metadata);

    // Parse and register hooks from code blocks
    for (const [section, code] of Object.entries(codeBlocks)) {
      try {
        // Create a function from the code block
        // The code should export a function that matches the hook signature
        const hookFn = new Function('context', code + '\nreturn hookFunction;')();
        
        // Map section names to hook names
        const hookMap = {
          'before_inference': 'beforeInference',
          'after_inference': 'afterInference',
          'validate': 'validate',
          'evaluate': 'evaluate',
        };

        const hookName = hookMap[section];
        if (hookName) {
          skill.registerHook(hookName, hookFn);
        }
      } catch (error) {
        console.warn(`Warning: Failed to parse hook '${section}' in skill '${name}':`, error.message);
      }
    }

    return skill;
  }

  /**
   * Load a skill from a markdown file
   */
  loadSkillFromFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const skill = this.parseSkillMarkdown(content);
      this.skills.set(skill.name, skill);
      console.log(`[SkillsCapacitor] Loaded skill: ${skill.name} v${skill.version}`);
      return skill;
    } catch (error) {
      console.error(`[SkillsCapacitor] Failed to load skill from ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Load all skills from a directory
   */
  loadSkillsFromDirectory(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        console.log(`[SkillsCapacitor] Skills directory not found: ${dirPath}`);
        return;
      }

      const files = fs.readdirSync(dirPath);
      const skillFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.skill.md'));

      for (const file of skillFiles) {
        this.loadSkillFromFile(path.join(dirPath, file));
      }

      console.log(`[SkillsCapacitor] Loaded ${this.skills.size} skill(s) from ${dirPath}`);
    } catch (error) {
      console.error(`[SkillsCapacitor] Error loading skills from directory:`, error.message);
    }
  }

  /**
   * Get a skill by name
   */
  getSkill(name) {
    return this.skills.get(name);
  }

  /**
   * List all loaded skills
   */
  listSkills() {
    return Array.from(this.skills.values());
  }

  /**
   * Execute a hook across all loaded skills
   */
  executeHooks(hookName, context) {
    if (!this.enabled) return [];

    const results = [];
    for (const skill of this.skills.values()) {
      try {
        const result = skill.executeHook(hookName, context);
        if (result !== null) {
          results.push({ skill: skill.name, result });
        }
      } catch (error) {
        console.error(`[SkillsCapacitor] Error executing ${hookName} in skill ${skill.name}:`, error.message);
      }
    }
    return results;
  }

  /**
   * Disable/enable skills execution
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// Export a singleton instance
const skillsCapacitor = new SkillsCapacitor();

export { Skill, SkillsCapacitor, skillsCapacitor };
export default skillsCapacitor;
