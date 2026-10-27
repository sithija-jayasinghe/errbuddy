<div align="center">

# errbuddy

**Plain-English explanations for errors, right in your terminal.**

Stop copying stack traces into a browser. Prefix your command with `errbuddy` and get *what* went wrong, *why*, and *how to fix it* — from an AI model that runs on your own machine.

[![npm version](https://img.shields.io/npm/v/error-solution-ai-buddy?color=cb3837&logo=npm)](https://www.npmjs.com/package/error-solution-ai-buddy)
[![npm downloads](https://img.shields.io/npm/dm/error-solution-ai-buddy)](https://www.npmjs.com/package/error-solution-ai-buddy)
[![GitHub release](https://img.shields.io/github/v/release/sithija-jayasinghe/solution-ai-buddy-v1?logo=github)](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/releases)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
![AI](https://img.shields.io/badge/AI-local%20via%20Ollama-black)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/blob/main/error-solution-ai-buddy/LICENSE)

</div>

<p align="center">
  <img src="https://raw.githubusercontent.com/sithija-jayasinghe/solution-ai-buddy-v1/main/error-solution-ai-buddy/docs/demo.gif" alt="errbuddy --provider gemini node app.js: a TypeError appears, Gemini is asked for an explanation, and a box explains what went wrong, why, and how to fix it" width="760">
</p>

## Why errbuddy

When an error shows up, most of us copy it, open a browser, paste it into a search engine or chatbot, read, switch back, and lose our train of thought. errbuddy removes every one of those steps.

- **Zero context switching.** The explanation appears right under the error.
- **Private by default.** The AI runs locally through [Ollama](https://ollama.com). Your code and errors never leave your computer.
- **No room for a local model? Use the cloud.** Bring a free [Gemini](https://aistudio.google.com/apikey) API key instead. Opt-in only.
- **Free.** Both AI options are free. No accounts with errbuddy, no usage limits from us.
- **Works offline, and without AI.** If no AI is available, errbuddy falls back to built-in explanations for common errors.
- **Drop-in.** Your program runs exactly as before: same output, same input, same exit code.

## Quick start

```bash
npm install -g error-solution-ai-buddy
errbuddy node app.js
```

That's it. You'll get pattern-based explanations straight away.

### Turn on AI explanations (optional)

Pick whichever suits your machine:

| | **Local: Ollama** (default) | **Cloud: Gemini** |
|---|---|---|
| Privacy | Errors never leave your computer | Sanitized errors are sent to Google |
| Needs | ~400 MB disk + a few GB of RAM | Internet + a free API key |
| Works offline | Yes | No |

**Option A: Local with Ollama**

1. Install Ollama from [ollama.com/download](https://ollama.com/download)
2. Download the default model (about 400 MB, runs fine on low-RAM laptops):
   ```bash
   ollama pull qwen2.5:0.5b
   ```
3. Make sure Ollama is running: open the Ollama app, or run `ollama serve`

The next time you run `errbuddy`, it detects Ollama automatically. If the default model isn't installed but another one is, errbuddy uses that instead.

**Option B: Cloud with Gemini**

1. Create a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Save it in your shell (add this line to `~/.zshrc` or `~/.bashrc` to keep it):
   ```bash
   export GEMINI_API_KEY="your-key"
   ```
3. Run with the Gemini provider:
   ```bash
   errbuddy --provider gemini node app.js
   ```

To make Gemini your default, also set `export ERRBUDDY_PROVIDER=gemini`. The free tier has rate limits; if you hit one, errbuddy falls back to pattern matching and tells you why.

## Usage

Put `errbuddy` in front of the command you normally run:

```bash
errbuddy node app.js        # instead of: node app.js
errbuddy npm start          # instead of: npm start
errbuddy java MyApp         # instead of: java MyApp
errbuddy dotnet run         # instead of: dotnet run
```

### Options

| Option | What it does |
|---|---|
| `--provider <name>` | `ollama` (local, default) or `gemini` (cloud, needs `GEMINI_API_KEY`) |
| `--model <name>` | Use a different model, e.g. `--model llama3.2` for Ollama or `--model gemini-3.8-flash` for Gemini |
| `--offline` | Skip AI and use built-in pattern matching only |
| `--no-ai` | Show errors without any explanation |
| `-V, --version` | Show the installed version |
| `-h, --help` | Show help |

| Command | What it does |
|---|---|
| `errbuddy examples` | Show usage examples |
| `errbuddy config` | Show the current provider, model and whether an API key is set |

| Environment variable | What it does |
|---|---|
| `GEMINI_API_KEY` | Your Gemini API key (only needed for `--provider gemini`) |
| `ERRBUDDY_PROVIDER` | Default provider when `--provider` isn't given (`ollama` or `gemini`) |

> Put errbuddy's own options **before** your command: `errbuddy --model llama3.2 node app.js`. Anything after the command is passed straight through to it.

## Supported languages

| Language | Detected errors include |
|---|---|
| JavaScript / Node.js | `TypeError`, `ReferenceError`, `SyntaxError`, missing modules |
| Java | `NullPointerException`, `ArrayIndexOutOfBoundsException`, `ClassNotFoundException`, compile errors |
| C# / .NET | `NullReferenceException`, `IndexOutOfRangeException`, `CSxxxx` compiler errors |

With AI enabled, errbuddy can explain other errors too; pattern matching covers the cases above.

## How it works

```text
errbuddy node app.js
        │
        ▼
 Runs your command ──► stdout is shown as normal
        │              stderr is shown AND captured
        ▼
 Error detector ──► finds the language, error type, file and line
        │
        ▼
 Sanitizer ──► strips file paths and anything that looks like a secret
        │
        ├── AI available? ──► Ollama (local) or Gemini (cloud) explains
        │                     WHAT / WHY / FIX / EXAMPLE
        └── Not available? ──► built-in pattern explanation
        │
        ▼
 Formatted explanation printed under the error, then your exit code is returned
```

Want the design reasoning? See [architecture](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/blob/main/error-solution-ai-buddy/docs/architecture.md) and [design decisions](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/blob/main/error-solution-ai-buddy/docs/decisions.md).

## Privacy

- By default the AI runs **100% locally** through Ollama. Nothing is sent to the cloud.
- The cloud provider is **opt-in only**: errbuddy talks to Gemini only when you pass `--provider gemini` or set `ERRBUDDY_PROVIDER=gemini`. In that mode the sanitized error text is sent to Google's Gemini API and is handled under [Google's terms](https://ai.google.dev/gemini-api/terms) (on the free tier, Google may use it to improve its products).
- Your API key is read from `GEMINI_API_KEY` and sent in a request header, never in a URL or command-line argument.
- Before an error reaches the model, absolute file paths (`/Users/...`, `C:\Users\...`) are replaced with `[path]` and values that look like API keys, tokens or passwords are replaced with `[REDACTED]`.
- No telemetry, no analytics, no account.
- A local history of errors and explanations is kept in `~/.errbuddy/history.json`. Delete that file at any time to clear it.

## VS Code extension

The repo also includes an Error Buddy extension for VS Code that explains errors from the integrated terminal or from selected text. It isn't on the Marketplace yet. To try it, install [`error-buddy-1.0.0.vsix`](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/tree/main/error-solution-ai-buddy/extension) with **Extensions → … → Install from VSIX**.

Commands: *Explain Selected Error*, *Explain Last Terminal Error*, *Toggle Auto-Explain*, *Open Error Buddy Terminal*, *Show Error History*.

## Troubleshooting

**"Ollama not detected"**
1. Open the Ollama app, or run `ollama serve`
2. Check it responds: `curl http://localhost:11434/api/tags`
3. Make sure you have a model: `ollama pull qwen2.5:0.5b`

**"GEMINI_API_KEY is not set"**
Create a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and run `export GEMINI_API_KEY="your-key"` in the same terminal. Check with `errbuddy config`.

**"Gemini rejected the API key" / "rate limit reached"**
Double-check the key (no extra spaces or quotes). Rate limits on the free tier reset after a minute.

**The AI explanation timed out**
Your machine may be busy or the model too large. Use the default `qwen2.5:0.5b`, or run with `--offline`.

**`errbuddy: command not found`**
Restart your terminal. If it still fails, check that npm's global bin folder is on your `PATH` (`npm prefix -g` shows where it is).

## Development

```bash
git clone https://github.com/sithija-jayasinghe/solution-ai-buddy-v1.git
cd solution-ai-buddy-v1/error-solution-ai-buddy
npm install
npm test          # 86 tests, Node's built-in test runner
npm link          # use your local copy as the global `errbuddy`
```

```text
error-solution-ai-buddy/
├── cli/
│   ├── index.js            # CLI entry: runs the command, wires everything together
│   ├── error-listener.js   # language detection and error patterns
│   └── formatter.js        # terminal output
├── backend/src/
│   ├── ai/prompt.js                    # shared prompt + response parsing
│   ├── ai/ollama-service.js            # local provider (Ollama)
│   ├── ai/gemini-service.js            # cloud provider (Gemini)
│   └── services/history-service.js     # local error history
├── extension/              # VS Code extension (TypeScript)
├── docs/                   # architecture and design decisions
└── tests/
```

### Releasing

Every version is listed in [CHANGELOG.md](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/blob/main/error-solution-ai-buddy/CHANGELOG.md) and on the [Releases page](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/releases).

1. Move the notes under `## [Unreleased]` in `CHANGELOG.md` into a new `## [x.y.z] - YYYY-MM-DD` section.
2. Bump the version: `npm version patch` (or `minor` / `major`) inside `error-solution-ai-buddy/`.
3. Commit, tag and push: `git commit -am "x.y.z" && git tag vx.y.z && git push && git push origin vx.y.z`
4. Publish to npm: `npm publish`

Pushing the tag runs the tests and creates the GitHub Release automatically, using that version's CHANGELOG section as the release notes.

## Roadmap

- [ ] Python and Go error patterns
- [x] Optional cloud model (bring your own Gemini API key) for people who can't run Ollama
- [ ] More cloud providers (OpenAI, Claude)
- [ ] `errbuddy history` command to search past errors
- [ ] Publish the VS Code extension to the Marketplace

## Contributing

Issues and pull requests are welcome. If errbuddy explained something badly, [open an issue](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/issues) with the error text so the patterns and prompts can improve.

## License

[MIT](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/blob/main/error-solution-ai-buddy/LICENSE) © Sithija Harshana Jayasinghe
