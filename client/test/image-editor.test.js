import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultEdits, renderImage } from '../src/image-editor.js';

function canvases() {
  const created = [];
  globalThis.document = { createElement(type) {
    assert.equal(type, 'canvas');
    const context = { calls: [], translate(...args) { this.calls.push(['translate', ...args]); }, rotate(...args) { this.calls.push(['rotate', ...args]); }, scale(...args) { this.calls.push(['scale', ...args]); }, drawImage(...args) { this.calls.push(['drawImage', ...args]); } };
    const canvas = { width: 0, height: 0, context, getContext: () => context };
    created.push(canvas); return canvas;
  } };
  return created;
}

test('large photographs resize without changing their aspect ratio', () => {
  canvases();
  const result = renderImage({ naturalWidth: 4000, naturalHeight: 3000 }, defaultEdits);
  assert.equal(result.width, 2400); assert.equal(result.height, 1800);
});

test('small certificate images are not enlarged', () => {
  canvases();
  const result = renderImage({ naturalWidth: 800, naturalHeight: 600 }, defaultEdits);
  assert.equal(result.width, 800); assert.equal(result.height, 600);
});

test('rotation swaps portrait dimensions and square crop respects vertical position', () => {
  const created = canvases();
  const result = renderImage({ naturalWidth: 4000, naturalHeight: 3000 }, { ...defaultEdits, rotation: 90, crop: 'square', vertical: 100, flip: true, brightness: 125 });
  assert.equal(created[0].width, 1800); assert.equal(created[0].height, 2400);
  assert.equal(result.width, 1800); assert.equal(result.height, 1800);
  assert.deepEqual(result.context.calls[0].slice(2, 6), [0, 600, 1800, 1800]);
  assert.equal(created[0].context.filter, 'brightness(125%)');
  assert.deepEqual(created[0].context.calls.find(call => call[0] === 'scale'), ['scale', -1, 1]);
});
