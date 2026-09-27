// composables/useTulis.ts
//
// Shared logic untuk semua halaman Tulis Surat
// Masing-masing page hanya perlu memanggil composable ini dan menambahkan logic spesifik miliknya sendiri.

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { CalendarDate } from '@internationalized/date';
import type { Editor as TinyMCEEditor } from 'tinymce';
import type { Klasifikasi } from '~/types/klasifikasi';
import { Alert } from '@/composables/useAlert';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecipientItem {
  label: string;
  labelJob: string;
  value: string;
  organization?: string;
  group?: string;
  raw: any;
  isGroup?: boolean;
}

export interface SifatOption {
  label: string;
  value: string;
}

export interface UploadedFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useTulis() {
  const router = useRouter();
  const toast = useToast();

  // ── State umum ──────────────────────────────────────────────────────────────

  const isLoadingData = ref(false);
  const loadingMessage = ref('');
  const isOpenPreview = ref(false);

  const editDraftId = ref<string | null>(null);
  const subject = ref('');
  const editorContent = ref('');
  const tinymceEditor = ref<TinyMCEEditor | null>(null);

  const today = new Date();
  const date = ref<CalendarDate>(
    new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  );

  const klasifikasiList = ref<Klasifikasi[]>([]);
  const klasifikasiStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
  const selectedKlasifikasiId = ref<string | null>(null);
  const existingFiles = ref<UploadedFile[]>([]);

  const recipientGroups = ref<any[]>([]);
  const selectedTertuju = ref<RecipientItem[]>([]);
  const selectedTembusan = ref<RecipientItem[]>([]);
  const selectedSifat = ref<SifatOption | null>(null);

  const pdfBlob = ref<Blob | null>(null);
  const pdfUrl = ref('');

  // ── Constants ───────────────────────────────────────────────────────────────

  const maxPerihal = 200;

  const sifatOptions: SifatOption[] = [
    { label: 'Sangat Rahasia', value: 'sangat_rahasia' },
    { label: 'Rahasia', value: 'rahasia' },
    { label: 'Terbatas', value: 'terbatas' },
    { label: 'Biasa / Terbuka', value: 'biasa' }
  ];

  // TinyMCE config — page bisa override `setup` setelah memanggil composable ini
  const tinyMceInit = computed(() => ({
    base_url: '/tinymce',
    suffix: '.min',
    height: 400,
    menubar: false,
    promotion: false,
    branding: false,
    placeholder: 'Ketik konten disini...',
    plugins: 'lists advlist link image code table fullscreen',
    toolbar:
      'undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist table | code | fullscreen',
    content_style: `body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; border: none !important; }`,
    setup(editor: TinyMCEEditor) {
      tinymceEditor.value = editor;
    }
  }));

  // ── Computed ─────────────────────────────────────────────────────────────────

  const selectedKlasifikasi = computed(() =>
    klasifikasiList.value.find((b) => b.id === selectedKlasifikasiId.value)
  );

  const formattedDate = computed(() => {
    if (!date.value) return '-';
    const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
    return jsDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  });

  /** Tanggal dalam format YYYY-MM-DD untuk dikirim ke backend */
  const tglDb = computed(() =>
    date.value
      ? `${date.value.year}-${String(date.value.month).padStart(2, '0')}-${String(date.value.day).padStart(2, '0')}`
      : ''
  );

  /** Tanggal dalam format DD/MM/YYYY untuk display */
  const tglDisplay = computed(() =>
    date.value
      ? `${String(date.value.day).padStart(2, '0')}/${String(date.value.month).padStart(2, '0')}/${date.value.year}`
      : ''
  );

  /**
   * Daftar item yang di-exclude dari dropdown Tertuju
   * (semua yang sudah ada di Tembusan, termasuk anggota grupnya)
   */
  const excludeTertujuList = computed(() => {
    const excluded: any[] = [...selectedTembusan.value];
    selectedTembusan.value
      .filter((i) => i.isGroup)
      .forEach((g) => {
        const memberList: any[] = g.raw?.details || g.raw?.members || g.raw?.anggota || [];
        const members = memberList.map((d: any) => ({
          value: String(d.position ?? d.position_id ?? d.id ?? d)
        }));
        excluded.push(...members);
      });
    return excluded;
  });

