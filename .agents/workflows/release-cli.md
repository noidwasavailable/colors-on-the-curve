---
description: Publish a new CLI release with prebuilt binaries to GitHub
---

Steps to publish a new release of the `cotc` CLI binaries:

1. Make sure all changes are committed and pushed to `main`.

// turbo
2. Bump the version in `dist/lib/package.json` (the published lib package) if the lib changed too.

3. Create and push a version tag — this triggers the GitHub Actions release workflow:
```bash
git tag v<VERSION>     # e.g. git tag v0.2.0
git push origin v<VERSION>
```

4. GitHub Actions (`.github/workflows/release.yml`) will automatically:
   - Build the `cotc` binary for all 5 targets (linux-x64, linux-arm64, darwin-x64, darwin-arm64, windows-x64).
   - Create a GitHub Release named after the tag.
   - Upload the binaries as release assets with descriptive names (`cotc-linux-x64`, `cotc-macos-arm64`, etc.).
   - Auto-generate release notes from merged PRs/commits since the last tag.

5. Verify the release at: https://github.com/<OWNER>/<REPO>/releases

Users can then download and run the binary directly:
```bash
# macOS (Apple Silicon)
curl -L https://github.com/<OWNER>/<REPO>/releases/latest/download/cotc-macos-arm64 -o cotc
chmod +x cotc
./cotc
```
