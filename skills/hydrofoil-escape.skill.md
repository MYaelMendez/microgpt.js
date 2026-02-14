# hydrofoil-escape

**Version:** 1.0.0

**Description:** Emergency escape mechanism that halts inference when drift or anomalies are detected. Provides circuit-breaker functionality to prevent runaway inference or model degradation.

## Purpose

The hydrofoil-escape skill acts as a safety mechanism:
- Detects loss spikes or anomalous behavior
- Halts inference on critical violations
- Provides graceful degradation strategies
- Logs escape events for post-mortem analysis

## Before Inference

Checks for drift conditions before proceeding with inference.

```javascript
const hookFunction = (context) => {
  const { step, prev_loss, current_loss, temperature } = context;
  
  // Configuration constants
  const MAX_LOSS_RATIO = 3.0;      // Maximum acceptable loss increase
  const MIN_LOSS_RATIO = 0.3;      // Minimum acceptable loss decrease (30% of previous)
  const MAX_TEMPERATURE = 2.0;     // Maximum safe temperature value
  const MAX_STEP_LIMIT = 5000;     // Emergency step limit
  
  const driftChecks = {
    lossDrift: false,
    temperatureDrift: false,
    stepLimit: false
  };
  
  // Check for sudden loss spikes (drift detection)
  // Only check if both prev_loss and current_loss are valid numbers
  if (prev_loss !== undefined && prev_loss !== null && 
      current_loss !== undefined && current_loss !== null &&
      !isNaN(prev_loss) && !isNaN(current_loss) &&
      prev_loss !== 0) {  // Avoid division by zero
    const lossRatio = current_loss / prev_loss;
    if (lossRatio > MAX_LOSS_RATIO || lossRatio < MIN_LOSS_RATIO) {
      driftChecks.lossDrift = true;
    }
  }
  
  // Check for extreme temperature values
  if (temperature !== undefined && (temperature <= 0 || temperature > MAX_TEMPERATURE)) {
    driftChecks.temperatureDrift = true;
  }
  
  // Emergency step limit
  if (step > MAX_STEP_LIMIT) {
    driftChecks.stepLimit = true;
  }
  
  const shouldEscape = Object.values(driftChecks).some(v => v === true);
  
  if (shouldEscape) {
    console.warn(`[hydrofoil-escape] Drift detected at step ${step}:`, driftChecks);
    return {
      escape: true,
      reason: driftChecks,
      action: 'halt',
      timestamp: Date.now()
    };
  }
  
  return {
    escape: false,
    status: 'nominal',
    checks: driftChecks
  };
};
```

## Validate

Validates current state and determines if escape is needed.

```javascript
const hookFunction = (context) => {
  const { loss, step, sample_idx } = context;
  
  // Configuration constants
  const LOSS_EXPLOSION_THRESHOLD = 100;     // Loss value indicating explosion
  const MAX_STEP_LIMIT = 10000;             // Maximum training/inference steps
  
  const escapeConditions = [];
  
  // Condition 1: Loss explosion
  if (loss && loss > LOSS_EXPLOSION_THRESHOLD) {
    escapeConditions.push({
      type: 'loss_explosion',
      value: loss,
      threshold: LOSS_EXPLOSION_THRESHOLD
    });
  }
  
  // Condition 2: NaN loss
  if (loss && isNaN(loss)) {
    escapeConditions.push({
      type: 'nan_loss',
      value: loss
    });
  }
  
  // Condition 3: Excessive iterations
  if (step && step > MAX_STEP_LIMIT) {
    escapeConditions.push({
      type: 'step_limit_exceeded',
      value: step,
      threshold: MAX_STEP_LIMIT
    });
  }
  
  const needsEscape = escapeConditions.length > 0;
  
  return {
    valid: !needsEscape,
    escape: needsEscape,
    conditions: escapeConditions,
    recommendation: needsEscape ? 'halt_and_review' : 'continue',
    timestamp: Date.now()
  };
};
```

## Evaluate

Evaluates the escape state and provides recommendations.

```javascript
const hookFunction = (context) => {
  const { step, loss, escape_triggered } = context;
  
  return {
    skill: 'hydrofoil-escape',
    version: '1.0.0',
    evaluation: {
      step,
      loss,
      escape_triggered: escape_triggered || false,
      status: escape_triggered ? 'escaped' : 'monitoring',
      timestamp: Date.now()
    },
    recommendations: escape_triggered 
      ? ['Review model parameters', 'Check training data', 'Reduce learning rate']
      : ['Continue monitoring']
  };
};
```
