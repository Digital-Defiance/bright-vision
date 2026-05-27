#!/usr/bin/env python3
"""Spawn Vision HTTP API (:8741). Prefer ``bright-vision-core-serve`` after ``source activate.sh``."""

from bright_vision_core.vision_serve import run

if __name__ == "__main__":
    run()
