"""BrightVision integration layer on top of cecli."""

__all__ = ["__version__"]

try:
    from bright_vision_core._version import version as __version__
except Exception:
    try:
        from cecli._version import version as __version__
    except Exception:
        __version__ = "0.0.0"
