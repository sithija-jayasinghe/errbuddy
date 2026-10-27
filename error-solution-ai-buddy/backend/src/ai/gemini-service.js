/**
 * Gemini AI Service - optional cloud provider (bring your own API key)
 *
 * WHY offer a cloud provider at all:
 * Running a local model needs disk space and RAM that many laptops don't have.
 * Without it, those users only get pattern matching. Gemini has a free API key
 * anyone can create in a minute, so it is the easiest way to get real AI
 * explanations without installing anything.
 *
 * PRIVACY:
 * This is only used when the user asks for it (--provider gemini or
 * ERRBUDDY_PROVIDER=gemini). The CLI sanitizes the error (file paths and
 * secrets removed) before it reaches this service, but the error text IS sent
 * to Google. Ollama stays the default because it never leaves the machine.
 *
 * SETUP:
 * 1. Create a key: https://aistudio.google.com/apikey
 * 2. export GEMINI_API_KEY="your-key"
 * 3. errbuddy --provider gemini node app.js
 */

import { SYSTEM_PROMPT, buildPrompt, parseResponse } from './prompt.js';

export const GEMINI_DEFAULT_MODEL = 'gemini-3.5-flash-lite';
export const GEMINI_KEY_URL = 'https://aistudio.google.com/apikey';

export class GeminiService {
  constructor({
    apiKey = process.env.GEMINI_API_KEY,
    model = GEMINI_DEFAULT_MODEL,
    baseUrl = 'https://generativelanguage.googleapis.com/v1beta',
  } = {}) {
    this.apiKey = apiKey ? apiKey.trim() : '';
    this.model = model;
    this.baseUrl = baseUrl;
    this.timeout = 30000; // 30 second timeout
    this.name = 'Gemini';
  }

  /**
   * Gemini is "available" when an API key is configured.
   *
   * WHY no network call here:
   * Checking the key would cost a request (and free-tier quota) on every run.
   * A bad key is reported clearly by explainError instead, only when an error
   * actually needs explaining.
   */
  async checkConnection() {
    return Boolean(this.apiKey);
  }

  /**
   * Get explanation for an error from Gemini
   */
  async explainError(errorText, language = 'unknown') {
    if (!this.apiKey) {
      throw new Error(`GEMINI_API_KEY is not set. Create a free key at ${GEMINI_KEY_URL}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    let response;
    try {
      // The key goes in a header, not the URL, so it never ends up in logs
      response = await fetch(`${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: buildPrompt(errorText, language) }] }],
          generationConfig: {
            temperature: 0.1,  // Very low to prevent hallucinations
            maxOutputTokens: 600,
          },
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new Error('Gemini took too long to respond. Check your connection and try again.');
      }
      throw new Error(`Could not reach Gemini: ${error.message}`);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(await this.describeHttpError(response));
    }

    const data = await response.json();
    const text = this.extractText(data);

    if (!text) {
      const reason = data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason;
      throw new Error(reason ? `Gemini returned no explanation (${reason}).` : 'Gemini returned an empty response.');
    }

    return parseResponse(text);
  }

  /**
   * Pull the answer text out of a generateContent response.
   * Skips "thought" parts that thinking models can include.
   */
  extractText(data) {
    const parts = data?.candidates?.[0]?.content?.parts || [];
    return parts
      .filter(part => typeof part.text === 'string' && !part.thought)
      .map(part => part.text)
      .join('')
      .trim();
  }

  /**
   * Turn an HTTP error into a message that tells the user what to do.
   */
  async describeHttpError(response) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error?.message || '';
    } catch {
      // Body was not JSON - fall back to the status code only
    }

    const keyProblem = /api key|api_key|permission|unauthenticated/i.test(detail);

    if (response.status === 401 || response.status === 403 || (response.status === 400 && keyProblem)) {
      return `Gemini rejected the API key. Check GEMINI_API_KEY or create a new key at ${GEMINI_KEY_URL}`;
    }
    if (response.status === 404) {
      return `Gemini model "${this.model}" was not found. Try --model ${GEMINI_DEFAULT_MODEL}`;
    }
    if (response.status === 429) {
      return 'Gemini rate limit reached (free tier). Wait a minute and try again.';
    }
    if (response.status >= 500) {
      return `Gemini is having problems right now (HTTP ${response.status}). Try again shortly.`;
    }
    return `Gemini returned HTTP ${response.status}${detail ? `: ${detail}` : ''}`;
  }
}
