import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { isCorrespondenceDraftEdit } from '../app/utils/correspondence-draft-access.ts';

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
    '~/utils/correspondence-draft-access': { isCorrespondenceDraftEdit },
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
