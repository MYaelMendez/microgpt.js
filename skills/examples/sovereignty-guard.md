# Sovereignty Guard

## Metadata
description: Ensures all processing remains local and sovereign
priority: 100
enabled: true
author: microgpt.js

## Instructions
This skill enforces data sovereignty by:
- Blocking external API calls
- Preventing cloud-dependent operations
- Ensuring all computation is local
- Validating data doesn't leak to external services

## Validation Rules
- No external URLs in input/output
- No API keys or credentials
- All embeddings generated locally
- No telemetry or tracking

## Example Usage
The sovereignty guard runs automatically on all inputs and outputs,
ensuring that microgpt.js operates in a completely sovereign manner
without any cloud dependencies.
