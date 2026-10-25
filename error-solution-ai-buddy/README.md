<div align="center">

# errbuddy

**Plain-English explanations for errors, right in your terminal.**

Stop copying stack traces into a browser. Prefix your command with `errbuddy` and get *what* went wrong, *why*, and *how to fix it* — from an AI model that runs on your own machine.

[![npm version](https://img.shields.io/npm/v/error-solution-ai-buddy?color=cb3837&logo=npm)](https://www.npmjs.com/package/error-solution-ai-buddy)
[![npm downloads](https://img.shields.io/npm/dm/error-solution-ai-buddy)](https://www.npmjs.com/package/error-solution-ai-buddy)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
![AI](https://img.shields.io/badge/AI-local%20via%20Ollama-black)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/blob/main/error-solution-ai-buddy/LICENSE)

</div>

```text
$ errbuddy node app.js

TypeError: Cannot read properties of undefined (reading 'map')
    at app.js:12:5

╭─ 🤖 Error Buddy Explanation ──────────────────────────────────────╮
│                                                                   │
│  📘 What is this?                                                 │
│  You tried to call .map() on a variable that is undefined.        │
│                                                                   │
│  ❓ Why it happens                                                │
│  The data you expected (probably from an API) wasn't there yet.   │
│                                                                   │
│  ✅ How to fix it                                                 │
│  Check that the variable exists before calling .map().            │
│                                                                   │
│  💡 Example                                                       │
│    if (data) {                                                    │
│      data.map(...)                                                │
│    }                                                              │
│                                                                   │
╰───────────────────────────────────────────────────────────────────╯
```

## Why errbuddy

When an error shows up, most of us copy it, open a browser, paste it into a search engine or chatbot, read, switch back, and lose our train of thought. errbuddy removes every one of those steps.

- **Zero context switching.** The explanation appears right under the error.
- **Private by default.** The AI runs locally through [Ollama](https://ollama.com). Your code and errors never leave your computer.
- **Free.** No API keys, no accounts, no usage limits.
- **Works offline, and without AI.** If Ollama isn't running, errbuddy falls back to built-in explanations for common errors.
- **Drop-in.** Your program runs exactly as before: same output, same input, same exit code.

## Quick start

```bash
npm install -g error-solution-ai-buddy
errbuddy node app.js
```

That's it. You'll get pattern-based explanations straight away.

### Turn on AI explanations (optional)

1. Install Ollama from [ollama.com/download](https://ollama.com/download)
2. Download the default model (about 400 MB, runs fine on low-RAM laptops):
   ```bash
   ollama pull qwen2.5:0.5b
   ```
3. Make sure Ollama is running: open the Ollama app, or run `ollama serve`

The next time you run `errbuddy`, it detects Ollama automatically. If the default model isn't installed but another one is, errbuddy uses that instead.

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
| `--model <name>` | Use a different Ollama model, e.g. `--model llama3.2` for richer answers |
| `--offline` | Skip AI and use built-in pattern matching only |
| `--no-ai` | Show errors without any explanation |
| `-V, --version` | Show the installed version |
| `-h, --help` | Show help |

| Command | What it does |
|---|---|
| `errbuddy examples` | Show usage examples |
| `errbuddy config` | Show the current model and Ollama URL |

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
        ├── Ollama running? ──► local AI explains WHAT / WHY / FIX / EXAMPLE
        └── Not running?    ──► built-in pattern explanation
        │
        ▼
 Formatted explanation printed under the error, then your exit code is returned
```

Want the design reasoning? See [architecture](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/blob/main/error-solution-ai-buddy/docs/architecture.md) and [design decisions](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/blob/main/error-solution-ai-buddy/docs/decisions.md).

## Privacy

- The AI runs **100% locally** through Ollama. Nothing is sent to the cloud.
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

**The AI explanation timed out**
Your machine may be busy or the model too large. Use the default `qwen2.5:0.5b`, or run with `--offline`.

**`errbuddy: command not found`**
Restart your terminal. If it still fails, check that npm's global bin folder is on your `PATH` (`npm prefix -g` shows where it is).

## Development

```bash
git clone https://github.com/sithija-jayasinghe/solution-ai-buddy-v1.git
cd solution-ai-buddy-v1/error-solution-ai-buddy
npm install
npm test          # 62 tests, Node's built-in test runner
npm link          # use your local copy as the global `errbuddy`
```

```text
error-solution-ai-buddy/
├── cli/
│   ├── index.js            # CLI entry: runs the command, wires everything together
│   ├── error-listener.js   # language detection and error patterns
│   └── formatter.js        # terminal output
├── backend/src/
│   ├── ai/ollama-service.js            # Ollama client, prompt and response parsing
│   └── services/history-service.js     # local error history
├── extension/              # VS Code extension (TypeScript)
├── docs/                   # architecture and design decisions
└── tests/
```

## Roadmap

- [ ] Python and Go error patterns
- [ ] Optional cloud models (bring your own API key) for people who don't want to run Ollama
- [ ] `errbuddy history` command to search past errors
- [ ] Publish the VS Code extension to the Marketplace

## Contributing

Issues and pull requests are welcome. If errbuddy explained something badly, [open an issue](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/issues) with the error text so the patterns and prompts can improve.

## License

[MIT](https://github.com/sithija-jayasinghe/solution-ai-buddy-v1/blob/main/error-solution-ai-buddy/LICENSE) © Sithija Harshana Jayasinghe
