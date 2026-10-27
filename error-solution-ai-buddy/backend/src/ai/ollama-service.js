/**
 * Ollama AI Service - Handles communication with local Ollama server
 * 
 * WHY OLLAMA:
 * 1. 100% free - no API keys needed
 * 2. Runs locally - your code never leaves your machine
 * 3. Works offline - no internet required after model download
 * 4. Fast - local inference with no network latency
 * 
 * SETUP:
 * 1. Install Ollama: https://ollama.ai
 * 2. Run: ollama pull qwen2.5:0.5b
 * 3. Run: ollama serve
 */

import { SYSTEM_PROMPT, buildPrompt, parseResponse } from './prompt.js';

export class AIService {
  constructor(baseUrl = 'http://localhost:11434', model = 'llama3.2') {
    this.baseUrl = baseUrl;
    this.model = model;
    this.timeout = 30000; // 30 second timeout
    this.name = 'Ollama';
  }

  /**
   * Check if Ollama is running and accessible
   */
  async checkConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal, // 3 second timeout for health check
      }).finally(() => clearTimeout(timeoutId));
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // Check if the model we want is available
      const models = data.models || [];
      const modelBaseName = this.model.split(':')[0];
      const hasModel = models.some(m => m.name.startsWith(modelBaseName));
      
      if (!hasModel && models.length > 0) {
        // Use first available model as fallback
        this.model = models[0].name;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get explanation for an error from Ollama
   */
  async explainError(errorText, language = 'unknown') {
    const prompt = this.buildPrompt(errorText, language);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          system: SYSTEM_PROMPT,
          stream: false,
          options: {
            temperature: 0.1,  // Very low to prevent hallucinations
            top_p: 0.9,
            num_predict: 500, // Limit response length
          }
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        let errorMsg = '';
        try {
          const errorJson = await response.json();
          errorMsg = errorJson.error || JSON.stringify(errorJson);
        } catch {
          errorMsg = await response.text();
        }

        // Check for memory error
        if (errorMsg.includes('memory')) {
          throw new Error('Not enough RAM. Try: errbuddy --model qwen2.5:0.5b');
        }
        throw new Error(`Ollama returned ${response.status}: ${errorMsg}`);
      }

      const data = await response.json();
      
      // Check for error in response
      if (data.error) {
        throw new Error(data.error);
      }
      
      return this.parseResponse(data.response);
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new Error('AI explanation timed out. Try a smaller model.');
      }
      throw error;
    }
  }

  /**
   * Build the prompt for the AI (shared with every provider)
   */
  buildPrompt(errorText, language) {
    return buildPrompt(errorText, language);
  }

  /**
   * Parse the AI response into structured format (shared with every provider)
   */
  parseResponse(response) {
    return parseResponse(response);
  }

  /**
   * Stream explanation (for future use - better UX for long responses)
   * Currently not used but ready for implementation
   */
  async *streamExplanation(errorText, language = 'unknown') {
    const prompt = this.buildPrompt(errorText, language);
    
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        system: SYSTEM_PROMPT,
        stream: true,
        options: {
          temperature: 0.3,
          num_predict: 500,
        }
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            yield data.response;
          }
        } catch {
          // Ignore JSON parse errors for incomplete chunks
        }
      }
    }
  }
}
