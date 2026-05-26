# Prerequisites once
brew install gh
gh auth login

# Full release: build + notarize + GitHub + cask
yarn build:mac 0.2.0 --publish

# Also push homebrew-tap
yarn build:mac 0.2.0 --publish --push-tap

# Bright-style cask version (0.1.0-bright4) with matching git tag
yarn build:mac 0.1.0-bright4 --release-tag v0.1.0-bright4 --publish --push-tap
