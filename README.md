
# microgpt.js

The most atomic way to train and inference a GPT in pure, dependency-free JavaScript.
This repository covers the complete algorithm.
Everything else is just efficiency.

Adapted from Karpathy's [microgpt.py](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95). This implementation matches the original exactly, but now can run in JavaScript environments, including browsers and Node.js.

![py-vs-js](https://github.com/user-attachments/assets/5dfe8e81-e7a9-4a81-844b-a24a133f54d7)

## Features

- **Pure JavaScript**: Zero dependencies, runs anywhere JavaScript runs
- **Complete Implementation**: Full GPT training and inference algorithm
- **Skills Capacitor**: Modular extension system for sovereignty checks, invariants, and custom behaviors
- **Browser & Node.js**: Compatible with both environments

## Quick Start

### Basic Usage (Original)

```bash
node microgpt.js
```

### With Skills Capacitor

```bash
node microgpt-with-skills.js
```

The skills-enabled version demonstrates how to integrate modular extensions like:
- **molt-invariant**: Validates model invariants and detects drift
- **mcp64-seal**: Sovereignty validation and audit trails
- **hydrofoil-escape**: Emergency halt mechanism for anomaly detection

## Skills Capacitor

The Skills Capacitor is a lightweight framework for extending `microgpt.js` with modular, auditable skill definitions. Skills are defined in markdown files and can hook into the training and inference loops without adding dependencies.

### ⚠️ Security Warning

**Skills execute arbitrary JavaScript code.** Only load skills from trusted, audited sources. Always review skill code before loading. Never load skills from untrusted sources without thorough code review. See [SKILLS.md](SKILLS.md) for details.

### Features

- **Modular**: Skills are independent, self-contained extensions
- **Human-Readable**: Defined in markdown with embedded JavaScript
- **Zero Dependencies**: Pure JavaScript, no external libraries
- **Optional**: Skills don't affect core functionality
- **Auditable**: All behavior is transparent and version-controlled

### Creating Skills

Skills are defined in markdown files in the `skills/` directory:

```markdown
# my-skill

**Version:** 1.0.0
**Description:** What the skill does

## Validate

\`\`\`javascript
const hookFunction = (context) => {
  // Your validation logic
  return { valid: true };
};
\`\`\`
```

### Built-in Skills

- **molt-invariant**: Validates loss values, probability distributions, and numerical stability
- **mcp64-seal**: Sovereignty checks and cryptographic seals for audit trails
- **hydrofoil-escape**: Emergency circuit breaker for drift detection and runaway prevention

See [SKILLS.md](SKILLS.md) for complete documentation.

## Project Structure

```
microgpt.js/
├── microgpt.js              # Original implementation
├── microgpt-with-skills.js  # Skills-enabled version
├── random.js                # Mersenne Twister RNG
├── skills.js                # Skills Capacitor framework
├── skills/                  # Skill definitions
│   ├── molt-invariant.skill.md
│   ├── mcp64-seal.skill.md
│   └── hydrofoil-escape.skill.md
├── SKILLS.md                # Skills documentation
└── input.txt                # Training data
```

## Documentation

- [SKILLS.md](SKILLS.md) - Complete Skills Capacitor documentation
- [LICENSE](LICENSE) - Project license

## Philosophy

This implementation prioritizes:
1. **Clarity**: Every line is understandable
2. **Completeness**: Full algorithm, no shortcuts
3. **Zero Dependencies**: Pure JavaScript only
4. **Modularity**: Optional extensions via Skills Capacitor
5. **Auditability**: Transparent, inspectable code

## License

MIT
