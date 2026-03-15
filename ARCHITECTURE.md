# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MicroGPT Platform                        │
│                      (platform.js)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────┐      ┌─────────────────────────┐  │
│  │   SkillManager     │      │  ValidationEngine       │  │
│  │   (skills.js)      │      │  (sovereignty.js)       │  │
│  ├────────────────────┤      ├─────────────────────────┤  │
│  │ • Register skills  │      │ • Validators            │  │
│  │ • Execute hooks    │      │ • Sovereignty checks    │  │
│  │ • Priority sorting │      │ • Invariant checking    │  │
│  │ • Skill lifecycle  │      │ • Self-diagnostics      │  │
│  └────────────────────┘      └─────────────────────────┘  │
│           ▲                              ▲                 │
│           │                              │                 │
│  ┌────────▼──────────┐      ┌───────────▼─────────────┐  │
│  │   Embeddings      │      │   Core microgpt.js      │  │
│  │   (embeddings.js) │      │   (microgpt.js)         │  │
│  ├───────────────────┤      ├─────────────────────────┤  │
│  │ • Generator       │      │ • GPT Model             │  │
│  │ • Store           │      │ • Training              │  │
│  │ • Similarity      │      │ • Inference             │  │
│  │ • Metrics         │      │ • Autograd              │  │
│  └───────────────────┘      └─────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │    Skills Library     │
                    ├───────────────────────┤
                    │ • temperature-control │
                    │ • token-validator     │
                    │ • embedding-similarity│
                    │ • length-limiter      │
                    │ • sovereignty-guard   │
                    │ • ... (extensible)    │
                    └───────────────────────┘
```

## Data Flow

### Inference Pipeline with Skills

```
Input Tokens
     │
     ▼
┌────────────────┐
│  Pre-Process   │ ◄── Skills: preProcess()
│  Hooks         │     • Token validation
└────────┬───────┘     • Input sanitization
         │             • Sequence transformation
         ▼
┌────────────────┐
│  Core GPT      │ ◄── Original microgpt.js
│  Forward Pass  │     • Token embeddings
└────────┬───────┘     • Attention layers
         │             • Generate logits
         ▼
┌────────────────┐
│  Post-Process  │ ◄── Skills: postProcess()
│  Hooks         │     • Temperature control
└────────┬───────┘     • Logit biasing
         │             • Output filtering
         ▼
┌────────────────┐
│  Validation    │ ◄── Skills: validate()
│  Hooks         │     • Sovereignty checks
└────────┬───────┘     • Safety validation
         │
         ▼
Output Tokens
```

## Component Interactions

### Skill Registration Flow

```
1. Create Skill Instance
   ┌──────────────────────┐
   │ new MySkill(config)  │
   └──────────┬───────────┘
              │
2. Register   ▼
   ┌──────────────────────┐
   │ platform.register    │
   │  Skill(skill)        │
   └──────────┬───────────┘
              │
3. Initialize ▼
   ┌──────────────────────┐
   │ skill.initialize()   │
   └──────────┬───────────┘
              │
4. Sort Hooks ▼
   ┌──────────────────────┐
   │ Sort by priority     │
   └──────────┬───────────┘
              │
5. Ready      ▼
   ┌──────────────────────┐
   │ Skill active         │
   └──────────────────────┘
```

### Embedding Flow

```
Text Input
     │
     ▼
┌────────────────┐
│ SimpleEmbedding│
│ .encode(text)  │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Character &    │
│ N-gram features│
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Normalize      │
└────────┬───────┘
         │
         ▼
Float32Array
     │
     ▼
┌────────────────┐
│ EmbeddingStore │
│ .store(...)    │
└────────────────┘
```

### Validation Flow

```
Data Input
     │
     ▼
┌────────────────────┐
│ ValidationEngine   │
│ .validate(data)    │
└──────┬─────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ For each enabled validator:      │
│                                   │
│  ┌─────────────────────────────┐ │
│  │ BoundsValidator             │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ TypeValidator               │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ SovereigntyValidator        │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ ... (more validators)       │ │
│  └─────────────────────────────┘ │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────┐
│ Aggregate Results    │
│ • valid: boolean     │
│ • issues: []         │
│ • errors: []         │
│ • warnings: []       │
└──────────────────────┘
```

## File Dependencies

```
platform.js
    ├── skills.js
    │   └── (no dependencies)
    ├── embeddings.js
    │   └── (no dependencies)
    └── sovereignty.js
        └── (no dependencies)

