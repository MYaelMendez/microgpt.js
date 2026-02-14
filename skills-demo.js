/**
 * Skills Demo - Demonstrates the Skills Capacitor in action
 * 
 * This example shows how to:
 * 1. Load skills
 * 2. Use skills to validate model state
 * 3. Integrate skills into inference hooks
 */

import skillsCapacitor from './skills.js';

console.log('=== Skills Capacitor Demo ===\n');

// 1. Load skills from the skills directory
console.log('Loading skills...');
skillsCapacitor.loadSkillsFromDirectory('./skills');

// 2. List loaded skills
const skills = skillsCapacitor.listSkills();
console.log(`\nLoaded ${skills.length} skill(s):`);
skills.forEach(skill => {
  console.log(`  - ${skill.name} v${skill.version}`);
  console.log(`    ${skill.description}`);
});

// 3. Demonstrate validation hooks
console.log('\n--- Validation Demo ---');
console.log('\nValidating normal model state:');
const normalValidation = skillsCapacitor.executeHooks('validate', {
  loss: 2.5,
  probs: [0.1, 0.2, 0.3, 0.4],
  step: 100,
  params: new Array(1000),
  vocab_size: 27,
  n_layer: 1,
  n_embd: 16
});

normalValidation.forEach(({ skill, result }) => {
  if (result) {
    console.log(`  ${skill}: ${result.valid ? '✓ Valid' : '✗ Invalid'}`);
    if (result.violations) {
      result.violations.forEach(v => {
        console.log(`    - ${v.type}: ${v.message} [${v.severity}]`);
      });
    }
  }
});

console.log('\nValidating invalid model state (NaN loss):');
const invalidValidation = skillsCapacitor.executeHooks('validate', {
  loss: NaN,
  probs: [0.1, 0.2, 0.3, 0.4],
  step: 100
});

invalidValidation.forEach(({ skill, result }) => {
  if (result) {
    console.log(`  ${skill}: ${result.valid ? '✓ Valid' : '✗ Invalid'}`);
    if (result.violations) {
      result.violations.forEach(v => {
        console.log(`    - ${v.type}: ${v.message} [${v.severity}]`);
      });
    }
  }
});

// 4. Demonstrate escape mechanism
console.log('\n--- Escape Mechanism Demo ---');
console.log('\nChecking normal conditions:');
const normalEscape = skillsCapacitor.executeHooks('beforeInference', {
  step: 100,
  prev_loss: 2.5,
  current_loss: 2.6,
  temperature: 0.5
});

normalEscape.forEach(({ skill, result }) => {
  if (result && result.escape !== undefined) {
    console.log(`  ${skill}: ${result.escape ? '⚠ Escape triggered' : '✓ Continue'}`);
  }
});

console.log('\nChecking drift conditions (sudden loss spike):');
const driftEscape = skillsCapacitor.executeHooks('beforeInference', {
  step: 100,
  prev_loss: 2.5,
  current_loss: 10.0,
  temperature: 0.5
});

driftEscape.forEach(({ skill, result }) => {
  if (result && result.escape !== undefined) {
    console.log(`  ${skill}: ${result.escape ? '⚠ Escape triggered' : '✓ Continue'}`);
    if (result.escape && result.reason) {
      console.log(`    Reason:`, result.reason);
    }
  }
});

// 5. Demonstrate sovereignty checks
console.log('\n--- Sovereignty Check Demo ---');
const sovereigntyCheck = skillsCapacitor.executeHooks('validate', {
  params: new Array(4192),
  vocab_size: 27,
  n_layer: 1,
  n_embd: 16
});

sovereigntyCheck.forEach(({ skill, result }) => {
  if (result && result.sovereign !== undefined) {
    console.log(`  ${skill}: ${result.sovereign ? '✓ Sovereign' : '✗ Not Sovereign'}`);
    if (result.seal) {
      console.log(`    Seal: ${result.seal}`);
    }
  }
});

// 6. Demonstrate evaluation receipts
console.log('\n--- Evaluation Receipts Demo ---');
const evaluations = skillsCapacitor.executeHooks('evaluate', {
  step: 1000,
  loss: 2.1,
  escape_triggered: false
});

evaluations.forEach(({ skill, result }) => {
  if (result) {
    console.log(`  ${skill}:`);
    console.log(`    Status: ${result.evaluation?.status || 'unknown'}`);
    if (result.receipt) {
      console.log(`    Receipt: ${result.receipt}`);
    }
    if (result.recommendations) {
      console.log(`    Recommendations:`, result.recommendations);
    }
  }
});

// 7. Demonstrate disabling skills
console.log('\n--- Disabling Skills Demo ---');
skillsCapacitor.setEnabled(false);
console.log('Skills disabled');
const disabledResults = skillsCapacitor.executeHooks('validate', { loss: NaN });
console.log(`Validation results when disabled: ${disabledResults.length} hook(s) executed`);

skillsCapacitor.setEnabled(true);
console.log('\nSkills re-enabled');
const enabledResults = skillsCapacitor.executeHooks('validate', { loss: NaN });
console.log(`Validation results when enabled: ${enabledResults.length} hook(s) executed`);

console.log('\n=== Demo Complete ===');
