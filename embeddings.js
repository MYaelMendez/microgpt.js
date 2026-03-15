/**
 * Embedding utilities for microgpt.js
 * Zero-dependency embedding generation and similarity computation
 * 
 * Provides simple embedding capabilities for skills without external dependencies
 */

/**
 * Simple character-level embedding generator
 * Uses character frequencies and n-gram patterns
 */
export class SimpleEmbedding {
  constructor(dimensions = 16) {
    this.dimensions = dimensions;
    this.vocab = new Map();
  }

  /**
   * Generate embedding from text
   * @param {string} text - Input text
   * @returns {Float32Array} Embedding vector
   */
  encode(text) {
    const embedding = new Float32Array(this.dimensions);
    
    if (!text || text.length === 0) {
      return embedding;
    }

    // Character frequency features (first half of dimensions)
    const charFreq = new Map();
    for (const char of text) {
      charFreq.set(char, (charFreq.get(char) || 0) + 1);
    }

    const halfDim = Math.floor(this.dimensions / 2);
    let idx = 0;
    for (const [char, freq] of charFreq) {
      if (idx < halfDim) {
        embedding[idx] = freq / text.length;
        idx++;
      }
    }

    // Bigram features (second half)
    if (text.length > 1) {
      const bigrams = new Map();
      for (let i = 0; i < text.length - 1; i++) {
        const bigram = text.slice(i, i + 2);
        bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
      }

      idx = halfDim;
      for (const [, freq] of bigrams) {
        if (idx < this.dimensions) {
          embedding[idx] = freq / (text.length - 1);
          idx++;
        }
      }
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm;
      }
    }

    return embedding;
  }

  /**
   * Generate embedding from token sequence
   * @param {Array<number>} tokens - Token IDs
   * @param {Map<number, string>} idToChar - Mapping from token ID to character
   * @returns {Float32Array} Embedding vector
   */
  encodeTokens(tokens, idToChar) {
    const text = tokens.map(id => idToChar.get(id) || '').join('');
    return this.encode(text);
  }
}

/**
 * Advanced embedding with positional encoding (GPT-style)
 */
export class PositionalEmbedding {
  constructor(dimensions = 16, maxLength = 128) {
    this.dimensions = dimensions;
    this.maxLength = maxLength;
    this.posEncoding = this._generatePositionalEncoding();
  }

  /**
   * Generate sinusoidal positional encoding
   * Following the "Attention is All You Need" paper (Vaswani et al., 2017)
   * PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
   * PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
   * @private
   */
  _generatePositionalEncoding() {
    const encoding = Array.from({ length: this.maxLength }, () => 
      new Float32Array(this.dimensions)
    );

    for (let pos = 0; pos < this.maxLength; pos++) {
      for (let i = 0; i < this.dimensions; i++) {
        const angle = pos / Math.pow(10000, 2 * Math.floor(i / 2) / this.dimensions);
        encoding[pos][i] = i % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
      }
    }

    return encoding;
  }

  /**
   * Encode tokens with positional information
   * @param {Array<number>} tokens - Token IDs
   * @param {Array<Array<number>>} tokenEmbeddings - Token embedding matrix
   * @returns {Array<Float32Array>} Sequence of embeddings
   */
  encode(tokens, tokenEmbeddings) {
    return tokens.map((tokenId, pos) => {
      const embedding = new Float32Array(this.dimensions);
      const tokenEmb = tokenEmbeddings[tokenId] || new Float32Array(this.dimensions);
      const posEmb = this.posEncoding[Math.min(pos, this.maxLength - 1)];

      for (let i = 0; i < this.dimensions; i++) {
        embedding[i] = (tokenEmb[i] || 0) + posEmb[i];
      }

      return embedding;
    });
  }
}

/**
 * Similarity and distance metrics
 */
export class SimilarityMetrics {
  /**
   * Compute cosine similarity between two vectors
   * @param {Float32Array|Array} a - First vector
   * @param {Float32Array|Array} b - Second vector
   * @returns {number} Similarity score [-1, 1]
   */
  static cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Compute Euclidean distance between two vectors
   * @param {Float32Array|Array} a - First vector
   * @param {Float32Array|Array} b - Second vector
   * @returns {number} Distance
   */
  static euclideanDistance(a, b) {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Compute Manhattan distance between two vectors
   * @param {Float32Array|Array} a - First vector
   * @param {Float32Array|Array} b - Second vector
   * @returns {number} Distance
   */
  static manhattanDistance(a, b) {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.abs(a[i] - b[i]);
    }

    return sum;
  }

  /**
   * Find k nearest neighbors
   * @param {Float32Array|Array} query - Query vector
   * @param {Array<Float32Array|Array>} vectors - Collection of vectors
   * @param {number} k - Number of neighbors
   * @param {string} metric - 'cosine', 'euclidean', or 'manhattan'
   * @returns {Array<{index: number, distance: number}>} Top k neighbors
   */
  static kNearestNeighbors(query, vectors, k = 5, metric = 'cosine') {
    const distances = vectors.map((vec, idx) => {
      let distance;
      if (metric === 'cosine') {
        distance = 1 - this.cosineSimilarity(query, vec); // Convert similarity to distance
      } else if (metric === 'euclidean') {
        distance = this.euclideanDistance(query, vec);
      } else if (metric === 'manhattan') {
        distance = this.manhattanDistance(query, vec);
      } else {
        throw new Error(`Unknown metric: ${metric}`);
      }
      return { index: idx, distance };
    });

    distances.sort((a, b) => a.distance - b.distance);
    return distances.slice(0, Math.min(k, distances.length));
  }
}

/**
 * Simple embedding store for caching and retrieval
 */
export class EmbeddingStore {
  constructor() {
    this.embeddings = new Map();
    this.metadata = new Map();
  }

  /**
   * Store an embedding with associated data
   * @param {string} key - Unique identifier
   * @param {Float32Array|Array} embedding - Embedding vector
   * @param {Object} metadata - Associated metadata
   */
  store(key, embedding, metadata = {}) {
    this.embeddings.set(key, new Float32Array(embedding));
    this.metadata.set(key, metadata);
  }

  /**
   * Retrieve an embedding
   * @param {string} key - Unique identifier
   * @returns {Float32Array|undefined} Embedding vector
   */
  get(key) {
    return this.embeddings.get(key);
  }

  /**
   * Search for similar embeddings
   * @param {Float32Array|Array} query - Query embedding
   * @param {number} k - Number of results
   * @param {string} metric - Distance metric
   * @returns {Array<{key: string, distance: number, metadata: Object}>}
   */
  search(query, k = 5, metric = 'cosine') {
    const keys = Array.from(this.embeddings.keys());
    const vectors = Array.from(this.embeddings.values());

    const neighbors = SimilarityMetrics.kNearestNeighbors(query, vectors, k, metric);

    return neighbors.map(n => ({
      key: keys[n.index],
      distance: n.distance,
      metadata: this.metadata.get(keys[n.index])
    }));
  }

  /**
   * Get all stored keys
   * @returns {Array<string>} Array of keys
   */
  keys() {
    return Array.from(this.embeddings.keys());
  }

  /**
   * Get number of stored embeddings
   * @returns {number} Count
   */
  size() {
    return this.embeddings.size;
  }

  /**
   * Clear all embeddings
   */
  clear() {
    this.embeddings.clear();
    this.metadata.clear();
  }
}

export default {
  SimpleEmbedding,
  PositionalEmbedding,
  SimilarityMetrics,
  EmbeddingStore
};
