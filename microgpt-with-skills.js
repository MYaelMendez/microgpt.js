/**
 * microgpt-with-skills.js
 * 
 * Integration example showing how to use the Skills Platform
 * with the core microgpt.js GPT implementation
 * 
 * This demonstrates extending microgpt.js with:
 * - Temperature control skills
 * - Token validation
 * - Embedding-based context awareness
 * - Sovereignty checks
 */

import fs from 'fs';
import random from './random.js';
import { createPlatform } from './platform.js';
import { TemperatureControlSkill } from './skills/examples/temperature-control.js';
import { TokenValidatorSkill } from './skills/examples/token-validator.js';

random.seed(42); // Reproducible results

// Read and prepare the dataset
const docs = fs.readFileSync('input.txt', 'utf-8')
  .trim()
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.length > 0);
random.shuffle(docs);
console.log(`num docs: ${docs.length}`);

// Tokenizer setup
const uchars = [...new Set(docs.join(''))].sort();
const char_to_id = new Map(uchars.map((ch, i) => [ch, i]));
const id_to_char = new Map(uchars.map((ch, i) => [i, ch]));
const BOS = uchars.length;
const vocab_size = uchars.length + 1;
console.log(`vocab size: ${vocab_size}`);

// Initialize the Skills Platform
console.log('\n=== Initializing Skills Platform ===');
const platform = createPlatform({
  enableSovereignty: true,
  enableValidation: true,
  enableDiagnostics: true,
  embeddingDimensions: 16
});

// Register skills
async function setupSkills() {
  // Temperature control for better sampling
  const tempSkill = new TemperatureControlSkill({
    baseTemperature: 0.5,
    minTemperature: 0.1,
    maxTemperature: 0.9
  });
  await platform.registerSkill(tempSkill);

  // Token validator for safety
  const validatorSkill = new TokenValidatorSkill({
    maxSequenceLength: 1024
  });
  await platform.registerSkill(validatorSkill);

  console.log('Skills registered:', platform.skillManager.list());
}

await setupSkills();

// Pre-populate embedding store with training data
console.log('\n=== Building Embedding Index ===');
const sampleDocs = docs.slice(0, Math.min(100, docs.length));
for (const doc of sampleDocs) {
  platform.storeEmbedding(doc, doc, { type: 'training-example' });
}
console.log(`Stored ${platform.embeddingStore.size()} embeddings`);

// Simplified GPT components for demonstration
class Value {
  constructor(data) {
    this.data = data;
    this.grad = 0;
  }
  add(other) { return new Value(this.data + (other instanceof Value ? other.data : other)); }
  mul(other) { return new Value(this.data * (other instanceof Value ? other.data : other)); }
  div(other) { return new Value(this.data / (other instanceof Value ? other.data : other)); }
  sub(other) { return new Value(this.data - (other instanceof Value ? other.data : other)); }
  exp() { return new Value(Math.exp(this.data)); }
  log() { return new Value(Math.log(this.data)); }
  neg() { return new Value(-this.data); }
}

function softmax(logits) {
  const max_val = Math.max(...logits.map(v => v.data));
  const exps = logits.map(v => v.sub(max_val).exp());
  const total = exps.reduce((a, b) => a.add(b));
  return exps.map(e => e.div(total));
}

// Simulate inference with skills integration
async function inferenceWithSkills() {
  console.log('\n=== Inference with Skills ===');
  const temperature = 0.5;
  const token_ids = Array.from({ length: vocab_size }, (_, i) => i);
  const max_length = 16;

  console.log('\nGenerating samples with skills enabled:');
  
  for (let sample_idx = 0; sample_idx < 10; sample_idx++) {
    let token_id = BOS;
    const sample = [];
    let generatedText = '';

    for (let pos_id = 0; pos_id < max_length; pos_id++) {
      // Create mock logits (in real implementation, these come from GPT model)
      const mockLogits = Array(vocab_size).fill(null).map(() => 
        new Value(Math.random())
      );

      // Apply skills' post-processing
      const context = {
        position: pos_id,
        maxPosition: max_length,
        partialText: generatedText,
        tokens: sample
      };
      
      const processedLogits = await platform.postprocessLogits(mockLogits, context);
      
      // Apply temperature and softmax
      const probs = softmax(processedLogits.map(l => l.div(temperature)));
      
      // Sample next token
      token_id = random.choices(token_ids, probs.map(p => p.data));
      
      if (token_id === BOS) break;
      
      const char = uchars[token_id];
      sample.push(char);
      generatedText += char;
    }

    const sampleText = sample.join('');
    
    // Validate output with skills
    const validation = await platform.skillManager.executeValidation(sample, 'output');
    const validMark = validation.valid ? '✓' : '✗';
    
    // Check similarity to training data
    const similar = platform.searchSimilar(sampleText, 1);
    const similarityInfo = similar.length > 0 
      ? `(similar to: ${similar[0].key}, dist: ${similar[0].distance.toFixed(3)})`
      : '';
    
    console.log(`sample ${String(sample_idx + 1).padStart(2)}: ${validMark} ${sampleText} ${similarityInfo}`);
  }
}

await inferenceWithSkills();

// Run diagnostics
console.log('\n=== System Diagnostics ===');
const diagnostics = await platform.runDiagnostics();
console.log('Status:', diagnostics.summary);
diagnostics.checks.forEach(check => {
  const icon = check.status === 'ok' ? '✓' : check.status === 'warning' ? '⚠' : '✗';
  console.log(`  ${icon} ${check.name}: ${check.message}`);
});

// Platform status
console.log('\n=== Platform Status ===');
const status = platform.getStatus();
console.log(`Skills: ${status.skills.length} registered`);
console.log(`Validators: ${status.validators.length} active`);
console.log(`Embeddings: ${status.embeddings.count} stored (${status.embeddings.dimensions}D)`);

console.log('\n✨ Integration complete! The Skills Platform extends microgpt.js');
console.log('   while maintaining zero dependencies and sovereign operation.');
