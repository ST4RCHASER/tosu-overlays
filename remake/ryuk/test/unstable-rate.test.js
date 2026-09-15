import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from '../../../test/helpers/fake-dom.js';
import { v2 } from '../../../test/helpers/fixtures.js';

const el = installFakeDom(['ur']);
const { update } = await import('../UnstableRate/index.js');

test('hidden outside play, shown in play', () => {
  update(v2({ state: 0 }));
  assert.equal(el('ur').style.opacity, 0);
  update(v2({ state: 2 }));
  assert.equal(el('ur').style.opacity, 1);
});

test('feeds play.unstableRate to CountUp', () => {
  update(v2({ state: 2, play: { unstableRate: 87.65 } }));
  assert.equal(el('ur').lastCountUp, 87.65);
});
