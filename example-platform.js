/**
 * Example: Using the microgpt.js Skills Platform
 * 
 * This demonstrates how to integrate the modular skills framework
 * with the core microgpt.js implementation
 */

import { createPlatform } from './platform.js';
import { TemperatureControlSkill } from './skills/examples/temperature-control.js';
import { TokenValidatorSkill } from './skills/examples/token-validator.js';
import { EmbeddingSimilaritySkill } from './skills/examples/embedding-similarity.js';

// Example 1: Basic Platform Setup
console.log('=== Example 1: Basic Platform Setup ===\n');

const platform = createPlatform({
  enableSovereignty: true,
  enableValidation: true,
  enableDiagnostics: true,
  embeddingDimensions: 16
});

console.log('Platform created with config:', platform.config);

// Example 2: Register Skills
console.log('\n=== Example 2: Register Skills ===\n');

async function setupSkills() {
  // Register temperature control skill
  const tempSkill = new TemperatureControlSkill({
    baseTemperature: 0.5,
    minTemperature: 0.1,
    maxTemperature: 1.0
  });
  await platform.registerSkill(tempSkill);

  // Register token validator
  const validatorSkill = new TokenValidatorSkill({
    maxSequenceLength: 512
  });
  await platform.registerSkill(validatorSkill);

  // Register embedding similarity skill
  const embeddingSkill = new EmbeddingSimilaritySkill({
    dimensions: 16,
    similarityThreshold: 0.5
  });
  await platform.registerSkill(embeddingSkill);

  console.log('Registered skills:', platform.skillManager.list());
  console.log('\nSkill info:', platform.skillManager.getInfo());
}

await setupSkills();

// Example 3: Process Tokens
console.log('\n=== Example 3: Process Tokens ===\n');

async function processExample() {
  // Simulate input tokens
  const inputTokens = [0, 1, 2, 3, 4, 5];
  console.log('Input tokens:', inputTokens);

  // Pre-process with skills
  const processedTokens = await platform.preprocessTokens(inputTokens);
  console.log('Processed tokens:', processedTokens);

  // Simulate logits (mock Value objects for demonstration)
  const mockLogits = Array(10).fill(null).map((_, i) => ({
    data: Math.random(),
    div: function(x) { return { ...this, data: this.data / x }; }
  }));

  // Post-process with skills
  const context = {
    position: 3,
    maxPosition: 16,
    partialText: 'em'
  };

  const processedLogits = await platform.postprocessLogits(mockLogits, context);
  console.log('Context used:', context);
  console.log('Processed logits count:', processedLogits.length);
}

await processExample();

// Example 4: Embeddings
console.log('\n=== Example 4: Embeddings ===\n');

function embeddingExample() {
  // Generate embeddings
  const names = ['emma', 'olivia', 'sophia', 'charlotte', 'amelia'];
  
  console.log('Storing embeddings for names...');
  for (const name of names) {
    platform.storeEmbedding(name, name, { type: 'name', length: name.length });
  }

  // Search for similar
  const query = 'emmy';
  console.log(`\nSearching for names similar to "${query}"...`);
  const results = platform.searchSimilar(query, 3);
  
  console.log('Top 3 results:');
  results.forEach((result, i) => {
    console.log(`  ${i + 1}. ${result.key} (distance: ${result.distance.toFixed(4)})`, result.metadata);
  });
}

embeddingExample();

// Example 5: Validation
console.log('\n=== Example 5: Validation ===\n');

async function validationExample() {
  // Test with valid data
  const validData = [1, 2, 3, 4, 5];
  const validResult = await platform.skillManager.executeValidation(validData, 'input');
  console.log('Valid data check:', validResult.valid ? '✓ PASS' : '✗ FAIL');
  
  if (!validResult.valid) {
    console.log('Issues:', validResult.issues);
  }

  // Test with potentially invalid data
  const longData = Array(2000).fill(0); // Exceeds max length
  const invalidResult = await platform.skillManager.executeValidation(longData, 'input');
  console.log('Long data check:', invalidResult.valid ? '✓ PASS' : '✗ FAIL');
  
  if (!invalidResult.valid) {
    console.log('Issues:', invalidResult.issues);
  }
}

await validationExample();

// Example 6: Diagnostics
console.log('\n=== Example 6: System Diagnostics ===\n');

async function diagnosticsExample() {
  const results = await platform.runDiagnostics();
  
  console.log('Diagnostic Results:');
  console.log('Timestamp:', results.timestamp);
  console.log('Summary:', results.summary);
  
  console.log('\nIndividual Checks:');
  results.checks.forEach(check => {
    const icon = check.status === 'ok' ? '✓' : 
                 check.status === 'warning' ? '⚠' : '✗';
    console.log(`  ${icon} ${check.name}: ${check.message}`);
  });
}

await diagnosticsExample();

// Example 7: Platform Status
console.log('\n=== Example 7: Platform Status ===\n');

function statusExample() {
  const status = platform.getStatus();
  
  console.log('Platform Status:');
  console.log('Skills:', status.skills.length);
  status.skills.forEach(skill => {
    console.log(`  - ${skill.name}: ${skill.description} (priority: ${skill.priority})`);
  });
  
  console.log('\nValidators:', status.validators.length);
  status.validators.forEach(validator => {
    console.log(`  - ${validator.name}: ${validator.description}`);
  });
  
  console.log('\nEmbeddings:');
  console.log(`  - Count: ${status.embeddings.count}`);
  console.log(`  - Dimensions: ${status.embeddings.dimensions}`);
  
  console.log('\nConfiguration:', status.config);
}

statusExample();

// Example 8: Sovereignty Mode
console.log('\n=== Example 8: Sovereignty Mode ===\n');

function sovereigntyExample() {
  console.log('Initial sovereignty mode:', platform.config.enableSovereignty);
  
  // Toggle sovereignty mode
  platform.setSovereigntyMode(false);
  console.log('After disabling:', platform.config.enableSovereignty);
  
  // Re-enable
  platform.setSovereigntyMode(true);
  console.log('After re-enabling:', platform.config.enableSovereignty);
}

sovereigntyExample();

console.log('\n=== All Examples Complete ===\n');
console.log('The Skills Platform is ready for integration with microgpt.js!');
console.log('See SKILLS.md for detailed documentation on creating custom skills.');
