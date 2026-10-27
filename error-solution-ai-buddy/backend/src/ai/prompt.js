/**
 * Shared prompt + response parsing for every AI provider.
 *
 * WHY a separate module:
 * Ollama and Gemini must give answers in the same WHAT / WHY / FIX / EXAMPLE
 * shape so the formatter can print them the same way. Keeping the prompt and
 * the parser in one place means a prompt improvement helps every provider.
 */

/**
 * System prompt for error explanation
 *
 * WHY this structure:
 * - Forces consistent output format
 * - Beginner-friendly language
 * - Prevents hallucinations with explicit rules
 */
export const SYSTEM_PROMPT = `You are an expert programming assistant that explains errors to developers.

RULES (VERY IMPORTANT):
1. Always respond in this EXACT format:
   WHAT: [Name the specific error code/exception (e.g. "NullPointerException", "CS1061") and what it means]
   WHY: [Explain specifically why this code causes that error]
   FIX: [Clear steps to fix the error]
   EXAMPLE: [Short code example if helpful]

2. Use simple language a junior developer can understand
3. Be concise - no long paragraphs
4. Do NOT assume frameworks (like Spring, React) unless the error explicitly mentions them
5. Focus on the most likely cause first (typos, missing variables, syntax)
6. IF suggesting a fix involves installing a new package, ONLY do so if the error is explicitly "Module/Package not found".
7. If the error mentions "not a statement" and looks like "variable;", explain that standalone variables are not valid statements.
8. Never make up information - if unsure, say so
9. Always explicitly mention the error name or code in the "WHAT" section.

LANGUAGE-SPECIFIC TIPS:
- JavaScript: Common issues are undefined/null, async/await, imports
- Java:
  - "not a statement" often means a standalone variable (e.g. 'x;') which is invalid in Java. It must be an assignment ('x=1;') or method call.
  - Common issues: NullPointer, missing variables, types
  - Avoid suggesting @Autowired unless it's a Spring error
- C#: Common issues are null reference, missing using, async

Remember: Developers are frustrated when they see errors. Be helpful and direct.`;

/**
 * Build the prompt for the AI
 */
export function buildPrompt(errorText, language) {
  const langName = {
    javascript: 'JavaScript/Node.js',
    java: 'Java',
    csharp: 'C#/.NET',
    unknown: 'programming'
  }[language] || language;

  return `Explain this ${langName} error to a developer:

\`\`\`
${errorText}
\`\`\`

Remember to use the format: WHAT, WHY, FIX, EXAMPLE`;
}

/**
 * Parse the AI response into structured format
 */
export function parseResponse(response) {
  const result = {
    what: null,
    why: null,
    fix: null,
    example: null,
    raw: response
  };

  // Try to extract structured parts
  const whatMatch = response.match(/WHAT:\s*(.+?)(?=WHY:|FIX:|EXAMPLE:|$)/is);
  const whyMatch = response.match(/WHY:\s*(.+?)(?=WHAT:|FIX:|EXAMPLE:|$)/is);
  const fixMatch = response.match(/FIX:\s*(.+?)(?=WHAT:|WHY:|EXAMPLE:|$)/is);
  const exampleMatch = response.match(/EXAMPLE:\s*(.+?)(?=WHAT:|WHY:|FIX:|$)/is);

  if (whatMatch) result.what = whatMatch[1].trim();
  if (whyMatch) result.why = whyMatch[1].trim();
  if (fixMatch) result.fix = fixMatch[1].trim();
  if (exampleMatch) result.example = exampleMatch[1].trim();

  // If structured parsing failed, try to make sense of the response
  if (!result.what && !result.why && !result.fix) {
    // Split by sentences and assign
    const sentences = response.split(/[.!]\s+/).filter(s => s.trim());
    if (sentences.length >= 1) result.what = sentences[0].trim() + '.';
    if (sentences.length >= 2) result.why = sentences[1].trim() + '.';
    if (sentences.length >= 3) result.fix = sentences.slice(2).join('. ').trim();
  }

  // Extract code blocks for example
  if (!result.example) {
    const codeMatch = response.match(/```[\w]*\n?([\s\S]+?)```/);
    if (codeMatch) {
      result.example = codeMatch[1].trim();
    }
  }

  // Models often wrap the example in Markdown fences (```javascript ... ```).
  // Terminals don't render Markdown, so print the code without them.
  if (result.example) {
    result.example = stripCodeFences(result.example);
  }

  return result;
}

/**
 * Remove a surrounding ```lang ... ``` fence from a code example
 */
export function stripCodeFences(code) {
  return code
    .replace(/^\s*```[\w+#.-]*[ \t]*\n?/, '')
    .replace(/\n?[ \t]*```\s*$/, '')
    .trim();
}
