# API Reference

Complete API documentation for the microgpt.js Skills Platform.

## Table of Contents

- [Skills System](#skills-system)
- [Embeddings](#embeddings)
- [Sovereignty & Validation](#sovereignty--validation)
- [Platform](#platform)

---

## Skills System

### Skill Class

Base class for all skills.

```javascript
import { Skill } from './skills.js';
```

#### Constructor

```javascript
constructor(config = {})
```

**Parameters:**
- `config.name` (string): Skill name
- `config.description` (string): Skill description
- `config.enabled` (boolean): Whether skill is enabled (default: true)
- `config.priority` (number): Execution priority (default: 0)

#### Methods

##### `async initialize()`

Called once when skill is registered. Override to set up resources.

##### `async preProcess(tokens)`

Process tokens before inference.

**Parameters:**
- `tokens` (Array): Input token array

**Returns:** Modified token array

##### `async postProcess(logits, context)`

Process logits after generation.

**Parameters:**
- `logits` (Array): Model output logits (Value objects)
- `context` (Object): Generation context

**Returns:** Modified logits array

##### `async onToolCall(toolName, args)`

Handle tool/function calls.

**Parameters:**
- `toolName` (string): Name of the tool
- `args` (Object): Tool arguments

**Returns:** Tool result or null if not handled

##### `validate(data, type)`

Validate data for sovereignty and safety.

**Parameters:**
- `data` (any): Data to validate
- `type` (string): 'input' or 'output'

**Returns:** `{ valid: boolean, issues: string[] }`

##### `async cleanup()`

Called when skill is unregistered. Override to clean up resources.

---

### SkillManager Class

Manages skill lifecycle and execution.

```javascript
import { SkillManager } from './skills.js';
```

#### Constructor

```javascript
const manager = new SkillManager();
```

#### Methods

##### `async register(skill)`

Register a skill.

**Parameters:**
- `skill` (Skill): Skill instance

**Returns:** this (for chaining)

##### `async unregister(name)`

Unregister a skill by name.

**Parameters:**
- `name` (string): Skill name

**Returns:** boolean (true if unregistered)

##### `async executePreProcess(tokens)`

Execute all preProcess hooks.

**Parameters:**
- `tokens` (Array): Input tokens

**Returns:** Processed tokens

##### `async executePostProcess(logits, context)`

Execute all postProcess hooks.

**Parameters:**
- `logits` (Array): Model logits
- `context` (Object): Generation context

**Returns:** Processed logits

##### `async executeToolCall(toolName, args)`

Execute tool call hooks.

**Parameters:**
- `toolName` (string): Tool name
- `args` (Object): Tool arguments

**Returns:** Tool result or null

##### `async executeValidation(data, type)`

Execute validation hooks.

**Parameters:**
- `data` (any): Data to validate
- `type` (string): 'input' or 'output'

**Returns:** `{ valid: boolean, issues: string[] }`

##### `get(name)`

Get skill by name.

**Parameters:**
- `name` (string): Skill name

**Returns:** Skill or undefined

##### `list()`

List all registered skill names.

**Returns:** Array of strings

##### `getInfo()`

Get information about all skills.

**Returns:** Array of `{ name, description, enabled, priority }`

---

### Utility Functions

##### `loadFromJSON(config)`

Load skill from JSON configuration.

**Parameters:**
- `config` (Object): JSON configuration

**Returns:** Skill instance

##### `loadFromMarkdown(markdown)`

Load skill from Markdown content.

**Parameters:**
- `markdown` (string): Markdown content

**Returns:** Skill instance

---

## Embeddings

### SimpleEmbedding Class

Character and n-gram based embeddings.

```javascript
import { SimpleEmbedding } from './embeddings.js';
```

#### Constructor

```javascript
const embedder = new SimpleEmbedding(dimensions = 16);
```

**Parameters:**
- `dimensions` (number): Embedding dimensions (default: 16)

#### Methods

##### `encode(text)`

Generate embedding from text.

**Parameters:**
- `text` (string): Input text

**Returns:** Float32Array

##### `encodeTokens(tokens, idToChar)`

Generate embedding from token sequence.

**Parameters:**
- `tokens` (Array<number>): Token IDs
- `idToChar` (Map): Mapping from token ID to character

**Returns:** Float32Array

---

### PositionalEmbedding Class

GPT-style positional encoding.

```javascript
import { PositionalEmbedding } from './embeddings.js';
```

#### Constructor

```javascript
const embedder = new PositionalEmbedding(dimensions = 16, maxLength = 128);
```

**Parameters:**
- `dimensions` (number): Embedding dimensions
- `maxLength` (number): Maximum sequence length

#### Methods

##### `encode(tokens, tokenEmbeddings)`

Encode tokens with positional information.

**Parameters:**
- `tokens` (Array<number>): Token IDs
- `tokenEmbeddings` (Array<Array<number>>): Token embedding matrix

**Returns:** Array<Float32Array>

---

### SimilarityMetrics Class

Static methods for similarity computation.

```javascript
import { SimilarityMetrics } from './embeddings.js';
```

#### Static Methods

##### `cosineSimilarity(a, b)`

Compute cosine similarity.

**Parameters:**
- `a` (Float32Array|Array): First vector
- `b` (Float32Array|Array): Second vector

**Returns:** number (similarity in [-1, 1])

##### `euclideanDistance(a, b)`

Compute Euclidean distance.

**Parameters:**
- `a` (Float32Array|Array): First vector
- `b` (Float32Array|Array): Second vector

**Returns:** number (distance)

##### `manhattanDistance(a, b)`

Compute Manhattan distance.

**Parameters:**
- `a` (Float32Array|Array): First vector
- `b` (Float32Array|Array): Second vector

**Returns:** number (distance)

##### `kNearestNeighbors(query, vectors, k, metric)`

Find k nearest neighbors.

**Parameters:**
- `query` (Float32Array|Array): Query vector
- `vectors` (Array): Collection of vectors
- `k` (number): Number of neighbors (default: 5)
- `metric` (string): 'cosine', 'euclidean', or 'manhattan' (default: 'cosine')

**Returns:** Array of `{ index, distance }`

---

### EmbeddingStore Class

Store and retrieve embeddings.

```javascript
import { EmbeddingStore } from './embeddings.js';
```

#### Constructor

```javascript
const store = new EmbeddingStore();
```

#### Methods

##### `store(key, embedding, metadata)`

Store an embedding.

**Parameters:**
- `key` (string): Unique identifier
- `embedding` (Float32Array|Array): Embedding vector
- `metadata` (Object): Associated metadata (default: {})

##### `get(key)`

Retrieve an embedding.

**Parameters:**
- `key` (string): Unique identifier

**Returns:** Float32Array or undefined

##### `search(query, k, metric)`

Search for similar embeddings.

**Parameters:**
- `query` (Float32Array|Array): Query embedding
- `k` (number): Number of results (default: 5)
- `metric` (string): Distance metric (default: 'cosine')

**Returns:** Array of `{ key, distance, metadata }`

##### `keys()`

Get all stored keys.

**Returns:** Array<string>

##### `size()`

Get number of stored embeddings.

**Returns:** number

##### `clear()`

Clear all embeddings.

---

## Sovereignty & Validation

### Validator Class

Base class for validators.

```javascript
import { Validator } from './sovereignty.js';
```

#### Constructor

```javascript
constructor(config = {})
```

**Parameters:**
- `config.name` (string): Validator name
- `config.description` (string): Validator description
- `config.enabled` (boolean): Whether enabled (default: true)
- `config.severity` (string): 'error', 'warning', or 'info' (default: 'warning')

#### Methods

##### `validate(data, context)`

Validate data.

**Parameters:**
- `data` (any): Data to validate
- `context` (Object): Additional context (default: {})

**Returns:** `{ valid: boolean, issues: Array<{severity, message}> }`

---

### Built-in Validators

#### BoundsValidator

Validate numeric bounds.

```javascript
import { BoundsValidator } from './sovereignty.js';

const validator = new BoundsValidator({
  name: 'bounds-check',
  min: 0,
  max: 100,
  field: 'value' // optional
});
```

#### RequiredFieldsValidator

Validate required fields in objects.

```javascript
import { RequiredFieldsValidator } from './sovereignty.js';

const validator = new RequiredFieldsValidator({
  name: 'required-fields',
  fields: ['id', 'name', 'value']
});
```

#### TypeValidator

Validate data types.

```javascript
import { TypeValidator } from './sovereignty.js';

const validator = new TypeValidator({
  name: 'type-check',
  expectedType: 'array',
  field: 'data' // optional
});
```

#### LengthValidator

Validate array/string length.

```javascript
import { LengthValidator } from './sovereignty.js';

const validator = new LengthValidator({
  name: 'length-check',
  minLength: 1,
  maxLength: 1000,
  field: 'tokens' // optional
});
```

#### PatternValidator

Validate with regex patterns.

```javascript
import { PatternValidator } from './sovereignty.js';

const validator = new PatternValidator({
  name: 'pattern-check',
  pattern: /^[a-z]+$/,
  field: 'text' // optional
});
```

#### SovereigntyValidator

Ensure local, sovereign operation.

```javascript
import { SovereigntyValidator } from './sovereignty.js';

const validator = new SovereigntyValidator({
  name: 'sovereignty',
  allowedDomains: [],
  blockedPatterns: [/https?:\/\//i, /api\./i]
});
```

#### InvariantChecker

Check custom invariants.

```javascript
import { InvariantChecker } from './sovereignty.js';

const checker = new InvariantChecker({
  name: 'invariants',
  invariants: [
    (data, ctx) => ({
      valid: data.length > 0,
      message: 'Data must not be empty'
    })
  ]
});
```

---

### ValidationEngine Class

Orchestrate multiple validators.

```javascript
import { ValidationEngine } from './sovereignty.js';
```

#### Constructor

```javascript
const engine = new ValidationEngine();
```

#### Properties

- `stopOnError` (boolean): Stop validation on first error (default: false)

#### Methods

##### `addValidator(validator)`

Add a validator.

**Parameters:**
- `validator` (Validator): Validator instance

**Returns:** this (for chaining)

##### `removeValidator(name)`

Remove a validator by name.

**Parameters:**
- `name` (string): Validator name

**Returns:** this (for chaining)

##### `validate(data, context)`

Validate data against all validators.

**Parameters:**
- `data` (any): Data to validate
- `context` (Object): Validation context (default: {})

**Returns:** `{ valid, issues, errors, warnings }`

##### `getValidators()`

Get all validators info.

**Returns:** Array of `{ name, description, enabled, severity }`

---

### SelfDiagnostic Class

Self-diagnostic system for local issue detection.

```javascript
import { SelfDiagnostic } from './sovereignty.js';
```

#### Constructor

```javascript
const diagnostic = new SelfDiagnostic();
```

#### Methods

##### `registerCheck(name, checkFn)`

Register a diagnostic check.

**Parameters:**
- `name` (string): Check name
- `checkFn` (Function): Async function returning `{ status, message }`

##### `async runDiagnostics()`

Run all diagnostic checks.

**Returns:** `{ timestamp, checks, summary }`

##### `getLastResults()`

Get last diagnostic results.

**Returns:** Array of check results

---

## Platform

### MicroGPTPlatform Class

Main platform integration.

```javascript
import { MicroGPTPlatform, createPlatform } from './platform.js';
```

#### Constructor

```javascript
const platform = new MicroGPTPlatform(config = {});
// or
const platform = createPlatform(config = {});
```

**Parameters:**
- `config.enableSovereignty` (boolean): Enable sovereignty checks (default: true)
- `config.enableValidation` (boolean): Enable validation (default: true)
- `config.enableDiagnostics` (boolean): Enable diagnostics (default: true)
- `config.embeddingDimensions` (number): Embedding dimensions (default: 16)

#### Properties

- `skillManager` (SkillManager): Skill manager instance
- `validationEngine` (ValidationEngine): Validation engine instance
- `selfDiagnostic` (SelfDiagnostic): Self-diagnostic instance
- `embedder` (SimpleEmbedding): Embedding generator
- `embeddingStore` (EmbeddingStore): Embedding storage

#### Methods

##### `async registerSkill(skill)`

Register a skill.

**Parameters:**
- `skill` (Skill): Skill instance

##### `async loadSkillsFromDirectory(directory)`

Load skills from directory (placeholder).

**Parameters:**
- `directory` (string): Directory path

##### `async preprocessTokens(tokens)`

Process tokens with pre-processing hooks.

**Parameters:**
- `tokens` (Array): Input tokens

**Returns:** Processed tokens

##### `async postprocessLogits(logits, context)`

Process logits with post-processing hooks.

**Parameters:**
- `logits` (Array): Model output logits
- `context` (Object): Generation context

**Returns:** Processed logits

##### `async handleToolCall(toolName, args)`

Handle tool calls.

**Parameters:**
- `toolName` (string): Tool name
- `args` (Object): Tool arguments

**Returns:** Tool result

##### `generateEmbedding(text)`

Generate embedding for text.

**Parameters:**
- `text` (string): Input text

**Returns:** Float32Array

##### `storeEmbedding(key, text, metadata)`

Store embedding with metadata.

**Parameters:**
- `key` (string): Unique identifier
- `text` (string): Text to embed
- `metadata` (Object): Additional metadata (default: {})

##### `searchSimilar(query, k)`

Search for similar embeddings.

**Parameters:**
- `query` (string): Query text
- `k` (number): Number of results (default: 5)

**Returns:** Array of search results

##### `async runDiagnostics()`

Run system diagnostics.

**Returns:** Diagnostic results

##### `getStatus()`

Get platform status.

**Returns:** `{ skills, validators, embeddings, config }`

##### `setSovereigntyMode(enabled)`

Enable/disable sovereignty mode.

**Parameters:**
- `enabled` (boolean): Whether to enable

---

## Type Definitions

### Context Object

Used in postProcess hooks:

```typescript
{
  position: number,      // Current position in sequence
  maxPosition: number,   // Maximum sequence length
  partialText?: string,  // Partial generated text
  tokens?: Array,        // Current token sequence
  // ... additional custom fields
}
```

### Validation Result

```typescript
{
  valid: boolean,
  issues: string[]
}
```

### Validation Engine Result

```typescript
{
  valid: boolean,
  issues: Array<{severity: string, message: string, validator: string}>,
  errors: Array<...>,
  warnings: Array<...>
}
```

### Diagnostic Result

```typescript
{
  timestamp: string,
  checks: Array<{name: string, status: string, message: string, timestamp: string}>,
  summary: {total: number, passed: number, warnings: number, errors: number}
}
```

---

## Examples

See the [SKILLS.md](./SKILLS.md) guide for comprehensive examples of using the API.
