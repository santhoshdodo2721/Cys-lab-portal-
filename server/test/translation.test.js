import test from 'node:test';
import assert from 'node:assert/strict';
import { registerTranslation } from '../src/translation.js';
import { languages } from '../src/languages.js';

function endpoint(options) {
  let handler;
  registerTranslation({ post(path, ...handlers) { assert.equal(path, '/api/translate'); handler = handlers.at(-1); } }, options);
  return async body => {
    const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ body }, response);
    return response;
  };
}

test('missing configuration keeps English available and explains translation failure', async () => {
  const call = endpoint({ apiKey: '' });
  assert.equal((await call({ target: 'ta', texts: ['Projects'] })).statusCode, 503);
  assert.deepEqual((await call({ target: 'en', texts: ['Projects'] })).data.translations, ['Projects']);
});

test('batches unique texts, preserves result order, and caches by language', async () => {
  const requests = [];
  const call = endpoint({ apiKey: 'test-key', fetchTranslation: async (url, options) => {
    const body = JSON.parse(options.body); requests.push(body);
    assert.equal(options.headers['X-Goog-Api-Key'], 'test-key');
    assert.equal(body.format, 'text');
    return { ok: true, json: async () => ({ data: { translations: body.q.map(text => ({ translatedText: `${body.target}:${text}` })) } }) };
  } });
  assert.deepEqual((await call({ target: 'ko', texts: ['Projects', 'Description', 'Projects'] })).data.translations, ['ko:Projects', 'ko:Description', 'ko:Projects']);
  await call({ target: 'ko', texts: ['Projects'] });
  assert.equal(requests.length, 1);
  await call({ target: 'ta', texts: ['Projects'] });
  assert.equal(requests.length, 2);
});

test('rejects unsupported languages and oversized or malformed requests', async () => {
  const call = endpoint({ apiKey: 'test-key' });
  for (const body of [{ target: 'invalid', texts: ['Text'] }, { target: 'ko', texts: [] }, { target: 'ko', texts: [null] }, { target: 'ko', texts: ['a'.repeat(10001)] }, { target: 'ko', texts: Array(101).fill('Text') }]) assert.equal((await call(body)).statusCode, 400);
});

test('provider errors and invalid results produce safe actionable errors', async () => {
  for (const result of [{ ok: false }, { ok: true, json: async () => ({ data: { translations: [] } }) }]) {
    const call = endpoint({ apiKey: 'test-key', fetchTranslation: async () => result });
    const response = await call({ target: 'ko', texts: ['Text'] });
    assert.equal(response.statusCode, 502);
    assert.match(response.data.error, /temporarily unavailable/);
  }
});

test('client and server advertise the same language options', async () => {
  const { languages: clientLanguages } = await import('../../client/src/languages.js');
  assert.deepEqual(clientLanguages, languages);
  for (const code of ['ta', 'te', 'hi', 'ko', 'mni-Mtei']) assert.ok(languages.some(([value]) => value === code));
});
