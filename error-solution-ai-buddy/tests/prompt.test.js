import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseResponse, stripCodeFences } from '../backend/src/ai/prompt.js';

describe('stripCodeFences()', () => {
  it('removes a fence with a language tag', () => {
    assert.strictEqual(stripCodeFences('```javascript\nconst a = 1;\n```'), 'const a = 1;');
  });

  it('removes a fence without a language tag', () => {
    assert.strictEqual(stripCodeFences('```\nx();\n```'), 'x();');
  });

  it('leaves code without fences alone', () => {
    assert.strictEqual(stripCodeFences('if (data) {\n  data.map(f);\n}'), 'if (data) {\n  data.map(f);\n}');
  });

  it('handles languages like c# and c++', () => {
    assert.strictEqual(stripCodeFences('```c#\nvar x = 1;\n```'), 'var x = 1;');
    assert.strictEqual(stripCodeFences('```c++\nint x;\n```'), 'int x;');
  });
});

describe('parseResponse() examples', () => {
  it('strips Markdown fences from the EXAMPLE section', () => {
    const parsed = parseResponse('WHAT: A TypeError.\nWHY: data is undefined.\nFIX: Check it.\nEXAMPLE:\n```javascript\nconsole.log(data?.map(x => x));\n```');
    assert.strictEqual(parsed.example, 'console.log(data?.map(x => x));');
  });

  it('keeps comments and blank lines inside the example', () => {
    const parsed = parseResponse('WHAT: x\nEXAMPLE:\n```js\n// safe\nconst a = 1;\n\nconst b = 2;\n```');
    assert.strictEqual(parsed.example, '// safe\nconst a = 1;\n\nconst b = 2;');
  });
});
