# Changelog

All notable changes to errbuddy are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.0] - 2026-10-27

### Added
- **Gemini as an optional cloud AI provider** for machines that can't run a local model. Use `--provider gemini` (or set `ERRBUDDY_PROVIDER=gemini`) with a free `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey). Ollama stays the default, and the cloud is only used when you ask for it.
- `errbuddy config` now shows the active provider, the model, and whether an API key is set.
- When Ollama isn't found, errbuddy now suggests the cloud option alongside the Ollama setup steps.

### Fixed
- `errbuddy --version` always printed `1.0.0`; it now shows the installed version.
- AI answers with numbered steps or bullet points lost their line breaks and wrapped in odd places.
- Code examples from the AI showed Markdown fences such as ` ```javascript `.

### Changed
- Ollama and Gemini share one prompt and one response parser, so prompt improvements apply to both.

## [1.0.2] - 2026-10-25

### Changed
- The README on npm now includes the demo GIF.

## [1.0.1] - 2026-10-25

### Changed
- Rewrote the README: quick start, options, supported languages, privacy and troubleshooting.
- Removed documentation for a `~/.errbuddy/config.json` file that errbuddy never read.

## [1.0.0] - 2026-10-25

First release on npm.

### Added
- `errbuddy <command>` runs any command and explains its errors, with support for JavaScript/Node.js, Java and C#/.NET.
- Local AI explanations through Ollama (default model `qwen2.5:0.5b`), with built-in pattern matching when Ollama isn't running.
- File paths and anything that looks like a secret are removed before an error reaches the AI.
- Local error history in `~/.errbuddy/history.json`.
- Options `--model`, `--offline` and `--no-ai`, and the `examples` and `config` commands.

[Unreleased]: https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/releases/tag/v1.0.0
