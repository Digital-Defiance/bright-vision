"""Shared assertions for three-layer spec generation (pytest + LLM e2e)."""

from __future__ import annotations

from bright_vision_core.spec_layers import (
    assess_generated_spec_layers,
    design_references_requirements,
)

__all__ = [
    "SAMPLE_GENERATED_MARKDOWN",
    "assess_generated_spec_layers",
    "design_references_requirements",
]

SAMPLE_GENERATED_MARKDOWN = """\
## Requirements
### REQ-001
**WHEN** the user requests a ping counter
**THE** system **SHALL** expose a health endpoint.

### REQ-002
**WHEN** the counter increments
**THE** system **SHALL** persist the count in memory.

## Design
## Overview
REQ-001 maps to HTTP routes; REQ-002 uses an in-process store.

## Implementation tasks
- [ ] 1. Add route for REQ-001 (depends: none)
- [ ] 2. Wire counter for REQ-002 (depends: 1)
"""
