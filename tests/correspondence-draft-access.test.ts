import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { isCorrespondenceDraftEdit, isNaskahLainnyaDraftEdit } from '../app/utils/correspondence-draft-access.ts';

const editors = [
  'nota-dinas', 'surat-dinas-internal', 'surat-dinas-eksternal', 'disposisi', 'kajian',
  'konsep/nota-dinas', 'konsep/surat-dinas-internal', 'konsep/surat-dinas-eksternal',
];

function loadModule(file: string, globals: Record<string, unknown>, imports: Record<string, unknown>) {
  const exports: Record<string, any> = {};
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(compiled, {
    exports,
    require: (name: string) => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
    ...globals,
  });
  return exports;
}

test('draft editors do not redirect to dashboard when creation capability is denied', async () => {
  let canUpdate = true;
  let capabilityCalls = 0;
  const auth = {
    user: { value: { bodTag: 'BOD-2' } },
    hasPermission: (resource: string, action: string) =>
      canUpdate && resource === 'utama.draft' && action === 'update',
  };
  const { default: middleware } = loadModule('../app/middleware/tulis-access.ts', {
    process: { server: false },
    defineNuxtRouteMiddleware: (handler: unknown) => handler,
    useAuth: () => auth,
    navigateTo: (url: string) => url,
    useCorrespondenceRoutingAccess: () => ({
      fetchCapabilities: async () => { capabilityCalls++; },
      canCreateCorrespondence: () => false,
    }),
  }, { '~/utils/correspondence-draft-access': { isCorrespondenceDraftEdit } });

  for (const editor of editors) {
    const path = `/korespondensi/tulis/${editor}`;
    const route = { path, fullPath: `${path}?draft_id=document-id`, query: { draft_id: 'document-id' } };
    canUpdate = true;
    assert.equal(await middleware(route), undefined, editor);
    canUpdate = false;
    assert.match(await middleware(route), /^\/access-denied\?from=/, editor);
  }
  assert.equal(capabilityCalls, 0);
  assert.equal(await middleware({ path: '/korespondensi/tulis/nota-dinas', query: {} }), '/beranda');
  assert.equal(capabilityCalls, 1);
});

test('page access and draft actions use draft-update permission for every supported editor', () => {
  let canUpdate = true;
  let route = { path: '', query: {} as Record<string, unknown> };
  const auth = {
    user: { value: {} },
    hasPermission: (resource: string, action: string) =>
      canUpdate && resource === 'utama.draft' && action === 'update',
  };
  const { useFeatureAccess } = loadModule('../app/composables/useFeatureAccess.ts', {
    useRoute: () => route,
  }, {
    './useAuth': { useAuth: () => auth },
    '~/utils/correspondence-draft-access': { isCorrespondenceDraftEdit, isNaskahLainnyaDraftEdit },
  });
  const access = useFeatureAccess();
  for (const editor of editors) {
    route = { path: `/korespondensi/tulis/${editor}`, query: { draft_id: 'document-id' } };
    canUpdate = true;
    assert.equal(access.canAccessPage(), true, editor);
    assert.equal(access.canEditCorrespondenceDraft(), true, editor);
    canUpdate = false;
    assert.equal(access.canAccessPage(), false, editor);
    assert.equal(access.canEditCorrespondenceDraft(), false, editor);
  }
  route = { path: '/korespondensi/tulis/nota-dinas', query: {} };
  canUpdate = true;
  assert.equal(access.canAccessPage(), false);
  assert.equal(access.canEditCorrespondenceDraft(), false);
});

