import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { GeminiService, GEMINI_DEFAULT_MODEL } from '../backend/src/ai/gemini-service.js';

const okResponse = (body) => ({ ok: true, status: 200, json: async () => body });
const errorResponse = (status, message) => ({
  ok: false,
  status,
  json: async () => ({ error: { code: status, message } }),
});
const answer = (text) => ({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] });

describe('GeminiService', () => {
  const originalFetch = global.fetch;
  let calls;

  beforeEach(() => {
    calls = [];
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockFetch = (response) => {
    global.fetch = async (url, options) => {
      calls.push({ url, options });
      return typeof response === 'function' ? response(url, options) : response;
    };
  };

  describe('constructor', () => {
    it('uses the default model', () => {
      const service = new GeminiService({ apiKey: 'k' });
      assert.strictEqual(service.model, GEMINI_DEFAULT_MODEL);
      assert.strictEqual(service.name, 'Gemini');
    });

    it('accepts a custom model', () => {
      const service = new GeminiService({ apiKey: 'k', model: 'gemini-custom' });
      assert.strictEqual(service.model, 'gemini-custom');
    });
  });

  describe('checkConnection()', () => {
    it('returns true when an API key is set, without a network call', async () => {
      mockFetch(okResponse({}));
      const service = new GeminiService({ apiKey: 'abc' });
      assert.strictEqual(await service.checkConnection(), true);
      assert.strictEqual(calls.length, 0);
    });

    it('returns false when the API key is missing or blank', async () => {
      assert.strictEqual(await new GeminiService({ apiKey: '' }).checkConnection(), false);
      assert.strictEqual(await new GeminiService({ apiKey: '   ' }).checkConnection(), false);
    });
  });

  describe('explainError()', () => {
    it('sends the key in a header, never in the URL', async () => {
      mockFetch(okResponse(answer('WHAT: x WHY: y FIX: z')));
      const service = new GeminiService({ apiKey: 'secret-key' });
      await service.explainError('TypeError: boom', 'javascript');

      const { url, options } = calls[0];
      assert.ok(!url.includes('secret-key'), 'key must not appear in the URL');
      assert.strictEqual(options.headers['x-goog-api-key'], 'secret-key');
      assert.ok(url.endsWith(`/models/${GEMINI_DEFAULT_MODEL}:generateContent`));
    });

    it('sends the shared system prompt and the error text', async () => {
      mockFetch(okResponse(answer('WHAT: x')));
      const service = new GeminiService({ apiKey: 'k' });
      await service.explainError('TypeError: boom', 'javascript');

      const body = JSON.parse(calls[0].options.body);
      assert.ok(body.systemInstruction.parts[0].text.includes('WHAT:'));
      assert.ok(body.contents[0].parts[0].text.includes('TypeError: boom'));
      assert.ok(body.contents[0].parts[0].text.includes('JavaScript/Node.js'));
    });

    it('parses a structured answer', async () => {
      mockFetch(okResponse(answer('WHAT: A TypeError.\nWHY: data is undefined.\nFIX: Check it first.\nEXAMPLE: if (data) {}')));
      const result = await new GeminiService({ apiKey: 'k' }).explainError('TypeError', 'javascript');

      assert.strictEqual(result.what, 'A TypeError.');
      assert.strictEqual(result.why, 'data is undefined.');
      assert.strictEqual(result.fix, 'Check it first.');
      assert.strictEqual(result.example, 'if (data) {}');
    });

    it('joins multiple parts and skips thought parts', async () => {
      mockFetch(okResponse({
        candidates: [{
          content: {
            parts: [
              { text: 'internal reasoning', thought: true },
              { text: 'WHAT: First part. ' },
              { text: 'WHY: Second part.' },
            ],
          },
        }],
      }));
      const result = await new GeminiService({ apiKey: 'k' }).explainError('err');

      assert.strictEqual(result.what, 'First part.');
      assert.strictEqual(result.why, 'Second part.');
      assert.ok(!result.raw.includes('internal reasoning'));
    });

    it('throws a helpful error when the key is missing', async () => {
      await assert.rejects(
        new GeminiService({ apiKey: '' }).explainError('err'),
        /GEMINI_API_KEY is not set/
      );
    });

    it('explains an invalid API key', async () => {
      mockFetch(errorResponse(400, 'API key not valid. Please pass a valid API key.'));
      await assert.rejects(
        new GeminiService({ apiKey: 'bad' }).explainError('err'),
        /rejected the API key/
      );
    });

    it('explains a rate limit', async () => {
      mockFetch(errorResponse(429, 'Resource has been exhausted'));
      await assert.rejects(
        new GeminiService({ apiKey: 'k' }).explainError('err'),
        /rate limit/
      );
    });

    it('explains an unknown model', async () => {
      mockFetch(errorResponse(404, 'models/nope is not found'));
      await assert.rejects(
        new GeminiService({ apiKey: 'k', model: 'nope' }).explainError('err'),
        /model "nope" was not found/
      );
    });

    it('reports a blocked or empty response', async () => {
      mockFetch(okResponse({ promptFeedback: { blockReason: 'SAFETY' } }));
      await assert.rejects(
        new GeminiService({ apiKey: 'k' }).explainError('err'),
        /no explanation \(SAFETY\)/
      );
    });

    it('times out when Gemini does not respond', async () => {
      global.fetch = (url, options) => new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
      const service = new GeminiService({ apiKey: 'k' });
      service.timeout = 50;
      await assert.rejects(service.explainError('err'), /took too long/);
    });

    it('reports network failures', async () => {
      global.fetch = async () => { throw new Error('getaddrinfo ENOTFOUND'); };
      await assert.rejects(
        new GeminiService({ apiKey: 'k' }).explainError('err'),
        /Could not reach Gemini/
      );
    });
  });
});
