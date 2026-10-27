/**
 * Formatter - Pretty prints error explanations to the terminal
 * 
 * This module handles all output formatting to make errors
 * easy to read at a glance.
 * 
 * WHY separate formatting:
 * 1. Single responsibility (easy to maintain)
 * 2. Easy to change styling without touching logic
 * 3. Can support different output formats (terminal, JSON, etc.)
 */

import chalk from 'chalk';
import boxen from 'boxen';

export class Formatter {
  constructor(options = {}) {
    this.useColor = options.useColor !== false;
    this.useEmoji = options.useEmoji !== false;
    this.boxStyle = options.boxStyle || 'round';
  }

  /**
   * Print AI-generated explanation
   * 
   * Expected format from AI:
   * {
   *   what: "What the error is",
   *   why: "Why it happened",
   *   fix: "How to fix it",
   *   example: "Code example"
   * }
   */
  printAIExplanation(explanation) {
    const header = this.useEmoji ? '🤖 Error Buddy Explanation:' : '[Error Buddy]';
    
    let content = '';
    
    // What is this?
    if (explanation.what) {
      content += chalk.cyan.bold(this.useEmoji ? '📘 What is this?' : '[What]') + '\n';
      content += this.wrapText(explanation.what) + '\n\n';
    }
    
    // Why it happens?
    if (explanation.why) {
      content += chalk.yellow.bold(this.useEmoji ? '❓ Why it happens?' : '[Why]') + '\n';
      content += this.wrapText(explanation.why) + '\n\n';
    }
    
    // How to fix?
    if (explanation.fix) {
      content += chalk.green.bold(this.useEmoji ? '✅ How to fix it:' : '[Fix]') + '\n';
      content += this.wrapText(explanation.fix) + '\n';
    }
    
    // Code example
    if (explanation.example) {
      content += '\n' + chalk.magenta.bold(this.useEmoji ? '💡 Example:' : '[Example]') + '\n';
      content += chalk.gray(this.formatCode(explanation.example));
    }

    // Print in a box
    const box = boxen(content.trim(), {
      title: header,
      titleAlignment: 'left',
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: this.boxStyle,
      borderColor: 'cyan',
    });

    console.log(box);
  }

  /**
   * Print pattern-based explanation (when AI is unavailable)
   */
  printPatternExplanation(analysis) {
    if (!analysis.localExplanation) {
      this.printGenericHelp(analysis);
      return;
    }

    const explanation = analysis.localExplanation;
    const header = this.useEmoji ? '📋 Quick Explanation:' : '[Quick Help]';
    
    let content = '';
    
    // Language detected
    if (analysis.language && analysis.language !== 'unknown') {
      content += chalk.gray(`Language: ${this.formatLanguage(analysis.language)}`) + '\n';
      if (analysis.errorType) {
        content += chalk.gray(`Error: ${analysis.errorType}`) + '\n';
      }
      content += '\n';
    }

    // What
    content += chalk.cyan.bold(this.useEmoji ? '📘 What:' : '[What]') + '\n';
    content += this.wrapText(explanation.what) + '\n\n';

    // Why
    content += chalk.yellow.bold(this.useEmoji ? '❓ Why:' : '[Why]') + '\n';
    content += this.wrapText(explanation.why) + '\n\n';

    // Fix
    content += chalk.green.bold(this.useEmoji ? '✅ Fix:' : '[Fix]') + '\n';
    content += this.wrapText(explanation.fix) + '\n';

    // Example
    if (explanation.example) {
      content += '\n' + chalk.magenta.bold(this.useEmoji ? '💡 Example:' : '[Example]') + '\n';
      content += chalk.gray(this.formatCode(explanation.example));
    }

    // Offline notice
    content += '\n\n' + chalk.gray.italic('(Offline mode - start Ollama for AI explanations)');

    const box = boxen(content.trim(), {
      title: header,
      titleAlignment: 'left',
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: this.boxStyle,
      borderColor: 'yellow',
    });

    console.log(box);
  }

  /**
   * Print generic help when no pattern matches
   */
  printGenericHelp(analysis) {
    const header = this.useEmoji ? '🔍 Error Detected:' : '[Error]';
    
    let content = '';
    
    if (analysis.language && analysis.language !== 'unknown') {
      content += chalk.gray(`Language: ${this.formatLanguage(analysis.language)}`) + '\n';
    }
    
    if (analysis.errorType) {
      content += chalk.gray(`Type: ${analysis.errorType}`) + '\n';
    }
    
    if (analysis.file) {
      content += chalk.gray(`File: ${analysis.file}`) + '\n';
    }
    
    if (analysis.line) {
      content += chalk.gray(`Line: ${analysis.line}`) + '\n';
    }

    content += '\n';
    content += chalk.cyan('Start Ollama for detailed AI explanations:') + '\n';
    content += chalk.white('  1. Install Ollama: https://ollama.ai') + '\n';
    content += chalk.white('  2. Run: ollama serve') + '\n';
    content += chalk.white('  3. Try your command again') + '\n';

    const box = boxen(content.trim(), {
      title: header,
      titleAlignment: 'left',
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: this.boxStyle,
      borderColor: 'gray',
    });

    console.log(box);
  }

  /**
   * Format language name nicely
   */
  formatLanguage(lang) {
    const names = {
      javascript: 'JavaScript/Node.js',
      java: 'Java',
      csharp: 'C#/.NET',
      python: 'Python',
      unknown: 'Unknown',
    };
    return names[lang] || lang;
  }

  /**
   * Wrap text to terminal width
   */
  wrapText(text, maxWidth = 70) {
    if (!text) return '';

    // Wrap each line on its own so line breaks the AI wrote (numbered steps,
    // bullet points) are kept instead of being counted as part of a word.
    return text
      .split('\n')
      .map(line => this.wrapLine(line.trimEnd(), maxWidth))
      .join('\n');
  }

  /**
   * Wrap a single line (no newlines) at maxWidth
   */
  wrapLine(line, maxWidth) {
    const words = line.split(' ').filter(word => word !== '');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines.join('\n');
  }

  /**
   * Format code block with indentation
   */
  formatCode(code) {
    if (!code) return '';
    
    // Add consistent indentation
    return code
      .split('\n')
      .map(line => '  ' + line)
      .join('\n');
  }

  /**
   * Print a simple status message
   */
  printStatus(message, type = 'info') {
    const icons = {
      info: this.useEmoji ? 'ℹ️ ' : '[i] ',
      success: this.useEmoji ? '✅ ' : '[+] ',
      warning: this.useEmoji ? '⚠️ ' : '[!] ',
      error: this.useEmoji ? '❌ ' : '[x] ',
    };

    const colors = {
      info: chalk.cyan,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
    };

    console.log(colors[type](icons[type] + message));
  }
}