microgpt-with-skills.js
    ├── platform.js
    ├── skills/examples/*.js
    ├── random.js
    └── microgpt.js (optional integration)

example-platform.js
    ├── platform.js
    └── skills/examples/*.js
```

## Skill Hook Execution Order

```
Priority: 100 (Highest)
    ├── token-validator (preProcess)
    │   └── Validates tokens before processing
    │
Priority: 50
    │
Priority: 10
    ├── temperature-control (postProcess)
    │   └── Adjusts sampling temperature
    │
Priority: 5
    └── embedding-similarity (postProcess)
        └── Biases output based on similarity
```

## Extension Points

### Adding a New Skill

```javascript
import { Skill } from './skills.js';

export class CustomSkill extends Skill {
  // 1. Define configuration
  constructor(config) {
    super({ name: 'custom', ...config });
  }

  // 2. Implement hooks (optional)
  async preProcess(tokens) { }
  async postProcess(logits, ctx) { }
  async onToolCall(name, args) { }
  validate(data, type) { }

  // 3. Lifecycle methods (optional)
  async initialize() { }
  async cleanup() { }
}

// 4. Use it
const skill = new CustomSkill(config);
await platform.registerSkill(skill);
```

### Adding a New Validator

```javascript
import { Validator } from './sovereignty.js';

export class CustomValidator extends Validator {
  constructor(config) {
    super({ name: 'custom', ...config });
  }

  validate(data, context) {
    // Return { valid, issues }
  }
}

// Use it
engine.addValidator(new CustomValidator());
```

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Skill registration | O(n log n) | Sort by priority |
| Hook execution | O(k) | k = number of skills |
| Embedding generation | O(m) | m = text length |
| Similarity search | O(n*d) | n = store size, d = dimensions |
| Validation | O(v*c) | v = validators, c = check complexity |

### Space Complexity

| Component | Space | Notes |
|-----------|-------|-------|
| Skills | O(n) | n = number of skills |
| Embeddings | O(n*d) | n = stored items, d = dimensions |
| Validators | O(v) | v = number of validators |

## Threading Model

All operations are single-threaded and synchronous (with async/await for API consistency):

```
Main Thread
    │
    ├── Skill hooks (sequential by priority)
    ├── Embedding operations (synchronous)
    ├── Validation checks (sequential)
    └── Diagnostics (synchronous)
```

## Memory Management

### Efficient Memory Usage

1. **TypedArrays**: Float32Array for embeddings
2. **Map/Set**: Fast lookups for skills/validators
3. **Lazy Loading**: Skills loaded on demand
4. **Cleanup Hooks**: Proper resource disposal

## Browser vs Node.js

### Compatible Features
- ✅ All core functionality
- ✅ Skills framework
- ✅ Embeddings
- ✅ Validation
- ✅ Platform API

### Node.js Specific
- File I/O (fs module)
- Process monitoring

### Browser Specific
- Local storage (potential future feature)
- Web Workers (potential future feature)

## Security Model

```
┌─────────────────────────────────────┐
│      Sovereignty Boundary           │
├─────────────────────────────────────┤
│                                     │
│  ✓ All computation local            │
│  ✓ No external network calls        │
│  ✓ No cloud dependencies            │
│  ✓ No credential storage            │
│  ✓ Input validation active          │
│  ✓ Output sanitization              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  SovereigntyValidator       │   │
│  │  • Blocks external URLs      │   │
│  │  • Checks for API keys       │   │
│  │  • Validates local operation │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

## Zero-Dependency Philosophy

Every component maintains zero external dependencies:

```
✅ Built-in JavaScript only
✅ Native APIs (Map, Set, Float32Array)
✅ ES6+ features
✅ No npm packages
✅ No bundlers required
✅ Works in vanilla environments
```

---

For detailed API documentation, see [API.md](./API.md)
For skill development guide, see [SKILLS.md](./SKILLS.md)
For contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md)
