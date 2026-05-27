# Fonts

## Wordmark (BrightVision logo text)

Commit Inter exports used by inline SVG wordmarks (`src/assets/brand/*.svg`):

```
Inter-Black.woff2
Inter-Thin.woff2
```

`global.scss` registers `@font-face` for `Inter-Black` and `Inter-Thin` so `BrandLogo` renders correctly when SVG is inlined in the app shell.

## Chat / terminal preset

Commit **Glass TTY VT220** for the optional classic terminal chat font:

```
Glass_TTY_VT220.woff2
```

If Glass TTY is missing, chat falls back to the system monospace stack.

Include font license terms in the repo if required for distribution.
