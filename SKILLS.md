# Skills Capacitor

The Skills Capacitor is a modular framework for extending `microgpt.js` with lightweight, auditable skill definitions. It enables developers to add custom behaviors, validations, and monitoring to the inference loop while maintaining the project's zero-dependency philosophy.

## ⚠️ Security Warning

**Skills execute arbitrary JavaScript code within your application context.** Before loading skills:

1. **Always review skill code** before loading from any source
2. **Never load skills from untrusted sources** without thorough code review
3. **Skills have full access** to model parameters and application state
4. **Consider the risk** when loading skills in production environments

Skills are meant for trusted, audited code only. The Skills Capacitor provides no sandboxing or code execution restrictions.

## Philosophy

- **Modular**: Skills are independent, self-contained units of functionality
- **Human-Readable**: Skills are defined in markdown files with embedded JavaScript
- **Zero Dependencies**: Skills use only standard JavaScript features
- **Optional**: Skills are opt-in extensions that don't affect core functionality
- **Auditable**: All skill behavior is transparent and version-controlled

## Architecture

### Components

1. **Skills Capacitor** (`skills.js`): Core skill management system
   - Loads skills from markdown files
   - Manages skill lifecycle
   - Executes skill hooks during inference

2. **Skill Definitions** (`skills/*.skill.md`): Markdown files containing:
   - Metadata (name, version, description)
   - Hook implementations (JavaScript code blocks)
   - Documentation and usage examples

3. **Hooks**: Integration points in the inference loop
   - `beforeInference`: Called before each inference step
   - `afterInference`: Called after each inference step
   - `validate`: Validates model state and invariants
   - `evaluate`: Self-checking evaluations and receipts

## Skill Format

Skills are defined in markdown files with the following structure:

```markdown
# skill-name

**Version:** 1.0.0

**Description:** Brief description of the skill's purpose

## Purpose

Detailed explanation of what the skill does and why it exists.

## Before Inference

Optional hook called before each inference step.

\`\`\`javascript
const hookFunction = (context) => {
  // Your hook implementation
  // Access context: { step, token_id, pos_id, ... }
  
  return {
    // Return value (optional)
  };
};
\`\`\`

## After Inference

Optional hook called after each inference step.

\`\`\`javascript
const hookFunction = (context) => {
  // Your hook implementation
  return { /* ... */ };
};
\`\`\`

## Validate

Optional validation hook.

\`\`\`javascript
const hookFunction = (context) => {
  return {
    valid: true,
    // Additional validation data
  };
};
\`\`\`

## Evaluate

Optional evaluation hook for self-checking.

\`\`\`javascript
const hookFunction = (context) => {
  return {
    skill: 'skill-name',
    evaluation: { /* ... */ }
  };
};
\`\`\`
```

## Usage

### Loading Skills

```javascript
import skillsCapacitor from './skills.js';

// Load all skills from the skills directory
skillsCapacitor.loadSkillsFromDirectory('./skills');

// Load a specific skill file
skillsCapacitor.loadSkillFromFile('./skills/my-skill.skill.md');

// List loaded skills
const skills = skillsCapacitor.listSkills();
console.log('Loaded skills:', skills.map(s => s.name));
```

### Integrating with Inference

```javascript
// Before inference step
const beforeResults = skillsCapacitor.executeHooks('beforeInference', {
  step,
  token_id,
  pos_id,
  // ... other context
});

// Check for escape conditions
const shouldEscape = beforeResults.some(r => r.result && r.result.escape);
if (shouldEscape) {
  console.log('Escape triggered, halting inference');
  break;
}

// ... perform inference ...

// After inference step
skillsCapacitor.executeHooks('afterInference', {
  step,
  sample,
  token_id,
  // ... other context
});

// Validate model state
const validations = skillsCapacitor.executeHooks('validate', {
  loss,
  probs,
  step,
  // ... other context
});

// Check for violations
validations.forEach(({ skill, result }) => {
  if (result && !result.valid) {
    console.warn(`Validation failed in ${skill}:`, result.violations);
  }
});
```

### Disabling Skills

```javascript
// Disable all skills
skillsCapacitor.setEnabled(false);

// Re-enable
skillsCapacitor.setEnabled(true);
```

## Built-in Skills

### molt-invariant

Validates model invariants during inference to ensure consistent behavior and detect drift.

**Features:**
- Checks loss values for validity (finite, positive)
- Validates probability distributions (sum to 1.0, no negatives)
- Detects numerical instability (NaN/Inf)
- Monitors gradient magnitudes

**Usage:**
```javascript
const validations = skillsCapacitor.executeHooks('validate', {
  loss: loss.data,
  probs,
  step
});
```

### mcp64-seal

Sovereignty seal that validates model ownership and operational parameters.

**Features:**
- Verifies model parameters haven't been tampered with
- Ensures execution stays within authorized resource limits
- Generates cryptographic seals for audit trails
- Validates operational context

