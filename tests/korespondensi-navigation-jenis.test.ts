import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getKorespondensiNavigationJenis } from '../app/utils/korespondensi-list-state.ts';

test('tab Semua navigates across document types even when detail has a jenis', () => {
  assert.equal(getKorespondensiNavigationJenis({ jenis: 'ND' }), undefined);
  assert.equal(getKorespondensiNavigationJenis({ tab: 'ALL', jenis: 'ND' }), undefined);
  assert.equal(getKorespondensiNavigationJenis({ tab: 'Semua', jenis: 'SDI' }), undefined);
});

test('a document-type tab constrains previous and next to that type', () => {
  assert.equal(getKorespondensiNavigationJenis({ tab: 'ND', jenis: 'ND' }), 'ND');
  assert.equal(getKorespondensiNavigationJenis({ tab: ['SDE'], jenis: 'SDE' }), 'SDE');
  assert.equal(getKorespondensiNavigationJenis({ tab: 'KO', jenis: 'K' }), 'K');
});