test('Naskah Lainnya draft edits require Update and retain position restrictions', () => {
  let permissions = new Set(['utama.draft:update']);
  const route = { path: '/naskah-lainnya/tulis', query: { draft_id: 'draft-id' } as Record<string, unknown> };
  const auth = {
    user: { value: { position_status: '' } },
    hasPermission: (resource: string, action: string) => permissions.has(`${resource}:${action}`),
  };
  const { useFeatureAccess } = loadModule('../app/composables/useFeatureAccess.ts', {
    useRoute: () => route,
  }, {
    './useAuth': { useAuth: () => auth },
    '~/utils/correspondence-draft-access': { isCorrespondenceDraftEdit, isNaskahLainnyaDraftEdit },
  });
  const access = useFeatureAccess();
  assert.equal(access.canAccessPage(), true);
  assert.equal(access.canEditNaskahLainnyaDraft(), true);
  permissions.clear();
  assert.equal(access.canAccessPage(), false);
  assert.equal(access.canEditNaskahLainnyaDraft(), false);
  permissions.add('utama.draft:update');
  for (const status of ['SE', 'VI', 'EXT']) {
    auth.user.value.position_status = status;
    assert.equal(access.canAccessPage(), false, status);
    assert.equal(access.canEditNaskahLainnyaDraft(), false, status);
  }
  auth.user.value.position_status = '';
  route.query = {};
  assert.equal(access.canAccessPage(), false);
  assert.equal(access.canEditNaskahLainnyaDraft(), false);
  route.query = { draft_id: 'id', mode: 'data-sistem' };
  assert.equal(access.canAccessPage(), false);
  assert.equal(access.canEditNaskahLainnyaDraft(), false);
  permissions.add('utama.tulis.naskah-lainnya.halaman-tulis-naskah:read');
  assert.equal(access.canAccessPage(), true);
});

test('Naskah Lainnya helper recognizes drafts, not physical metadata or empty IDs', () => {
  assert.equal(isNaskahLainnyaDraftEdit('/naskah-lainnya/tulis', { draft_id: 'id' }), true);
  assert.equal(isNaskahLainnyaDraftEdit('/naskah-lainnya/tulis/', { draft_id: ['id'] }), true);
  assert.equal(isNaskahLainnyaDraftEdit('/naskah-lainnya/tulis', { draft_id: 'id', mode: ['data-sistem'] }), false);
  for (const draft_id of [undefined, '', '  ', [], null]) {
    assert.equal(isNaskahLainnyaDraftEdit('/naskah-lainnya/tulis', { draft_id }), false);
  }
});

test('Kajian detail is reloaded after updates instead of using an older cached response', async () => {
  let detail = { perihal: 'Draft awal' };
  const calls: string[] = [];
  const { useKajian } = loadModule('../app/composables/useKajian.ts', {}, {
    './useApi': { useApi: () => ({
      api: {},
      get: () => { throw new Error('Cached request must not be used for draft detail'); },
      getFresh: async (url: string) => { calls.push(url); return detail; },
    }) },
  });
  const kajian = useKajian();
  assert.equal((await kajian.getKajianDetail('id')).perihal, 'Draft awal');
  detail = { perihal: 'Draft diperbarui' };
  assert.equal((await kajian.getKajianDetail('id')).perihal, 'Draft diperbarui');
  assert.deepEqual(calls, ['/KA/id', '/KA/id']);
});

test('all supported existing drafts use the draft-edit access context', () => {
  for (const editor of editors) {
    const path = `/korespondensi/tulis/${editor}`;
    assert.equal(isCorrespondenceDraftEdit(path, { draft_id: 'document-id' }), true, editor);
    assert.equal(isCorrespondenceDraftEdit(`${path}/`, { draft_id: ['document-id'] }), true, editor);
  }
});

test('new-document pages keep creation access when draft_id is absent or empty', () => {
  for (const editor of editors) {
    for (const draft_id of [undefined, null, '', '  ', [], 123, {}]) {
      assert.equal(isCorrespondenceDraftEdit(`/korespondensi/tulis/${editor}`, { draft_id }), false);
    }
  }
});

test('draft_id does not exempt continuation, finalization, or unrelated pages', () => {
  for (const path of [
    '/korespondensi/tulis/lanjut/nota-dinas',
    '/korespondensi/tulis/finalisasi/nota-dinas',
    '/korespondensi/tulis/naskah-umum',
    '/korespondensi/tulis/konsep/disposisi',
    '/korespondensi/tulis/konsep/nota-dinas/extra',
    '/naskah-lainnya/draf',
  ]) {
    assert.equal(isCorrespondenceDraftEdit(path, { draft_id: 'document-id' }), false, path);
  }
});
