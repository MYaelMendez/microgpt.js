/**
 * Example Skill: Embedding Similarity
 * Demonstrates using embeddings for context-aware generation
 */

import { Skill } from '../../skills.js';
import { SimpleEmbedding, SimilarityMetrics, EmbeddingStore } from '../../embeddings.js';

export class EmbeddingSimilaritySkill extends Skill {
  constructor(config = {}) {
    super({
      name: 'embedding-similarity',
      description: 'Uses embeddings to bias generation toward similar content',
      priority: 5,
      ...config
    });
    
    this.embedder = new SimpleEmbedding(config.dimensions || 16);
    this.store = new EmbeddingStore();
    this.similarityThreshold = config.similarityThreshold || 0.5;
  }

  async initialize() {
    // Pre-populate embedding store with example patterns
    const examples = [
      'emma',
      'olivia',
      'sophia',
      'isabella',
      'charlotte'
    ];

    for (const example of examples) {
      const embedding = this.embedder.encode(example);
      this.store.store(example, embedding, { type: 'name' });
    }

    console.log(`[${this.name}] Initialized with ${this.store.size()} embeddings`);
  }

  async postProcess(logits, context) {
    // If we have partial generation context, use similarity to bias logits
    if (context.partialText && context.partialText.length > 2) {
      const queryEmbedding = this.embedder.encode(context.partialText);
      const similar = this.store.search(queryEmbedding, 3, 'cosine');
      
      // Boost logits for characters that appear in similar examples
      // This is a simple demonstration - more sophisticated approaches possible
      if (similar.length > 0 && similar[0].distance < (1 - this.similarityThreshold)) {
        // Similarity found, could use this to guide generation
        context.similarityHint = similar[0].key;
      }
    }

    return logits;
  }
}

export default EmbeddingSimilaritySkill;