  /**
   * Daftar item yang di-exclude dari dropdown Tembusan
   * (semua yang sudah ada di Tertuju, termasuk anggota grupnya)
   */
  const excludeTembusanList = computed(() => {
    const excluded: any[] = [...selectedTertuju.value];
    selectedTertuju.value
      .filter((i) => i.isGroup)
      .forEach((g) => {
        const memberList: any[] = g.raw?.details || g.raw?.members || g.raw?.anggota || [];
        const members = memberList.map((d: any) => ({
          value: String(d.position ?? d.position_id ?? d.id ?? d)
        }));
        excluded.push(...members);
      });
    return excluded;
  });

  /** ID individu yang dipilih sebagai tertuju (bukan grup) */
  const tertujuIndividu = computed(() =>
    selectedTertuju.value.filter((i) => !i.isGroup).map((i) => i.value)
  );

  /** ID individu yang dipilih sebagai tembusan (bukan grup) */
  const tembusanIndividu = computed(() =>
    selectedTembusan.value.filter((i) => !i.isGroup).map((i) => i.value)
  );

  /** ID grup yang dipilih sebagai tertuju */
  const tertujuGrup = computed(() =>
    selectedTertuju.value.filter((i) => i.isGroup).map((i) => String(i.raw.id))
  );

  /** ID grup yang dipilih sebagai tembusan */
  const tembusanGrup = computed(() =>
    selectedTembusan.value.filter((i) => i.isGroup).map((i) => String(i.raw.id))
  );

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Set konten TinyMCE dari template yang dipilih */
  const handleApplyTemplate = (content: string) => {
    if (tinymceEditor.value) {
      const clean = content.trim().replace(/>\s+</g, '><');
      tinymceEditor.value.setContent(clean);
      editorContent.value = tinymceEditor.value.getContent();
    } else {
      editorContent.value = content;
    }
  };

  /** Buat FormData dari payload apapun, opsional sertakan PDF blob */
  const buildFormData = <T extends Record<string, any>>(
    payload: T,
    options: {
      includePdf?: boolean;
      skipKeys?: (keyof T)[];
      pdfFileName?: string;
    } = {}
  ): FormData => {
    const { includePdf = false, skipKeys = [], pdfFileName = 'dokumen.pdf' } = options;
    const formData = new FormData();

    (Object.keys(payload) as Array<keyof T>).forEach((key) => {
      if (skipKeys.includes(key)) return;
      const value = payload[key];
      if (Array.isArray(value)) {
        formData.append(key as string, JSON.stringify(value));
      } else if (value !== null && value !== undefined) {
        formData.append(key as string, String(value));
      }
    });

    if (includePdf && pdfBlob.value) {
      formData.append('final_pdf', pdfBlob.value, pdfFileName);
    }

    return formData;
  };

  /**
   * Map data grup dari API/draft ke format RecipientItem yang dipakai UI.
   * Butuh `recipientGroups` yang sudah terisi.
   */
  const mapGroupsToUI = (groupList: any[]): RecipientItem[] => {
    if (!groupList || !Array.isArray(groupList)) return [];
    return groupList
      .map((g) => {
        const gId = String(g.id || g);
        const master = recipientGroups.value.find((mg) => String(mg.id) === gId);
        if (!master) return null;
        return {
          label: master.nama,
          labelJob: master.nama,
          value: `GROUP_${master.id}`,
          isGroup: true,
          raw: master
        } as RecipientItem;
      })
      .filter(Boolean) as RecipientItem[];
  };

  /**
   * Map data individu dari API/draft ke RecipientItem.
   * Terima `masterList` sebagai referensi utama (items / tertujuItems / dll).
   */
  const mapApiToUI = (list: any[], masterList: RecipientItem[]): RecipientItem[] => {
    if (!list || !Array.isArray(list)) return [];
    return list.map((item) => {
      const posId = String(item.position_id || item.position || item.value || item.id || item);
      const master = masterList.find((m) => m.value === posId);
      if (master) return master;
      return {
        label: item.positionText
          ? `${item.persnum || ''} - (${item.abbreviation || ''}) ${item.positionText || item.labelJob || ''}`
          : posId,
        labelJob: item.positionText || item.labelJob || item.label || posId,
        value: posId,
        raw: item
      } as RecipientItem;
    });
  };

  /**
   * Merge grup + individu untuk selectedTertuju/selectedTembusan saat load draft.
   * Otomatis filter individu yang merupakan anggota grup yang sudah dipilih.
   *
   * Mendukung berbagai nama field anggota grup:
   *   - g.raw.details  / g.raw.members / g.raw.anggota
   *   - x.position     / x.position_id / x.id
   */
  const mergeGrupDanIndividu = (
    grupItems: RecipientItem[],
    individuItems: RecipientItem[]
  ): RecipientItem[] => {
    const grupMemberIds = grupItems.flatMap((g) => {
      // coba berbagai nama array anggota yang mungkin dikembalikan API
      const memberList: any[] = g.raw?.details || g.raw?.members || g.raw?.anggota || [];

      return memberList.map((x: any) =>
        // coba berbagai nama field ID
        String(x.position ?? x.position_id ?? x.id ?? x)
      );
    });

    return [...grupItems, ...individuItems.filter((i) => !grupMemberIds.includes(String(i.value)))];
  };

