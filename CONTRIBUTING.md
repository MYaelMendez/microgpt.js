# Contributing to microgpt.js Skills Platform

Thank you for your interest in contributing! This document provides guidelines for contributing to the microgpt.js Skills Platform.

## Philosophy

The microgpt.js project maintains these core principles:

1. **Zero Dependencies**: No external npm packages
2. **Browser Native**: Works in both Node.js and browsers
3. **Lightweight**: Minimal overhead and complexity
4. **Sovereign**: Complete local control, no cloud dependencies
5. **Educational**: Clear, readable code for learning

All contributions should respect these principles.

## Types of Contributions

### 1. New Skills

Contributing new skills is the most common way to extend the platform.

**Before creating a skill:**
- Check if a similar skill already exists
- Ensure it follows the zero-dependency principle
- Verify it works in both Node.js and browsers (when applicable)

**Creating a skill:**

```javascript
import { Skill } from './skills.js';

export class MyNewSkill extends Skill {
  constructor(config = {}) {
    super({
      name: 'my-new-skill',
      description: 'Clear description of what this skill does',
      priority: 50,
      ...config
    });
  }

  // Implement relevant hooks
  async preProcess(tokens) {
    // Your logic here
    return tokens;
  }

  // Add tests in comments
  /**
   * Test:
   * const skill = new MyNewSkill();
   * const result = await skill.preProcess([1, 2, 3]);
   * // Expected: [1, 2, 3] or modified tokens
   */
}
```

**Where to place:**
- Core skills: `/skills/examples/`
- Experimental skills: `/skills/experimental/` (create if needed)

**Documentation:**
- Add comprehensive JSDoc comments
- Include usage examples
- Document any configuration options
- Add to SKILLS.md examples section

### 2. Validators

Contributing new validators for sovereignty and safety checks.

```javascript
import { Validator } from './sovereignty.js';

export class MyValidator extends Validator {
  constructor(config = {}) {
    super({
      name: 'my-validator',
      description: 'What this validates',
      severity: 'warning',
      ...config
    });
  }

  validate(data, context = {}) {
    const issues = [];
    let valid = true;
    
    // Validation logic
    
    return { valid, issues };
  }
}
```

### 3. Embedding Utilities

Contributing new embedding methods or similarity metrics.

**Requirements:**
- Must be zero-dependency
- Should be efficient for browser environments
- Must include clear documentation

### 4. Documentation

Improvements to:
- README.md
- SKILLS.md
- API.md
- Code comments
- Usage examples

### 5. Bug Fixes

Fixing bugs in:
- Core framework
- Example skills
- Documentation
- Edge cases

### 6. Performance Improvements

Optimizations that:
- Maintain zero-dependency principle
- Don't sacrifice code clarity
- Are measurably faster
- Work in all environments

## Development Workflow

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR-USERNAME/microgpt.js.git
cd microgpt.js
```

### 2. Create a Branch

```bash
git checkout -b feature/my-new-skill
# or
git checkout -b fix/bug-description
```

### 3. Make Changes

Follow the coding standards below.

### 4. Test Your Changes

```bash
# Test your skill
node your-skill-test.js

# Test platform integration
node example-platform.js

# Test with core microgpt
node microgpt-with-skills.js
```

### 5. Document Your Changes

- Update relevant documentation
- Add JSDoc comments
- Include usage examples
- Update CHANGELOG if significant

### 6. Commit

```bash
git add .
git commit -m "feat: add new skill for X"
# or
git commit -m "fix: correct issue with Y"
```

Use conventional commit messages:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

### 7. Push and Create PR

```bash
git push origin feature/my-new-skill
```

Then create a Pull Request on GitHub.

## Coding Standards

### JavaScript Style

1. **ES6+ Modules**: Use import/export
   ```javascript
   import { Skill } from './skills.js';
   export class MySkill extends Skill { }
   ```

2. **Async/Await**: Prefer async/await over promises
   ```javascript
   async preProcess(tokens) {
     const result = await someOperation();
     return result;
   }
   ```

3. **Arrow Functions**: Use for callbacks and short functions
   ```javascript
   const doubled = array.map(x => x * 2);
   ```

4. **Destructuring**: Use when appropriate
   ```javascript
   const { name, priority } = config;
   ```

5. **Template Literals**: For string interpolation
   ```javascript
   console.log(`Registered skill: ${skill.name}`);
   ```

### Naming Conventions

- **Classes**: PascalCase (`MySkill`, `TemperatureControl`)
- **Functions/Methods**: camelCase (`preProcess`, `validateData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_LENGTH`, `DEFAULT_PRIORITY`)
- **Private fields**: prefix with underscore (`_internalState`)
- **Files**: kebab-case (`temperature-control.js`, `my-skill.md`)

### Documentation

Every public class, method, and function should have JSDoc:

```javascript
/**
 * Process tokens before inference
 * @param {Array} tokens - Input token array
 * @returns {Array} Modified tokens
 */
