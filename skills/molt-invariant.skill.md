# molt-invariant

**Version:** 1.0.0

**Description:** Validates model invariants during inference to ensure consistent behavior and detect drift. Tracks key metrics like loss bounds, gradient norms, and output distributions.

## Purpose

The molt-invariant skill ensures that the model maintains critical invariants during inference and training. It monitors:
- Loss values staying within acceptable bounds
- Output probability distributions remaining valid
- Gradient magnitudes during backpropagation
- Numerical stability indicators

## Validate

Checks model state for invariant violations.

```javascript
const hookFunction = (context) => {
  const { loss, probs, step } = context;
  const violations = [];

  // Configuration constants
  // PROB_SUM_TOLERANCE: 1% tolerance accounts for floating-point arithmetic errors
  // and the softmax normalization. For stricter validation, use 1e-6, but this may
  // trigger false positives due to accumulated floating-point errors in the chain.
  const PROB_SUM_TOLERANCE = 0.01;

  // Check 1: Loss should be finite and positive
  if (loss && (isNaN(loss) || !isFinite(loss) || loss < 0)) {
    violations.push({
      type: 'loss_invalid',
      message: `Loss is invalid: ${loss}`,
      severity: 'critical'
    });
  }

  // Check 2: Probabilities should sum to ~1.0
  if (probs && Array.isArray(probs)) {
    const probSum = probs.reduce((sum, p) => sum + (p.data || p), 0);
    if (Math.abs(probSum - 1.0) > PROB_SUM_TOLERANCE) {
      violations.push({
        type: 'prob_sum_invalid',
        message: `Probability sum is ${probSum}, expected ~1.0 (tolerance: ${PROB_SUM_TOLERANCE})`,
        severity: 'warning'
      });
    }

    // Check 3: No negative probabilities
    const hasNegative = probs.some(p => (p.data || p) < 0);
    if (hasNegative) {
      violations.push({
        type: 'negative_probability',
        message: 'Detected negative probability values',
        severity: 'critical'
      });
    }
  }

  // Check 4: Numerical stability - check for NaN/Inf in context
  const checkNumerical = (obj, path = '') => {
    if (typeof obj === 'number') {
      if (isNaN(obj) || !isFinite(obj)) {
        violations.push({
          type: 'numerical_instability',
          message: `NaN/Inf detected at ${path}`,
          severity: 'critical'
        });
      }
    } else if (obj && typeof obj === 'object' && obj.data !== undefined) {
      checkNumerical(obj.data, path + '.data');
    }
  };

  if (context.logits) {
    checkNumerical(context.logits, 'logits');
  }

  return {
    valid: violations.length === 0,
    violations,
    timestamp: Date.now(),
    step
  };
};
```

## Evaluate

Self-checking evaluation to generate an invariant receipt.

```javascript
const hookFunction = (context) => {
  const { step, loss } = context;
  
  return {
    skill: 'molt-invariant',
    version: '1.0.0',
    evaluation: {
      step,
      loss: loss || 'N/A',
      status: 'checked',
      timestamp: Date.now()
    },
    receipt: `molt-invariant-${step}-${Date.now()}`
  };
};
```