  /** Map lampiran dari API ke UploadedFile */
  const mapLampiranFiles = (files: any[]): UploadedFile[] => {
    if (!files || !Array.isArray(files)) return [];
    return files.map((f) => ({
      id: f.id,
      fileName: f.fileName || f.file_name,
      filePath: f.fileUrl || f.file_path,
      fileSize: f.fileSize || 0
    }));
  };

  /** Set tanggal dari string YYYY-MM-DD */
  const setDateFromString = (tgl: string) => {
    const parts = tgl.split('-');
    if (parts.length === 3) {
      date.value = new CalendarDate(Number(parts[0]), Number(parts[1]), Number(parts[2]));
    }
  };

  /** Set sifat dari string, fallback ke 'biasa' */
  const setSifatFromString = (sifat: string) => {
    const val = String(sifat || 'biasa').trim().toLowerCase().replace(/[\s-]+/g, '_');
    selectedSifat.value = sifatOptions.find((opt) => opt.value === val) ?? sifatOptions[3] ?? null;
  };

  // ── Confirm dialogs (identik di semua page) ──────────────────────────────────

  const confirmSaveDraft = async (onConfirmed: () => Promise<void>) => {
    const ok = await Alert.confirm(
      'Simpan sebagai Draft?',
      'Dokumen akan disimpan ke folder draft dan bisa Anda edit kembali nanti.',
      'Ya, Simpan',
      'Batal',
      false
    );
    if (!ok) return;
    try {
      await onConfirmed();
      Alert.close();
    } catch (err) {
      console.error(err);
      Alert.close();
    }
  };

  const confirmKirim = async (label: string, onConfirmed: () => Promise<void>) => {
    const ok = await Alert.confirm(
      'Konfirmasi Akhir',
      `${label} Lanjutkan?`,
      'Ya, Kirim Sekarang',
      'Periksa Lagi',
      false
    );
    if (ok) await onConfirmed();
  };

  // ── PDF preview helper ────────────────────────────────────────────────────────

  const revokePdfUrl = () => {
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = '';
    }
  };

  const setPdfBlob = (blob: ArrayBuffer | Blob) => {
    revokePdfUrl();
    pdfBlob.value = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' });
    pdfUrl.value = URL.createObjectURL(pdfBlob.value);
  };

  // ── Toast shortcuts ───────────────────────────────────────────────────────────

  const toastError = (title: string, description?: string) =>
    toast.add({ title, description, color: 'error' });

  const toastSuccess = (title: string, description?: string) =>
    toast.add({ title, description, color: 'success' });

  // ── Redirect helpers ──────────────────────────────────────────────────────────

  const redirectTerkirim = () => router.push('/korespondensi/terkirim');
  const redirectDraf = () => router.push('/korespondensi/draf');

  // ── Return ────────────────────────────────────────────────────────────────────

  return {
    // state
    isLoadingData,
    loadingMessage,
    isOpenPreview,
    editDraftId,
    subject,
    editorContent,
    tinymceEditor,
    date,
    klasifikasiList,
    klasifikasiStatus,
    selectedKlasifikasiId,
    existingFiles,
    recipientGroups,
    selectedTertuju,
    selectedTembusan,
    selectedSifat,
    pdfBlob,
    pdfUrl,

    // constants
    maxPerihal,
    sifatOptions,
    tinyMceInit,

    // computed
    selectedKlasifikasi,
    formattedDate,
    tglDb,
    tglDisplay,
    excludeTertujuList,
    excludeTembusanList,
    tertujuIndividu,
    tembusanIndividu,
    tertujuGrup,
    tembusanGrup,

    // helpers
    handleApplyTemplate,
    buildFormData,
    mapGroupsToUI,
    mapApiToUI,
    mergeGrupDanIndividu,
    mapLampiranFiles,
    setDateFromString,
    setSifatFromString,
    confirmSaveDraft,
    confirmKirim,
    setPdfBlob,
    revokePdfUrl,
    toastError,
    toastSuccess,
    redirectTerkirim,
    redirectDraf
  };
}
