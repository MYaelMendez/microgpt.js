/**
 * Sovereignty and Validation Framework for microgpt.js
 * Zero-dependency validation and invariant checking system
 * 
 * Ensures data sovereignty and provides hooks for self-diagnosis
 * without cloud dependencies
 */

/**
 * Base Validator class
 */
export class Validator {
  constructor(config = {}) {
    this.name = config.name || 'unnamed-validator';
    this.description = config.description || '';
    this.enabled = config.enabled !== false;
    this.severity = config.severity || 'warning'; // 'error', 'warning', 'info'
  }

  /**
   * Validate data
   * @param {any} data - Data to validate
   * @param {Object} context - Additional context
   * @returns {Object} { valid: boolean, issues: Array<{severity, message}> }
   */
  validate(data, context = {}) {
    return { valid: true, issues: [] };
  }
}

/**
 * Validator for checking data bounds and constraints
 */
export class BoundsValidator extends Validator {
  constructor(config = {}) {
    super(config);
    this.min = config.min;
    this.max = config.max;
    this.field = config.field;
  }

  validate(data, context = {}) {
    const issues = [];
    let valid = true;

    const value = this.field ? data[this.field] : data;

    if (typeof value === 'number') {
      if (this.min !== undefined && value < this.min) {
        valid = false;
        issues.push({
          severity: this.severity,
          message: `Value ${value} is below minimum ${this.min}`
        });
      }
      if (this.max !== undefined && value > this.max) {
        valid = false;
        issues.push({
          severity: this.severity,
          message: `Value ${value} exceeds maximum ${this.max}`
        });
      }
    }

    return { valid, issues };
  }
}

/**
 * Validator for checking required fields
 */
export class RequiredFieldsValidator extends Validator {
  constructor(config = {}) {
    super(config);
    this.fields = config.fields || [];
  }

  validate(data, context = {}) {
    const issues = [];
    let valid = true;

    if (typeof data !== 'object' || data === null) {
      return {
        valid: false,
        issues: [{ severity: 'error', message: 'Data must be an object' }]
      };
    }

    for (const field of this.fields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        valid = false;
        issues.push({
          severity: this.severity,
          message: `Required field '${field}' is missing or null`
        });
      }
    }

    return { valid, issues };
  }
}

/**
 * Validator for checking data types
 */
export class TypeValidator extends Validator {
  constructor(config = {}) {
    super(config);
    this.expectedType = config.expectedType;
    this.field = config.field;
  }

  validate(data, context = {}) {
    const issues = [];
    let valid = true;

    const value = this.field ? data[this.field] : data;
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (actualType !== this.expectedType) {
      valid = false;
      issues.push({
        severity: this.severity,
        message: `Expected type '${this.expectedType}' but got '${actualType}'`
      });
    }

    return { valid, issues };
  }
}

/**
 * Validator for checking array/string length
 */
export class LengthValidator extends Validator {
  constructor(config = {}) {
    super(config);
    this.minLength = config.minLength;
    this.maxLength = config.maxLength;
    this.field = config.field;
  }

  validate(data, context = {}) {
    const issues = [];
    let valid = true;

    const value = this.field ? data[this.field] : data;

    if (value && (Array.isArray(value) || typeof value === 'string')) {
      const length = value.length;

      if (this.minLength !== undefined && length < this.minLength) {
        valid = false;
        issues.push({
          severity: this.severity,
          message: `Length ${length} is below minimum ${this.minLength}`
        });
      }

      if (this.maxLength !== undefined && length > this.maxLength) {
        valid = false;
        issues.push({
          severity: this.severity,
          message: `Length ${length} exceeds maximum ${this.maxLength}`
        });
      }
    }

    return { valid, issues };
  }
}

/**
 * Validator for pattern matching (regex)
 */
export class PatternValidator extends Validator {
  constructor(config = {}) {
    super(config);
    this.pattern = config.pattern instanceof RegExp 
      ? config.pattern 
      : new RegExp(config.pattern || '.*');
    this.field = config.field;
  }

  validate(data, context = {}) {
    const issues = [];
    let valid = true;

    const value = this.field ? data[this.field] : data;

    if (typeof value === 'string') {
      if (!this.pattern.test(value)) {
        valid = false;
        issues.push({
          severity: this.severity,
          message: `Value does not match pattern ${this.pattern}`
        });
      }
    }

    return { valid, issues };
  }
}

/**
 * Sovereignty check validator - ensures local processing
 */
