import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { ref } from 'vue';
import ts from 'typescript';
import * as persona from '../app/utils/naskah-lainnya-persona.ts';

function load(file: string, api: Record<string, unknown>) {
  const exports: Record<string, any> = {};
  const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const imports: Record<string, unknown> = {
    vue: { ref },
    './useApi': { useApi: () => api },
    '~/composables/useApi': { useApi: () => api },
    '~/composables/useAuth': { useAuth: () => ({ user: ref(null) }) },
    '~/utils/naskah-lainnya-persona': persona,
  };
  runInNewContext(compiled, {
    exports,
    require: (name: string) => {
      assert.ok(name in imports, `Unexpected dependency: ${name}`);
      return imports[name];
    },
  });
  return exports;
}

test('BOD and BOD-1 dropdowns read controller responses even when wrapped twice', async () => {
  const rows = [{ positionId: '1', nama: 'PT. Pejabat', jabatan: 'EVP Audit', bodTag: 'BOD-1' }];
  for (const response of [rows, { data: rows }, { success: true, data: { data: rows } }]) {
    const { useNaskahLainnya } = load('../app/composables/useNaskahLainnya.ts', {
      apiGet: async () => response,
    });
    const api = useNaskahLainnya();
    for (const getter of [api.fetchBodDirectors, api.fetchBodBod1]) {
      const result = await getter();
      assert.equal(result.length, 1);
      assert.equal(result[0].nama, 'Pejabat');
      assert.equal(result[0].jabatan, 'PT. EVP Audit');
      assert.equal(result[0].positionId, '1');
    }
  }
});

test('evaluation candidates preserve position identity and exclude duplicate positions', async () => {
  const row = { position: 12, persnum_person: 23, persnum_person_text: 'Pejabat', position_text: 'EVP Audit', position_status: 'PH' };
  for (const response of [[row, row], { data: [row, row] }, { data: { data: [row, row] } }, { items: [row, row] }]) {
    const { useNaskahLainnya } = load('../app/composables/useNaskahLainnya.ts', {
      apiGetFresh: async () => response,
    });
    const result = await useNaskahLainnya().fetchKandidatPersetujuan('naskah-id');
    assert.equal(result.length, 1);
    assert.equal(result[0].positionId, '12');
    assert.equal(result[0].persnum, 23);
    assert.equal(result[0].jabatan, 'PH. EVP Audit');
  }
});

test('Legal Drafting recipient getter fills the list used by certifier and forwarding dropdowns', async () => {
  const { useNaskahLainnya } = load('../app/composables/useNaskahLainnya.ts', {
    apiGet: async () => ({ success: true, data: [{ positionId: 'l1', nama: 'Pejabat Legal', jabatan: 'VP Legal', isActive: true, chief: true }] }),
  });
  const api = useNaskahLainnya();
  await api.fetchLegalRecipients();
  assert.equal(api.legalRecipients.value.length, 1);
  assert.equal(api.legalRecipients.value[0].positionId, 'l1');
  assert.equal(api.legalRecipients.value[0].nama, 'Pejabat Legal');
});

test('signer getter requests all area personnel and preserves delegation metadata', async () => {
  const requests: { url: string; chief: string }[] = [];
  const { useNaskahDinas } = load('../app/composables/useNaskahDinas.ts', {
    apiGet: async (url: string, config: { params: { chief: string } }) => {
      requests.push({ url, chief: config.params.chief });
      return { success: true, data: [{ positionId: 12, persnum: 23, nama: 'Pejabat', jabatan: 'EVP Audit', positionStatus: 'PT' }] };
    },
  });
  const api = useNaskahDinas();
  await api.fetchVerifikator({ chiefOnly: false });
  assert.deepEqual(requests, [{ url: '/digsig/document/verifikator', chief: '0' }]);
  assert.equal(api.verifikatorList.value[0].positionStatus, 'PT');
  assert.equal(api.verifikatorList.value[0].positionId, 12);
});