async preProcess(tokens) {
  // Implementation
}
```

### Error Handling

Always handle errors gracefully:

```javascript
async preProcess(tokens) {
  try {
    // Your logic
    return processedTokens;
  } catch (error) {
    console.error(`[${this.name}] Error:`, error.message);
    return tokens; // Return original on error
  }
}
```

### Zero Dependencies Rule

**Never import external packages:**

❌ Bad:
```javascript
import lodash from 'lodash';
import axios from 'axios';
```

✅ Good:
```javascript
// Use built-in JavaScript
const unique = [...new Set(array)];
// Use Fetch API (browser/Node.js 18+)
const response = await fetch(url);
```

### Performance Considerations

1. **Avoid unnecessary loops**: Use built-in methods
2. **Cache computed values**: Don't recalculate
3. **Use TypedArrays**: For numerical data (Float32Array, etc.)
4. **Minimize allocations**: Reuse objects when possible

## Testing Guidelines

### Manual Testing

For each contribution, test:

1. **Functionality**: Does it work as expected?
2. **Edge cases**: Handle empty inputs, invalid data, etc.
3. **Performance**: No significant slowdowns
4. **Compatibility**: Works in Node.js (and browser if applicable)

### Testing Examples

Include test examples in comments:

```javascript
/**
 * MySkill - Does X
 * 
 * Example:
 * const skill = new MySkill({ param: 'value' });
 * await skill.initialize();
 * const result = await skill.preProcess([1, 2, 3]);
 * // Expected: [1, 2, 3] or specific output
 * 
 * Edge cases:
 * - Empty array: []
 * - Large array: Array(10000).fill(0)
 * - Invalid input: null, undefined
 */
```

### Integration Testing

Test your skill with the platform:

```javascript
import { createPlatform } from './platform.js';
import { MySkill } from './skills/my-skill.js';

const platform = createPlatform();
const skill = new MySkill();
await platform.registerSkill(skill);

// Test
const tokens = [1, 2, 3];
const result = await platform.preprocessTokens(tokens);
console.assert(result.length === 3, 'Should return 3 tokens');
```

## Pull Request Process

### PR Checklist

Before submitting:

- [ ] Code follows the style guidelines
- [ ] Zero-dependency principle maintained
- [ ] Documentation added/updated
- [ ] Examples included
- [ ] Tested manually
- [ ] No breaking changes (or clearly documented)
- [ ] Commit messages follow conventions

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New skill
- [ ] Bug fix
- [ ] Documentation
- [ ] Performance improvement
- [ ] Other (specify)

## Testing
How this was tested

## Examples
Usage examples

## Checklist
- [ ] Follows coding standards
- [ ] Zero dependencies maintained
- [ ] Documentation updated
- [ ] Tested thoroughly
```

### Review Process

1. **Automated checks**: Code style, basic tests
2. **Manual review**: Code quality, design, documentation
3. **Discussion**: Feedback and suggestions
4. **Approval**: Once all concerns addressed
5. **Merge**: Maintainer merges to main branch

## Skill Categories

When contributing skills, consider these categories:

### 1. Core Processing
- Token manipulation
- Sequence transformation
- Format conversion

### 2. Safety & Validation
- Sovereignty checks
- Input validation
- Output filtering

### 3. Context & Memory
- Embedding-based context
- Pattern matching
- History tracking

### 4. Generation Control
- Temperature adjustment
- Length control
- Bias injection

### 5. Diagnostics
- Performance monitoring
- Health checks
- Logging utilities

## Advanced Contributions

### New Framework Features

For major features:
1. Open an issue first to discuss
2. Get feedback from maintainers
3. Create design document
4. Implement with tests
5. Comprehensive documentation

### Breaking Changes

Avoid if possible. If necessary:
1. Discuss in issue first
2. Document migration path
3. Version appropriately
4. Update all examples

## Getting Help

- **Documentation**: Start with SKILLS.md and API.md
- **Examples**: Check `/skills/examples/`
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions
- **Questions**: Open an issue with [Question] tag

## Code of Conduct

### Be Respectful
- Treat everyone with respect
- Welcome newcomers
- Be patient with questions
- Give constructive feedback

### Be Collaborative
- Share knowledge
- Help others learn
- Credit contributions
- Work together

### Be Professional
- Stay on topic
- Follow guidelines
- Accept feedback gracefully
- Maintain quality standards

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Acknowledged in documentation
- Part of the community

## Questions?

If you have questions about contributing:
1. Check existing documentation
2. Search closed issues
3. Open a new issue
4. Tag with [Question]

---

**Thank you for contributing to microgpt.js! Together we're building a powerful, sovereign, zero-dependency AI platform.** 🚀
