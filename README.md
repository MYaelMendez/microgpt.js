
# microgpt.js

The most atomic way to train and inference a GPT in pure, dependency-free JavaScript.
This repository covers the complete algorithm.
Everything else is just efficiency.

Adapted from Karpathy's [microgpt.py](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95). This implementation matches the original exactly, but now can run in JavaScript environments, including browsers and Node.js.

![py-vs-js](https://github.com/user-attachments/assets/5dfe8e81-e7a9-4a81-844b-a24a133f54d7)

## 🚀 New: Modular Skills Platform

microgpt.js now includes a **modular skills framework** that transforms it into an extensible platform for AI development while maintaining its zero-dependency philosophy. Build sovereign, lightweight AI agents with OpenClaw-like capabilities!

### Key Features

- **🔌 Skills Framework**: Modular system for extending GPT capabilities
- **🛡️ Sovereignty Checks**: Built-in validation for local-first operation
- **📊 Embeddings**: Zero-dependency embedding generation and similarity search
- **🔧 Extensible Hooks**: Pre/post-processing, tool calls, and validation hooks
- **📝 Multiple Formats**: Load skills from JavaScript, JSON, or Markdown
- **🎯 Lightweight**: Maintains the core philosophy of zero external dependencies

### Quick Start with Skills

```javascript
import { createPlatform } from './platform.js';
import { TemperatureControlSkill } from './skills/examples/temperature-control.js';

// Create platform instance
const platform = createPlatform({
  enableSovereignty: true,
  enableValidation: true
});

// Register a skill
const skill = new TemperatureControlSkill({ baseTemperature: 0.5 });
await platform.registerSkill(skill);

// Use in your inference pipeline
const processedTokens = await platform.preprocessTokens(inputTokens);
const processedLogits = await platform.postprocessLogits(logits, context);

// Run diagnostics
const status = await platform.runDiagnostics();
console.log('Platform status:', status);
```

### Architecture

```
microgpt.js (core)
├── skills.js          - Skill framework and manager
├── embeddings.js      - Embedding utilities (zero-dependency)
├── sovereignty.js     - Validation and sovereignty checks
├── platform.js        - Main integration platform
└── skills/
    └── examples/      - Example skills
        ├── temperature-control.js
        ├── token-validator.js
        ├── embedding-similarity.js
        ├── length-limiter.json
        └── sovereignty-guard.md
```

### Creating Your First Skill

```javascript
import { Skill } from './skills.js';

export class MySkill extends Skill {
  constructor(config = {}) {
    super({
      name: 'my-skill',
      description: 'Does something cool',
      priority: 50,
      ...config
    });
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
    // Validate for sovereignty and safety
    return { valid: true, issues: [] };
  }
}
```

### Example Skills Included

1. **Temperature Control** - Dynamic temperature adjustment based on context
2. **Token Validator** - Input/output validation for sovereignty
3. **Embedding Similarity** - Context-aware generation using embeddings
4. **Length Limiter** - Prevents excessive generation (JSON config)
5. **Sovereignty Guard** - Ensures local-only operation (Markdown spec)

### Documentation

- **[SKILLS.md](./SKILLS.md)** - Complete guide to creating and using skills
- **[skills.js](./skills.js)** - Core skill system API
- **[embeddings.js](./embeddings.js)** - Embedding utilities
- **[sovereignty.js](./sovereignty.js)** - Validation framework
- **[platform.js](./platform.js)** - Platform integration

### Use Cases

- **Sovereign AI Systems**: Run AI completely locally without cloud dependencies
- **Lightweight Agents**: Build AI agents with minimal overhead
- **OpenClaw-like Workflows**: Integrate skills and embeddings for advanced capabilities
- **Educational Projects**: Learn about GPT internals and skill composition
- **Research Platforms**: Experiment with model modifications and extensions

---

## Original microgpt.js Usage

The core `microgpt.js` file remains unchanged and can be used standalone:
