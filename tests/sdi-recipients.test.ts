import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitSdiRecipientItems } from '../app/utils/sdi-recipients.ts';

test('SDI CC-only directors cannot be selected as primary recipients', () => {
  const gm = { value: 'gm-branch', raw: { group: 'REKAN' } };
  const director = { value: 'director', raw: { group: 'TEMBUSAN' } };
  const result = splitSdiRecipientItems([gm, director]);
  assert.deepEqual(result.tertuju, [gm]);
  assert.deepEqual(result.tembusan, [gm, director]);
});

test('SDI keeps routing metadata and mandatory CC on individual recipients', () => {
  const peer = { group: 'REKAN', value: 'evp', raw: { position_status: 'PT' } };
  const mandatoryCc = { group: 'TEMBUSAN', value: 'gm', raw: { routing_mandatory_cc: true } };
  const result = splitSdiRecipientItems([peer, mandatoryCc]);
  assert.equal(result.tertuju[0], peer);
  assert.equal(result.tembusan[1], mandatoryCc);
  assert.equal(result.tembusan[1]?.raw.routing_mandatory_cc, true);
});

test('SDI does not expose ND-only groups or unclassified recipients', () => {
  const result = splitSdiRecipientItems([
    { group: 'ATASAN' }, { group: 'BAWAHAN' }, {},
  ]);
  assert.deepEqual(result, { tertuju: [], tembusan: [] });
  assert.deepEqual(splitSdiRecipientItems([]), result);
});