export class SovereigntyValidator extends Validator {
  constructor(config = {}) {
    super(config);
    this.allowedDomains = config.allowedDomains || [];
    this.blockedPatterns = config.blockedPatterns || [
      /https?:\/\//i,  // External URLs
      /api\.openai\.com/i,
      /cloud\./i
    ];
  }

  validate(data, context = {}) {
    const issues = [];
    let valid = true;

    const dataStr = JSON.stringify(data);

    // Check for blocked patterns
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(dataStr)) {
        // Check if it's in allowed domains
        let allowed = false;
        for (const domain of this.allowedDomains) {
          if (dataStr.includes(domain)) {
            allowed = true;
            break;
          }
        }

        if (!allowed) {
          valid = false;
          issues.push({
            severity: 'error',
            message: `Sovereignty violation: Data contains external reference matching ${pattern}`
          });
        }
      }
    }

    return { valid, issues };
  }
}

/**
 * Invariant checker - validates model-specific invariants
 */
export class InvariantChecker extends Validator {
  constructor(config = {}) {
    super(config);
    this.invariants = config.invariants || [];
  }

  /**
   * Add an invariant check function
   * @param {Function} check - Function that returns {valid, message}
   */
  addInvariant(check) {
    this.invariants.push(check);
  }

  validate(data, context = {}) {
    const issues = [];
    let valid = true;

    for (const invariant of this.invariants) {
      const result = invariant(data, context);
      if (!result.valid) {
        valid = false;
        issues.push({
          severity: this.severity,
          message: result.message || 'Invariant violation'
        });
      }
    }

    return { valid, issues };
  }
}

/**
 * ValidationEngine - orchestrates multiple validators
 */
export class ValidationEngine {
  constructor() {
    this.validators = [];
    this.stopOnError = false;
  }

  /**
   * Add a validator
   * @param {Validator} validator - Validator instance
   */
  addValidator(validator) {
    if (!(validator instanceof Validator)) {
      throw new Error('Must be a Validator instance');
    }
    this.validators.push(validator);
    return this;
  }

  /**
   * Remove a validator by name
   * @param {string} name - Validator name
   */
  removeValidator(name) {
    this.validators = this.validators.filter(v => v.name !== name);
    return this;
  }

  /**
   * Validate data against all validators
   * @param {any} data - Data to validate
   * @param {Object} context - Validation context
   * @returns {Object} Validation result
   */
  validate(data, context = {}) {
    const allIssues = [];
    let allValid = true;

    for (const validator of this.validators) {
      if (!validator.enabled) continue;

      const result = validator.validate(data, context);
      
      if (!result.valid) {
        allValid = false;
        allIssues.push(...result.issues.map(issue => ({
          ...issue,
          validator: validator.name
        })));

        if (this.stopOnError && result.issues.some(i => i.severity === 'error')) {
          break;
        }
      }
    }

    return {
      valid: allValid,
      issues: allIssues,
      errors: allIssues.filter(i => i.severity === 'error'),
      warnings: allIssues.filter(i => i.severity === 'warning')
    };
  }

  /**
   * Get all validators info
   * @returns {Array} Validator information
   */
  getValidators() {
    return this.validators.map(v => ({
      name: v.name,
      description: v.description,
      enabled: v.enabled,
      severity: v.severity
    }));
  }
}

/**
 * Self-diagnostic system for local issue detection
 */
export class SelfDiagnostic {
  constructor() {
    this.checks = new Map();
    this.results = [];
  }

  /**
   * Register a diagnostic check
   * @param {string} name - Check name
   * @param {Function} checkFn - Async function that returns {status, message}
   */
  registerCheck(name, checkFn) {
    this.checks.set(name, checkFn);
  }

  /**
   * Run all diagnostic checks
   * @returns {Promise<Object>} Diagnostic results
   */
  async runDiagnostics() {
    this.results = [];

    for (const [name, checkFn] of this.checks) {
      try {
        const result = await checkFn();
        this.results.push({
          name,
          status: result.status || 'ok',
          message: result.message || '',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        this.results.push({
          name,
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      checks: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'ok').length,
        warnings: this.results.filter(r => r.status === 'warning').length,
        errors: this.results.filter(r => r.status === 'error').length
      }
    };
  }

  /**
   * Get last diagnostic results
   * @returns {Array} Results
   */
  getLastResults() {
    return this.results;
  }
}

export default {
  Validator,
  BoundsValidator,
  RequiredFieldsValidator,
  TypeValidator,
  LengthValidator,
  PatternValidator,
  SovereigntyValidator,
  InvariantChecker,
  ValidationEngine,
  SelfDiagnostic
};
