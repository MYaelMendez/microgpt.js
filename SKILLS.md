# Skills Framework Guide

Welcome to the microgpt.js Skills Framework! This guide will help you create and integrate skills into the microgpt.js platform.

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Creating Skills](#creating-skills)
4. [Skill Hooks](#skill-hooks)
5. [Sovereignty and Validation](#sovereignty-and-validation)
6. [Embeddings](#embeddings)
7. [Examples](#examples)
8. [Best Practices](#best-practices)

## Overview

The Skills Framework transforms microgpt.js into a modular, extensible platform while maintaining its core philosophy:
- **Zero dependencies** - All skills operate without external libraries
- **Browser-native** - Skills work in both Node.js and browser environments
- **Lightweight** - Minimal overhead on the core GPT implementation
- **Sovereign** - Complete local control without cloud dependencies

## Core Concepts

### What is a Skill?

A skill is a modular extension that can:
- Pre-process input tokens before inference
- Post-process output logits after generation
- Handle tool/function calls
- Validate data for sovereignty and safety
- Integrate embeddings for context-aware behavior

### Skill Lifecycle

```
1. Initialize → 2. Register → 3. Execute Hooks → 4. Cleanup
```

### Skill Priority

Skills have a priority value (default: 0). Higher priority skills execute first:
- **100+**: Critical validation and sovereignty checks
- **50-99**: Core functionality modifications
- **10-49**: Enhancement features
- **0-9**: Optional enhancements

## Creating Skills

### Method 1: JavaScript Class (Recommended)

Create a skill by extending the `Skill` base class:

```javascript
import { Skill } from './skills.js';

export class MyCustomSkill extends Skill {
  constructor(config = {}) {
    super({
      name: 'my-custom-skill',
      description: 'Does something amazing',
      priority: 50,
      ...config
    });
    
    // Your custom initialization
    this.customParam = config.customParam || 'default';
  }

  async initialize() {
    // Called once when skill is registered
    console.log('Skill initialized');
  }

  async preProcess(tokens) {
    // Modify tokens before inference
    return tokens;
  }

  async postProcess(logits, context) {
    // Modify logits after generation
    return logits;
  }

  validate(data, type) {
    // Validate input/output
    return { valid: true, issues: [] };
  }

  async cleanup() {
    // Called when skill is unregistered
  }
}
```

### Method 2: JSON Configuration

Create a simple skill definition in JSON:

```json
{
  "name": "my-json-skill",
  "description": "A JSON-defined skill",
  "priority": 25,
  "enabled": true,
  "config": {
    "param1": "value1",
    "param2": 42
  },
  "metadata": {
    "author": "Your Name",
    "version": "1.0.0",
    "tags": ["tag1", "tag2"]
  }
}
```

Load it with:

```javascript
import { loadFromJSON } from './skills.js';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('my-skill.json', 'utf-8'));
const skill = loadFromJSON(config);
```

### Method 3: Markdown Documentation

Define skills in Markdown for documentation-driven development:

```markdown
# My Markdown Skill

## Metadata
description: A skill defined in Markdown
priority: 30
enabled: true

## Instructions
This skill performs the following operations:
- Validates input tokens
- Ensures sovereignty
- Logs processing steps

## Configuration
- maxTokens: 1024
- validateSovereignty: true
```

Load it with:

```javascript
import { loadFromMarkdown } from './skills.js';
import fs from 'fs';

const markdown = fs.readFileSync('my-skill.md', 'utf-8');
const skill = loadFromMarkdown(markdown);
```

## Skill Hooks

### preProcess Hook

Called before tokens are processed by the model:

```javascript
async preProcess(tokens) {
  // Example: Truncate long sequences
  const maxLength = 100;
  if (tokens.length > maxLength) {
    return tokens.slice(0, maxLength);
  }
  return tokens;
}
```

**Use cases:**
- Input sanitization
- Token filtering
- Sequence truncation
- Input transformation

### postProcess Hook

Called after logits are generated but before sampling:

```javascript
async postProcess(logits, context) {
  // Example: Temperature adjustment
  const temperature = 0.8;
  return logits.map(l => l.div(temperature));
}
```

**Use cases:**
- Temperature adjustment
- Logit biasing
- Output filtering
- Context-aware modifications

**Context object:**
```javascript
{
  position: 5,           // Current position in sequence
  maxPosition: 16,       // Maximum sequence length
  partialText: 'emma',   // Partial generated text (if available)
  tokens: [0, 1, 2],     // Current token sequence
  // ... custom fields
}
```

### onToolCall Hook

Handle tool/function calls:

```javascript
async onToolCall(toolName, args) {
  if (toolName === 'myTool') {
    return {
      result: 'Tool executed',
      data: args
    };
  }
  return null; // Skill doesn't handle this tool
}
```

### validate Hook

Validate data for sovereignty and safety:

```javascript
validate(data, type) {
  const issues = [];
  let valid = true;
  
  if (type === 'input') {
    // Check input constraints
    if (Array.isArray(data) && data.length > 1024) {
      valid = false;
      issues.push('Input exceeds maximum length');
    }
  }
  
  return { valid, issues };
}
```

## Sovereignty and Validation

The framework includes built-in sovereignty checks to ensure local operation:

### SovereigntyValidator

Prevents external dependencies and ensures local processing:

```javascript
import { SovereigntyValidator } from './sovereignty.js';

const validator = new SovereigntyValidator({
  name: 'my-sovereignty-check',
  allowedDomains: [],  // No external domains allowed
  blockedPatterns: [
    /https?:\/\//i,    // Block HTTP URLs
    /api\.openai\.com/i,
    /cloud\./i
  ]
});
```

### ValidationEngine

Orchestrate multiple validators:

```javascript
import { ValidationEngine, BoundsValidator, RequiredFieldsValidator } from './sovereignty.js';

const engine = new ValidationEngine();

engine.addValidator(new BoundsValidator({
  name: 'token-bounds',
  min: 0,
  max: 1000
}));

engine.addValidator(new RequiredFieldsValidator({
  name: 'required-fields',
  fields: ['tokens', 'position']
}));

const result = engine.validate(data);
if (!result.valid) {
  console.error('Validation failed:', result.errors);
}
```

### Self-Diagnostics

Monitor system health without cloud dependencies:

```javascript
import { SelfDiagnostic } from './sovereignty.js';

const diagnostic = new SelfDiagnostic();

diagnostic.registerCheck('memory-usage', async () => {
  const usage = process.memoryUsage();
  const threshold = 500 * 1024 * 1024; // 500MB
  
  return {
    status: usage.heapUsed < threshold ? 'ok' : 'warning',
    message: `Heap used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`
  };
});

const results = await diagnostic.runDiagnostics();
console.log('Diagnostics:', results);
```

## Embeddings

The framework provides zero-dependency embedding utilities:

### SimpleEmbedding

Character and n-gram based embeddings:

```javascript
import { SimpleEmbedding } from './embeddings.js';

const embedder = new SimpleEmbedding(16); // 16 dimensions
const embedding = embedder.encode('hello world');
console.log(embedding); // Float32Array[16]
```

### PositionalEmbedding

GPT-style positional encoding:

```javascript
import { PositionalEmbedding } from './embeddings.js';

const posEmbed = new PositionalEmbedding(16, 128);
const embeddings = posEmbed.encode(tokens, tokenEmbeddings);
```

### EmbeddingStore

Store and search embeddings:

```javascript
import { EmbeddingStore, SimilarityMetrics } from './embeddings.js';

const store = new EmbeddingStore();

// Store embeddings
store.store('doc1', embedding1, { type: 'name' });
store.store('doc2', embedding2, { type: 'name' });

// Search for similar
const results = store.search(queryEmbedding, 5, 'cosine');
console.log(results); // [{key, distance, metadata}, ...]
```

### Similarity Metrics

```javascript
import { SimilarityMetrics } from './embeddings.js';

// Cosine similarity
const similarity = SimilarityMetrics.cosineSimilarity(vec1, vec2);

// Euclidean distance
const distance = SimilarityMetrics.euclideanDistance(vec1, vec2);

// k-Nearest Neighbors
const neighbors = SimilarityMetrics.kNearestNeighbors(
  query, 
  vectors, 
  5,        // k=5
  'cosine'  // metric
);
```

## Examples

### Example 1: Temperature Control Skill

```javascript
import { Skill } from './skills.js';

export class TemperatureControlSkill extends Skill {
  constructor(config = {}) {
    super({
      name: 'temperature-control',
      description: 'Dynamic temperature adjustment',
      priority: 10,
      ...config
    });
    
    this.baseTemp = config.baseTemp || 0.5;
  }

  async postProcess(logits, context) {
    // Lower temperature near sequence end
    const ratio = context.position / context.maxPosition;
    const temp = this.baseTemp * (1 - 0.3 * ratio);
    return logits.map(l => l.div(temp));
  }
}
```

### Example 2: Embedding-Based Skill

```javascript
import { Skill } from './skills.js';
import { SimpleEmbedding, EmbeddingStore } from './embeddings.js';

export class SemanticBiasSkill extends Skill {
  constructor(config = {}) {
    super({
      name: 'semantic-bias',
      description: 'Bias generation toward semantic patterns',
      priority: 5,
      ...config
    });
    
    this.embedder = new SimpleEmbedding(16);
    this.store = new EmbeddingStore();
  }

  async initialize() {
    // Pre-populate with examples
    const examples = ['emma', 'olivia', 'sophia'];
    for (const ex of examples) {
      const emb = this.embedder.encode(ex);
      this.store.store(ex, emb);
    }
  }

  async postProcess(logits, context) {
    if (context.partialText) {
      const query = this.embedder.encode(context.partialText);
      const similar = this.store.search(query, 1);
      
      if (similar.length > 0 && similar[0].distance < 0.5) {
        // Found similar pattern, could bias logits
        context.similarPattern = similar[0].key;
      }
    }
    return logits;
  }
}
```

### Example 3: Sovereignty Guard

```javascript
import { Skill } from './skills.js';

export class SovereigntyGuardSkill extends Skill {
  constructor(config = {}) {
    super({
      name: 'sovereignty-guard',
      description: 'Ensures sovereign operation',
      priority: 100,
      ...config
    });
    
    this.blockedPatterns = [
      /https?:\/\//i,
      /api\./i,
      /cloud/i
    ];
  }

  validate(data, type) {
    const issues = [];
    const dataStr = JSON.stringify(data);
    
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(dataStr)) {
        issues.push(`Sovereignty violation: ${pattern}`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}
```

## Best Practices

### 1. Keep Skills Focused

Each skill should do one thing well:
- ✅ Good: `TemperatureControlSkill` - adjusts temperature
- ❌ Bad: `EverythingSkill` - does validation, temperature, and embeddings

### 2. Respect Priority

Set appropriate priorities:
- Critical safety checks: 100+
- Core modifications: 50-99
- Enhancements: 10-49
- Optional features: 0-9

### 3. Maintain Zero Dependencies

Never import external packages:
- ✅ Use built-in JavaScript features
- ✅ Use framework utilities (embeddings.js, sovereignty.js)
- ❌ Don't add npm dependencies

### 4. Validate Gracefully

Return helpful error messages:
```javascript
validate(data, type) {
  if (typeof data !== 'object') {
    return {
      valid: false,
      issues: ['Expected object, got ' + typeof data]
    };
  }
  return { valid: true, issues: [] };
}
```

### 5. Document Your Skills

Include clear descriptions and examples:
```javascript
/**
 * MySkill - Does X, Y, and Z
 * 
 * Configuration:
 * - param1: Description of param1
 * - param2: Description of param2
 * 
 * Example:
 * const skill = new MySkill({ param1: 'value' });
 */
```

### 6. Test Incrementally

Test skills in isolation before integrating:
```javascript
const skill = new MySkill();
await skill.initialize();

const result = await skill.preProcess(testTokens);
console.assert(result.length <= maxLength);
```

### 7. Handle Errors Gracefully

Catch and log errors without breaking the pipeline:
```javascript
async preProcess(tokens) {
  try {
    // Your processing logic
    return processedTokens;
  } catch (error) {
    console.error(`[${this.name}] Error:`, error);
    return tokens; // Return original on error
  }
}
```

## Platform Integration

### Register Skills

```javascript
import { createPlatform } from './platform.js';
import { MySkill } from './skills/my-skill.js';

const platform = createPlatform();

const skill = new MySkill({ param: 'value' });
await platform.registerSkill(skill);
```

### Use in Inference

```javascript
// Pre-process input
const processedTokens = await platform.preprocessTokens(tokens);

// During generation
const processedLogits = await platform.postprocessLogits(logits, context);

// Validate output
const validation = await platform.skillManager.executeValidation(output, 'output');
```

### Run Diagnostics

```javascript
const status = await platform.runDiagnostics();
console.log('Platform status:', status);
```

## Contributing Skills

To contribute a skill to the repository:

1. Create your skill in `skills/examples/`
2. Add documentation in comments
3. Provide usage examples
4. Ensure zero dependencies
5. Test thoroughly
6. Submit a pull request

## Advanced Topics

### Custom Validators

Create validators for specific domains:
```javascript
import { Validator } from './sovereignty.js';

class CustomValidator extends Validator {
  validate(data, context) {
    // Your validation logic
    return { valid: true, issues: [] };
  }
}
```

### Skill Composition

Combine multiple skills:
```javascript
class CompositeSkill extends Skill {
  constructor(skills = []) {
    super({ name: 'composite' });
    this.skills = skills;
  }

  async preProcess(tokens) {
    let result = tokens;
    for (const skill of this.skills) {
      result = await skill.preProcess(result);
    }
    return result;
  }
}
```

### Dynamic Skill Loading

Load skills based on configuration:
```javascript
async function loadSkillFromConfig(config) {
  if (config.type === 'javascript') {
    const module = await import(config.path);
    return new module.default(config.params);
  }
  // ... handle other types
}
```

## Troubleshooting

### Skill Not Executing

Check:
- Skill is registered: `platform.skillManager.list()`
- Skill is enabled: `skill.enabled === true`
- Hook is overridden: Not using default implementation

### Validation Failing

Check:
- Validator is registered: `engine.getValidators()`
- Validator is enabled
- Validation logic is correct

### Performance Issues

- Reduce number of active skills
- Optimize hook implementations
- Use async operations sparingly
- Profile with browser/Node.js tools

## Resources

- [Main README](./README.md) - Project overview
- [skills.js](./skills.js) - Core skill system
- [embeddings.js](./embeddings.js) - Embedding utilities
- [sovereignty.js](./sovereignty.js) - Validation framework
- [platform.js](./platform.js) - Platform integration
- [Examples](./skills/examples/) - Example skills

---

**Happy skill building!** 🚀

For questions or contributions, please open an issue or pull request on GitHub.