**Usage:**
```javascript
const sovereigntyCheck = skillsCapacitor.executeHooks('validate', {
  params,
  vocab_size,
  n_layer,
  n_embd
});
```

### hydrofoil-escape

Emergency escape mechanism that halts inference when drift or anomalies are detected.

**Features:**
- Detects loss spikes or anomalous behavior
- Halts inference on critical violations
- Provides graceful degradation strategies
- Logs escape events for analysis

**Usage:**
```javascript
const driftCheck = skillsCapacitor.executeHooks('beforeInference', {
  step,
  prev_loss,
  current_loss,
  temperature
});

if (driftCheck.some(r => r.result && r.result.escape)) {
  console.log('Drift detected, halting');
  break;
}
```

## Creating Custom Skills

### Step 1: Create Skill File

Create a new markdown file in the `skills` directory:

```bash
touch skills/my-custom-skill.skill.md
```

### Step 2: Define Skill Structure

```markdown
# my-custom-skill

**Version:** 1.0.0

**Description:** What your skill does

## Purpose

Explain the purpose and use cases.

## Before Inference

\`\`\`javascript
const hookFunction = (context) => {
  // Your implementation
  return { /* your data */ };
};
\`\`\`
```

### Step 3: Load and Use

```javascript
skillsCapacitor.loadSkillFromFile('./skills/my-custom-skill.skill.md');
```

## Hook Context Reference

### beforeInference Context
```javascript
{
  step: number,          // Current training/inference step
  token_id: number,      // Current token ID
  pos_id: number,        // Position in sequence
  temperature: number,   // Sampling temperature
  prev_loss: number,     // Previous step's loss
  current_loss: number   // Current step's loss
}
```

### afterInference Context
```javascript
{
  step: number,
  sample: string[],      // Generated sample tokens
  token_id: number,      // Generated token ID
  probs: Value[]        // Probability distribution
}
```

### validate Context
```javascript
{
  loss: number,
  probs: Value[],        // Probability values
  step: number,
  params: Value[],       // Model parameters
  vocab_size: number,
  n_layer: number,
  n_embd: number
}
```

### evaluate Context
```javascript
{
  step: number,
  loss: number,
  escape_triggered: boolean,
  // ... any relevant data
}
```

## Best Practices

1. **Keep Skills Focused**: Each skill should do one thing well
2. **Fail Gracefully**: Handle errors in hooks to avoid breaking inference
3. **Document Thoroughly**: Explain what your skill does and why
4. **Version Carefully**: Use semantic versioning for skill updates
5. **Test Independently**: Validate skills work in isolation
6. **Minimal Overhead**: Keep hook execution fast to avoid slowing inference
7. **No Side Effects**: Avoid modifying the model state in hooks
8. **Return Structured Data**: Use consistent return formats for easier debugging

## Advanced Topics

### Skill Composition

Skills can work together. For example:
- `molt-invariant` detects violations
- `hydrofoil-escape` triggers escape based on violations
- `mcp64-seal` generates audit trail of the escape

### Performance Considerations

- Skills add minimal overhead (< 1ms per hook execution)
- Disable skills in production if not needed
- Use `beforeInference` sparingly in tight loops
- Cache expensive computations in skill state

### Security

- Skills execute in the same context as the main code
- Review skill code before loading from untrusted sources
- Skills have full access to model parameters
- Use `mcp64-seal` for sovereignty validation

## Troubleshooting

### Skill Not Loading

```javascript
// Check if skill exists
const skill = skillsCapacitor.getSkill('my-skill');
if (!skill) {
  console.log('Skill not loaded');
}

// Check loaded skills
console.log('Loaded:', skillsCapacitor.listSkills().map(s => s.name));
```

### Hook Not Executing

```javascript
// Enable debug mode
skillsCapacitor.setEnabled(true);

// Check hook registration
const skill = skillsCapacitor.getSkill('my-skill');
console.log('Hooks:', skill.hooks);
```

### Performance Issues

```javascript
// Disable skills temporarily
skillsCapacitor.setEnabled(false);

// Run inference
// ...

// Re-enable
skillsCapacitor.setEnabled(true);
```

## Future Extensions

The Skills Capacitor framework is designed for extension:

- **Remote Skills**: Load skills from URLs or registries
- **Skill Dependencies**: Define skill requirements and ordering
- **Conditional Execution**: Run skills based on conditions
- **Skill State**: Maintain state across hook executions
- **Async Hooks**: Support asynchronous hook execution
- **Skill Metrics**: Built-in performance and usage tracking

## Contributing

To contribute a new skill:

1. Create a skill file in `skills/` directory
2. Follow the skill format and naming conventions
3. Document the skill's purpose and usage
4. Test the skill with `microgpt.js`
5. Submit a pull request with examples

## License

Skills are part of the `microgpt.js` project and share the same license.
