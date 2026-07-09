import { ref } from 'vue';
import { useApi } from './useApi';

// ponytail: OnlyOffice DocsAPI injected via script tag; no types shipped — use any.
declare global {
  interface Window { DocsAPI?: any }
}

export const useOnlyOffice = () => {
  const editor = ref<any>(null);
  const isReady = ref(false);
  const error = ref<string | null>(null);

  const loadApiScript = (ooUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.DocsAPI) return resolve();
      const s = document.createElement('script');
      s.src = `${ooUrl}/web-apps/apps/api/documents/api.js`;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Gagal load OnlyOffice api.js'));
      document.head.appendChild(s);
    });
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const waitForSaved = async (
    tempId: string,
    onSaved: () => void,
    onTimeout: () => void,
  ): Promise<void> => {
    const { getFresh } = useApi();
    const maxTries = 12;
    const intervalMs = 1500;

    for (let i = 0; i < maxTries; i++) {
      await delay(intervalMs);
      try {
        const res = await getFresh(`/NU/temp-status/${tempId}`);
        const status = res?.data?.status ?? res?.status ?? null;
        if (status === 'saved') {
          onSaved();
          return;
        }
      } catch (e) {
        // keep polling; onTimeout handles final failure
      }
    }
    onTimeout();
  };

  const initEditor = async (
    placeholderEl: HTMLElement,
    tempId: string,
    s3Key: string,
    title: string,
    onSaved: () => void,
    onSaveTimeout?: () => void,
  ) => {
    destroyEditor();
    error.value = null;
    isReady.value = false;

    const config = useRuntimeConfig();
    const ooUrl = config.public.onlyofficeUrl as string;
    await loadApiScript(ooUrl);
    if (!placeholderEl.id) {
      placeholderEl.id = `oo-editor-${tempId}`;
    }
    placeholderEl.innerHTML = '';
    const editorHeight = Math.max(760, Math.floor(placeholderEl.getBoundingClientRect().height || window.innerHeight * 0.78));

    const { getFresh } = useApi();
    const res = await getFresh(`/onlyoffice/editor-config/${tempId}?s3Key=${encodeURIComponent(s3Key)}&title=${encodeURIComponent(title)}`);
    const editorConfig = res?.data?.config ?? res?.config;
    if (!editorConfig) {
      throw new Error('Konfigurasi editor OnlyOffice tidak ditemukan dari server');
    }

    const configWithEvents = {
      ...editorConfig,
      width: '100%',
      height: `${editorHeight}px`,
      events: {
        onDocumentReady: () => { isReady.value = true; },
        onError: (e: any) => { error.value = e?.data?.errorDescription || 'Editor error'; },
        onSave: () => {
          // OnlyOffice fires onSave client-side before the server-to-server
          // callback updates temp.status to 'saved'. Poll BE until confirmed.
          waitForSaved(
            tempId,
            onSaved,
            onSaveTimeout || (() => { error.value = 'Simpan belum terkonfirmasi server, coba Simpan lagi'; }),
          );
        },
      },
    };
    editor.value = new window.DocsAPI.DocEditor(placeholderEl.id, configWithEvents);
  };

  const destroyEditor = () => {
    editor.value?.destroy?.();
    editor.value = null;
    isReady.value = false;
  };

  return { editor, isReady, error, initEditor, destroyEditor };
};
