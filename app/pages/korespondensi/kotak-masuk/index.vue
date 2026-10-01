<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { parseDate, today, getLocalTimeZone } from '@internationalized/date';
import {
  Inbox,
  FileText,
  Send,
  Building,
  Building2,
  FilePen,
  Archive,
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
  MoreVertical,
  History,
  ArrowUpDown,
  Layers,
  StickyNote,
  RotateCw,
  Download,
  Lock,
  Tag,
  Loader2,
  AlertTriangle,
  BookOpen,
  Calendar as CalendarIcon,
  LockOpen,
  Search,
  X,
  FolderPlus,
  Folder,
  Share2,
} from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import { useInbox } from '~/composables/useInbox';
import { useLabel } from '~/composables/useLabel';
import {
  applyKorespondensiListQuery,
  replaceCurrentKorespondensiListQuery,
} from '~/utils/korespondensi-list-state';
import EmptyState from '~/components/EmptyState.vue';

definePageMeta({ middleware: 'auth' });

// ── Auth & Toast ──────────────────────────────────────────────────────────────
const { user, getProfile, hasPermission } = useAuth();
const { canAccessPage } = useFeatureAccess()
const toast = useToast();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

// ── Composables ───────────────────────────────────────────────────────────────
const { items, pagination, summary, pending, fetchInbox, markAsRead, toggleFlag } = useInbox();
const { addNaskahToLabel: _addNaskahToLabel } = useLabel();
const { getBerkasList, addNaskahToBerkas, getBerkasStatusByNaskah } = useArsipDinamis();
const { canReadBerkasStatus } = useArsipDinamisPermission();

// ── Share Naskah ─────────────────────────────────────────────────────────────
const showShareModal = ref(false);
const shareNaskah = ref<any>(null);

const handleShare = (mail: any) => {
  if (!mail?.naskahId) {
    toast.add({ title: 'Tidak bisa membagikan', description: 'Naskah ID tidak ditemukan', color: 'error' });
    return;
  }
  shareNaskah.value = mail;
  showShareModal.value = true;
};

const handleShareClose = () => {
  showShareModal.value = false;
  shareNaskah.value = null;
};

// ── Bulk Share (multi-naskah) ────────────────────────────────────────────────
const showBulkShareModal = ref(false);
const bulkShareNaskahs = ref<any[]>([]);

const handleBulkShare = () => {
  // Ambil semua naskah yang terpilih
  const selectedNaskahs: any[] = [];
  selectedIds.value.forEach((id) => {
    const item = items.value.find((e) => e.id === id);
    if (item?.naskahId) {
      selectedNaskahs.push({
        naskahId: item.naskahId,
        perihal: item.perihal || item.judul || item.subject,
        nomor: item.nomor,
      });
    }
  });
  if (selectedNaskahs.length === 0) {
    toast.add({ title: 'Tidak bisa membagikan', description: 'Tidak ada naskah valid yang dipilih', color: 'error' });
    return;
  }
  bulkShareNaskahs.value = selectedNaskahs;
  showBulkShareModal.value = true;
};

const handleBulkShareClose = () => {
  showBulkShareModal.value = false;
  bulkShareNaskahs.value = [];
};

// ── Masukkan ke Berkas ───────────────────────────────────────────────────────
const showAddToBerkasModal = ref(false);
const selectedNaskahForBerkas = ref<any>(null);
const berkasListForModal = ref<any[]>([]);
const selectedBerkasId = ref('');
const isAddingToBerkas = ref(false);
const berkasStatusMap = ref<Record<string, any>>({});
const openBerkasDropdown = ref(false);
const berkasSearch = ref('');
const berkasTriggerRef = ref<HTMLElement | null>(null);
const berkasPanelStyle = ref<Record<string, string>>({});
// Info berkas tertutup tempat naskah berada (naskah terkunci, tidak bisa dipindah)
const berkasLockedInfo = ref<any>(null);

// Posisi panel mengikuti tombol trigger (panel di-teleport ke body).
const updateBerkasPanelPosition = () => {
  const el = berkasTriggerRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  berkasPanelStyle.value = {
    left: `${rect.left}px`,
    top: `${rect.bottom + 6}px`,
    width: `${rect.width}px`,
  };
};

const toggleBerkasDropdown = () => {
  openBerkasDropdown.value = !openBerkasDropdown.value;
  if (openBerkasDropdown.value) {
    updateBerkasPanelPosition();
    berkasSearch.value = '';
  }
};

const selectedBerkasLabel = computed(() => {
  const b = berkasListForModal.value.find((x) => x.id === selectedBerkasId.value);
  if (!b) return '';
  return `${b.kodeBerkas ?? b.kode_berkas ?? '-'} — ${b.judulBerkas ?? b.judul_berkas ?? '-'}`;
});

const filteredBerkasList = computed(() => {
  const q = berkasSearch.value.trim().toLowerCase();
  if (!q) return berkasListForModal.value;
  return berkasListForModal.value.filter((b) =>
    `${b.kodeBerkas ?? b.kode_berkas ?? ''} ${b.judulBerkas ?? b.judul_berkas ?? ''}`
      .toLowerCase()
      .includes(q),
  );
});

const selectBerkas = (b: any) => {
  selectedBerkasId.value = b.id;
  openBerkasDropdown.value = false;
  berkasSearch.value = '';
};

// Tutup dropdown berkas saat klik di luar (pola data-custom-dropdown existing).
// Panel di-teleport ke body, jadi cek juga apakah klik terjadi di dalam panel.
function handleBerkasDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.closest('[data-custom-dropdown]')) return;
  openBerkasDropdown.value = false;
  berkasSearch.value = '';
}

const fetchBerkasStatus = async (rows: any[]) => {
  if (!canReadBerkasStatus.value || rows.length === 0) return;
  const ids = rows.map((r: any) => r.naskahId).filter(Boolean);
  if (!ids.length) return;
  try {
    const res: any = await getBerkasStatusByNaskah(ids);
    const arr: any[] = res?.data ?? res;
    const map: Record<string, any> = {};
    arr.forEach((x: any) => { map[x.naskah_id] = x; });
    berkasStatusMap.value = map;
  } catch {
    berkasStatusMap.value = {};
  }
};

const openAddToBerkasModal = async (mail: any) => {
  selectedNaskahForBerkas.value = mail;
  selectedBerkasId.value = '';
  openBerkasDropdown.value = false;
  berkasSearch.value = '';
  showAddToBerkasModal.value = true;
  try {
    const data: any = await getBerkasList({ status: 'aktif', limit: 100 });
    // getBerkasList mengembalikan envelope { success, data: { data: [...], meta } };
    // ambil array-nya (defensif terhadap variasi envelope) — bukan object pagination.
    berkasListForModal.value =
      data?.data?.data && Array.isArray(data.data.data)
        ? data.data.data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
  } catch (e) {
    console.error('Gagal memuat daftar berkas:', e);
  }
  // Naskah yang sudah masuk berkas TERTUTUP tidak bisa dipindah lagi.
  // Naskah di berkas AKTIF: pre-select berkasnya sebagai default (masih bisa diganti).
  const current = berkasStatusMap.value[mail.naskahId];
  if (current?.berkas_status && current.berkas_status !== 'aktif') {
    berkasLockedInfo.value = current;
  } else {
    berkasLockedInfo.value = null;
    if (current?.berkas_id) {
      selectedBerkasId.value = current.berkas_id;
    }
  }
};

const handleAddToBerkas = async () => {
  if (!selectedBerkasId.value || !selectedNaskahForBerkas.value) return;
  if (berkasLockedInfo.value) return; // naskah terkunci di berkas tertutup
  isAddingToBerkas.value = true;
  try {
    await addNaskahToBerkas(selectedBerkasId.value, {
      naskah_ids: [selectedNaskahForBerkas.value.naskahId],
      sumber: 'kotak_masuk',
    });
    toast.add({ title: 'Naskah berhasil ditambahkan ke berkas', color: 'success' });
    showAddToBerkasModal.value = false;
  } catch (e: any) {
    toast.add({ title: e?.message || 'Gagal menambahkan ke berkas', color: 'error' });
  } finally {
    isAddingToBerkas.value = false;
  }
};
const { inboxCount, flagUpdate, init: initRealtimeSocket } = useRealtimeSocket();
const { notifications, init: initNotifications } = useNotifications();

// ── UI State ──────────────────────────────────────────────────────────────────
const isLoading = ref(false);
const isRefreshing = ref(false);
const isUnmounted = ref(false);
const selected = ref(null);
const selectedIds = ref(new Set());
const searchQuery = ref('');
const isLabelProcessing = ref(false);
const showLabelAssignModal = ref(false);

// ── Filter & Pagination ───────────────────────────────────────────────────────
const activeTab = ref('ALL');
const activeFilterType = ref('Semua');
const filterSudahBerkas = ref(false);
const activeSortLabel = ref('Terbaru');
const activeDateLabel = ref('Semua');
const itemsPerPage = ref(10);
const currentPage = ref(1);

// ── Dropdown Visibility ───────────────────────────────────────────────────────
const showFilterMenu = ref(false);
const showSortMenu = ref(false);
const showPageMenu = ref(false);
const showDateMenu = ref(false);

// ── Date Range (Custom) ───────────────────────────────────────────────────────
// Init kosong supaya SSR & client render identik (no hydration mismatch).
// Nilai aktual ditentukan di onMounted di bawah.
const startDateInput = ref('');
const endDateInput = ref('');
const startDateCal = ref<any>(null);
const endDateCal = ref<any>(null);
const openStartDate = ref(false);
const openEndDate = ref(false);
const isCustomDate = computed(() => activeDateLabel.value === 'Custom');

// Sync CalendarDate ↔ string YYYY-MM-DD
watch(startDateCal, (val) => {
  if (val) startDateInput.value = val.toString();
});
watch(endDateCal, (val) => {
  if (val) endDateInput.value = val.toString();
});

// ── Archive Modal ─────────────────────────────────────────────────────────────
const showDeleteModal = ref(false);
const isDeleting = ref(false);

// ── Static Config ─────────────────────────────────────────────────────────────
const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('kotak_masuk'), to: '#' },
]);

const tabs = computed(() => [
  { label: t('k_semua'), value: 'ALL', icon: Inbox },
  { label: t('k_nota_dinas'), value: 'ND', icon: FileText },
  { label: t('k_disposisi'), value: 'DI', icon: Send },
  { label: t('k_internal'), value: 'SDI', icon: Building },
  { label: t('k_eksternal'), value: 'SDE', icon: Building2 },
  { label: t('k_konsep'), value: 'K', icon: FilePen },
  { label: t('k_kajian'), value: 'KA', icon: BookOpen },
]);

const filterMenuOptions = computed(() => [
  { label: t('k_semua'), value: 'Semua' },
  { label: t('k_prioritas'), value: 'Prioritas' },
  { label: t('k_favorit'), value: 'Favorite' },
  { label: t('km_sudah_tinjut'), value: 'Sudah Tinjut' },
  { label: t('km_belum_tinjut'), value: 'Belum Tinjut' },
  { label: t('k_lock'), value: 'Lock' },
  { label: t('km_note'), value: 'Note' },
  { label: t('k_arsip'), value: 'Arsip' },
  { label: t('km_sudah_dibaca'), value: 'Sudah Dibaca' },
  { label: t('k_belum_dibaca'), value: 'Belum Dibaca' },
]);

const dateOptions = computed(() => [
  { label: t('k_7_hari'), value: '7 Hari' },
  { label: t('k_30_hari'), value: '30 Hari' },
  { label: t('k_60_hari'), value: '60 Hari' },
  { label: t('k_1_tahun'), value: '1 Tahun' },
  { label: t('k_semua'), value: 'Semua' },
]);
const sortOptions = computed(() => [
  { label: t('k_terbaru'), value: 'Terbaru' },
  { label: t('k_terlama'), value: 'Terlama' },
]);
const pageOptions = [10, 25, 50, 100];

// ── Helpers ───────────────────────────────────────────────────────────────────
import { formatShortDate, getCategoryStyle, getCategoryLabel, getCategoryFullName } from '~/utils/mail-helpers';

const getTabCount = (tabValue: string) => {
  if (!summary.value?.total_per_jenis) return 0;
  if (tabValue === 'ALL') return summary.value.total_semua || 0;
  return summary.value.total_per_jenis[tabValue] || 0;
};

// ── Core: Fetch Data ──────────────────────────────────────────────────────────
const refreshData = async () => {
  isRefreshing.value = true;
  isLoading.value = true;
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value || undefined,
    };

    // Tab → jenis
    if (activeTab.value !== 'ALL' && activeTab.value !== 'Semua') {
      params.jenis = activeTab.value;
    }

    // Date filter
    const now = new Date();
    const toStr = (d: Date) => d.toISOString().split('T')[0];
    if (activeDateLabel.value === 'Custom') {
      params.start_date = startDateInput.value;
      params.end_date = endDateInput.value;
    } else if (activeDateLabel.value !== 'Semua') {
      const daysMap: Record<string, number> = {
        '7 Hari': 7,
        '30 Hari': 30,
        '60 Hari': 60,
        '1 Tahun': 365,
      };
      const days = daysMap[activeDateLabel.value];
      if (days) {
        const from = new Date(now);
        from.setDate(now.getDate() - days);
        params.start_date = toStr(from);
        params.end_date = toStr(now);
      }
    }

    // Sort
    params.sort = activeSortLabel.value === 'Terlama' ? 'terlama' : 'terbaru';

    // Filter type → API param
    const filterMap: Record<string, Record<string, any>> = {
      'Sudah Dibaca': { status_baca: 'terbaca' },
      'Belum Dibaca': { status_baca: 'belum_terbaca' },
      Favorite: { favorite: true },
      'Sudah Tinjut': { tinjut: 'sudah_tinjut' },
      'Belum Tinjut': { tinjut: 'belum_tinjut' },
      Lock: { lock: true },
      Note: { note: true },
      Arsip: { arsip: true },
      Prioritas: { priority: true },
    };
    Object.assign(params, filterMap[activeFilterType.value] || {});

    await fetchInbox(params);
    await fetchBerkasStatus(items.value || []);
  } catch (err) {
    console.error('Gagal refresh data inbox:', err);
  } finally {
    if (!isUnmounted.value) {
      isLoading.value = false;
      isRefreshing.value = false;
    }
  }
};

// ── Label ─────────────────────────────────────────────────────────────────────
const addNaskahToLabel = async (naskahId: string, labelId: string) =>
  await _addNaskahToLabel(naskahId, labelId, 'inbox');

const assignLabelToSelected = async (labelId: string, labelName: string) => {
  if (selectedIds.value.size === 0) return;
  isLabelProcessing.value = true;
  try {
    const promises = Array.from(selectedIds.value)
      .map((selectedId) => {
        const mailItem = items.value.find((e) => e.id === selectedId);
        const realNaskahId = mailItem?.naskahId;
        if (!realNaskahId) {
          console.warn(`Naskah ID tidak ditemukan: ${selectedId}`);
          return null;
        }
        return addNaskahToLabel(realNaskahId, labelId);
      })
      .filter((p) => p !== null);

    await Promise.all(promises);
    toast.add({
      title: t('km_berhasil'),
      description: t('km_label_ditambahkan', { label: labelName, count: promises.length }),
      color: 'success',
    });
    showLabelAssignModal.value = false;
    selectedIds.value.clear();
    refreshData();
  } catch {
    toast.add({ title: t('km_gagal'), description: t('km_gagal_menambahkan_label'), color: 'error' });
  } finally {
    isLabelProcessing.value = false;
  }
};

// ── Selection ─────────────────────────────────────────────────────────────────
const toggleSelectAll = () => {
  if (isAllSelected.value) selectedIds.value.clear();
  else displayItems.value.forEach((mail) => selectedIds.value.add(mail.id));
};

const toggleSelection = (id: string) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
};

const getListState = () => ({
  activeTab: activeTab.value,
  activeFilterType: activeFilterType.value,
  activeSortLabel: activeSortLabel.value,
  activeDateLabel: activeDateLabel.value,
  currentPage: currentPage.value,
  itemsPerPage: itemsPerPage.value,
  searchQuery: searchQuery.value,
  startDateInput: startDateInput.value,
  endDateInput: endDateInput.value,
});

const selectMail = async (mail: any) => {
  // Safeguard: kalau naskahId tidak valid, tampilkan toast dan log untuk diagnose.
  if (!mail?.naskahId) {
    console.warn('[Inbox] selectMail: naskahId kosong untuk mail:', mail);
    useToast().add({
      title: t('km_surat_tidak_bisa_dibuka'),
      description: t('km_surat_tidak_lengkap'),
      color: 'warning',
    });
    return;
  }

  selected.value = mail;
  if (user.value?.position) markAsRead(mail, user.value.position);

  const jenisParam = mail.category || mail.jenis || 'ND';
  const listQuery = await replaceCurrentKorespondensiListQuery(router, route, getListState());
  navigateTo({
    path: `/korespondensi/kotak-masuk/${mail.naskahId}`,
    query: { ...listQuery, jenis: jenisParam },
  });
};

// ── Toggle Flag (per-item) ────────────────────────────────────────────────────
const handleToggleFlag = async (
  mail: any,
  type: 'favorit' | 'arsip' | 'note' | 'tindak_lanjut' | 'lock'
) => {
  // Note: open modal instead of toggling directly
  if (type === 'note') {
    noteModalMail.value = mail;
    noteModalText.value = mail.noteText || mail.note_text || '';
    showNoteModal.value = true;
    return;
  }

  try {
    const item = items.value.find((i) => i.id === mail.id);
    if (!item) return;

    const descMap: Record<string, [string, string]> = {
      favorit: [t('km_ditambahkan_ke_favorit'), t('km_dihapus_dari_favorit')],
      tindak_lanjut: [t('km_ditandai_tindak_lanjut'), t('km_tindak_lanjut_selesai')],
      note: [t('km_note_ditandai'), t('km_tanda_note_dihapus')],
      lock: [t('km_pesan_dikunci'), t('km_kunci_pesan_dibuka')],
      arsip: [t('km_pesan_diarsipkan'), t('km_pesan_dikembalikan_dari_arsip')],
    };

    // Toggle nilai
    const flagKey = {
      favorit: 'isStarred',
      arsip: 'isArsip',
      note: 'isNote',
      tindak_lanjut: 'isTinjut',
      lock: 'isLocked',
    }[type] as keyof typeof item;
    (item as any)[flagKey] = !(item as any)[flagKey];
    const isNowActive = (item as any)[flagKey];

    toast.add({
      title: t('km_berhasil'),
      description: descMap[type][isNowActive ? 0 : 1],
      color: 'success',
    } as any);

    // Hapus dari list jika arsip di-toggle (optimistic remove)
    if (type === 'arsip') {
      const filterIsArsip = activeFilterType.value === 'Arsip';
      if ((!filterIsArsip && isNowActive) || (filterIsArsip && !isNowActive)) {
        items.value = items.value.filter((i) => i.id !== mail.id);
      }
    }

    await toggleFlag(item, type);
  } catch {
    toast.add({ title: t('km_gagal'), description: t('km_gagal_memperbarui_status'), color: 'error' });
    refreshData();
  }
};

// ── Note Modal ────────────────────────────────────────────────────────────────
const showNoteModal = ref(false);
const noteModalMail = ref<any>(null);
const noteModalText = ref('');
const isSavingNote = ref(false);

const saveNoteFromList = async () => {
  const mail = noteModalMail.value;
  if (!mail) return;
  isSavingNote.value = true;
  try {
    const item = items.value.find((i) => i.id === mail.id);
    const hasText = noteModalText.value && noteModalText.value.trim().length > 0;
    if (item) {
      item.isNote = hasText;
      item.noteText = hasText ? noteModalText.value : '';
    }
    toast.add({
      title: t('km_berhasil'),
      description: hasText ? t('km_catatan_disimpan') : t('km_catatan_dihapus'),
      color: 'success',
    } as any);
    await toggleFlag(item || mail, 'note', noteModalText.value);
    showNoteModal.value = false;
  } catch {
    toast.add({ title: t('km_gagal'), description: t('km_gagal_menyimpan_catatan'), color: 'error' });
    refreshData();
  } finally {
    isSavingNote.value = false;
  }
};

const removeNoteFromList = async () => {
  noteModalText.value = '';
  await saveNoteFromList();
};

// ── Bulk Archive ──────────────────────────────────────────────────────────────
const handleBulkExecute = async () => {
  if (!user.value?.position) return;
  isDeleting.value = true;
  try {
    const promises = Array.from(selectedIds.value)
      .map((selectedId) => {
        const mailItem = items.value.find((e) => e.id === selectedId);
        if (!mailItem) return null;
        mailItem.isArsip = !isUnarchiveMode.value; // optimistic toggle
        return toggleFlag(mailItem, 'arsip');
      })
      .filter(Boolean);

    await Promise.all(promises);

    toast.add({
      title: t('km_berhasil'),
      description: isUnarchiveMode.value
        ? t('km_item_dikeluarkan_arsip', { count: promises.length })
        : t('km_item_diarsipkan', { count: promises.length }),
      color: 'success',
    });

    selectedIds.value.clear();
    showDeleteModal.value = false;
    await refreshData(); // refetch agar list langsung update
  } catch {
    toast.add({ title: t('km_gagal'), description: t('km_terjadi_kesalahan'), color: 'error' });
    await refreshData();
  } finally {
    isDeleting.value = false;
  }
};

// ── Filter / Sort / Pagination UI Actions ────────────────────────────────────
const applyFilter = (v: string) => {
  activeFilterType.value = v;
  showFilterMenu.value = false;
};
const selectSortOption = (v: string) => {
  activeSortLabel.value = v;
  showSortMenu.value = false;
  currentPage.value = 1;
  refreshData();
};
const selectPageSize = (v: number) => {
  itemsPerPage.value = v;
  showPageMenu.value = false;
};
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};
const openLabelAssignModal = () => {
  showLabelAssignModal.value = true;
};

// Preset date → refresh langsung
const selectDateFilter = (opt: string) => {
  activeDateLabel.value = opt;
  showDateMenu.value = false;
  currentPage.value = 1;
  refreshData();
};

// Custom date → set label "Custom" lalu refresh
const applyCustomDate = () => {
  activeDateLabel.value = 'Custom';
  showDateMenu.value = false;
  currentPage.value = 1;
  refreshData();
};

// ── Excel Export ──────────────────────────────────────────────────────────────
// ── Excel Export ──────────────────────────────────────────────────────────────
const isExporting = ref(false);

const downloadExcel = async () => {
  isExporting.value = true;
  try {
    // Fetch semua data tanpa pagination dan filter
    const params: Record<string, any> = {
      page: 1,
      limit: 9999,
    };

    // Hanya kirim jenis jika tab aktif bukan ALL
    if (activeTab.value !== 'ALL' && activeTab.value !== 'Semua') {
      params.jenis = activeTab.value;
    }

    await fetchInbox(params);
    const allItems = items.value || [];

    if (allItems.length === 0) {
      toast.add({
        title: t('k_tidak_ada_data'),
        description: t('km_tidak_ada_data_ekspor'),
        color: 'warning',
      });
      return;
    }

    const totalTerbaca = allItems.filter((m) => m.isRead).length;
    const totalBelumDibaca = allItems.filter((m) => !m.isRead).length;

    const tableData = allItems.map((mail, i) => ({
      No: i + 1,
      Nomor: mail.nomor || '-',
      Perihal: mail.subject || '-',
      Pengirim: mail.from || '-',
      Kategori: mail.category_label || mail.category || '-',
      Tanggal: formatShortDate(mail.raw?.created_at),
      Status_Baca: mail.isRead ? 'Sudah Dibaca' : 'Belum Dibaca',
    }));

    const ws = XLSX.utils.aoa_to_sheet([
      ['RINGKASAN KOTAK MASUK (Semua Data)'],
      ['Total Item', allItems.length],
      ['Total Terbaca', totalTerbaca],
      ['Total Belum Dibaca', totalBelumDibaca],
      [],
    ]);
    XLSX.utils.sheet_add_json(ws, tableData, { origin: 'A6' });

    // Set lebar kolom
    ws['!cols'] = [
      { wch: 5 }, // No
      { wch: 15 }, // Nomor
      { wch: 40 }, // Perihal
      { wch: 30 }, // Pengirim
      { wch: 12 }, // Kategori
      { wch: 18 }, // Tanggal
      { wch: 15 }, // Status Baca
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kotak Masuk');
    XLSX.writeFile(wb, `kotak_masuk_semua_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast.add({
      title: t('km_berhasil'),
      description: t('km_data_berhasil_diekspor', { count: allItems.length }),
      color: 'success',
    });
  } catch (err) {
    console.error('Gagal export Excel:', err);
    toast.add({
      title: t('km_gagal'),
      description: t('km_gagal_ekspor'),
      color: 'error',
    });
  } finally {
    isExporting.value = false;
    // Refresh kembali ke state semula setelah export
    refreshData();
  }
};

// ── Computed ──────────────────────────────────────────────────────────────────
const displayItems = computed(() => {
  const all = items.value || [];
  return filterSudahBerkas.value
    ? all.filter((m: any) => !!berkasStatusMap.value[m.naskahId])
    : all;
});
const totalPages = computed(() => pagination.value.totalPages);
const isAllSelected = computed(
  () => displayItems.value.length > 0 && selectedIds.value.size === displayItems.value.length
);
const firstSelectedItem = computed(() => {
  if (selectedIds.value.size === 0) return null;
  return displayItems.value.find((e) => e.id === [...selectedIds.value][0]);
});
const paginationInfo = computed(() => {
  if (pagination.value.total === 0) return t('km_pagination_zero');
  const start = (pagination.value.page - 1) * pagination.value.limit + 1;
  const end = Math.min(start + pagination.value.limit - 1, pagination.value.total);
  return t('km_pagination_range', { start, end, total: pagination.value.total });
});
const activeFilterLabel = computed(
  () => filterMenuOptions.value.find((o) => o.value === activeFilterType.value)?.label ?? activeFilterType.value
);
const selectedNaskahIds = computed(() => {
  const result = new Set<string>();
  selectedIds.value.forEach((id) => {
    const item = items.value.find((e) => e.id === id);
    if (item?.naskahId) result.add(item.naskahId);
  });
  return result;
});
const isUnarchiveMode = computed(() => activeFilterType.value === 'Arsip');

// ── Watchers ──────────────────────────────────────────────────────────────────
// Tab / limit / filter berubah → reset ke halaman 1
let applyingRouteQuery = false;
watch([activeTab, itemsPerPage, activeFilterType], () => {
  // applyKorespondensiListQuery() mengubah beberapa ref sekaligus saat masuk
  // dari card dashboard. Tunggu init selesai agar tidak double-fetch.
  if (applyingRouteQuery) return;
  currentPage.value = 1;
  refreshData();
});
watch(currentPage, () => refreshData());

// Search dengan debounce 500ms
let searchTimeout: ReturnType<typeof setTimeout>;
let realtimeRefreshTimeout: ReturnType<typeof setTimeout> | null = null;

const scheduleRealtimeRefresh = () => {
  if (isUnmounted.value) return;
  if (realtimeRefreshTimeout) clearTimeout(realtimeRefreshTimeout);
  realtimeRefreshTimeout = setTimeout(() => {
    if (!isUnmounted.value) refreshData();
  }, 350);
};

watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    refreshData();
  }, 500);
});

watch(inboxCount, (_newValue, oldValue) => {
  if (oldValue === undefined) return;
  scheduleRealtimeRefresh();
});

// Realtime flag sync — update item flags in place saat diubah dari device/web lain.
watch(flagUpdate, (payload) => {
  if (!payload) return;
  const item = items.value.find((i) => i.id === payload.id_sirkulasi || i.sirkulasiId === payload.id_sirkulasi);
  if (!item) return;
  const flagKeyMap: Record<string, string> = {
    favorit: 'isStarred',
    arsip: 'isArsip',
    note: 'isNote',
    lock: 'isLocked',
    tindak_lanjut: 'isTinjut',
  };
  const key = flagKeyMap[payload.flag_type];
  if (!key) return;
  (item as any)[key] = payload.new_value;
  if (payload.flag_type === 'note') {
    (item as any).noteText = payload.new_value ? (payload.note_text || '') : '';
  }
});

watch(
  () => notifications.value[0]?.id,
  (newValue, oldValue) => {
    if (!newValue || !oldValue || newValue === oldValue) return;
    const latest = notifications.value[0];
    const action = String(latest?.data?.action || '');
    const type = String(latest?.type || '');
    const shouldRefresh =
      action === 'OPEN_INBOX_DETAIL' ||
      action === 'OPEN_DISPOSISI_DETAIL' ||
      [
        'NASKAH_MASUK',
        'NASKAH_TEMBUSAN',
        'DISPOSISI',
        'DISPOSISI_SELESAI',
        'KONSEP_DISETUJUI',
        'KONSEP_DITOLAK',
      ].includes(type);
    if (shouldRefresh) scheduleRealtimeRefresh();
  }
);

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  // Inisialisasi tanggal di client (hindari hydration mismatch dari new Date()).
  const today = new Date().toISOString().split('T')[0];
  startDateInput.value = today;
  endDateInput.value = today;
  startDateCal.value = parseDate(today);
  endDateCal.value = parseDate(today);

  document.addEventListener('click', handleBerkasDocumentClick);

  if (!user.value) await getProfile();
  await Promise.all([initRealtimeSocket(), initNotifications()]);
  applyingRouteQuery = true;
  applyKorespondensiListQuery(
    route.query,
    {
      activeTab,
      activeFilterType,
      activeSortLabel,
      activeDateLabel,
      currentPage,
      itemsPerPage,
      searchQuery,
      startDateInput,
      endDateInput,
    },
    {
      tabs: tabs.value.map((t) => t.value),
      filters: filterMenuOptions.value.map((f) => f.value),
      sorts: sortOptions.value.map((o) => o.value),
      dates: dateOptions.value.map((o) => o.value),
      pageSizes: pageOptions,
    }
  );
  // Biarkan watcher ref selesai tanpa melakukan fetch, lalu lakukan tepat satu
  // fetch memakai seluruh parameter dari URL.
  await nextTick();
  applyingRouteQuery = false;
  refreshData();
});

onUnmounted(() => {
  isUnmounted.value = true;
  clearTimeout(searchTimeout);
  if (realtimeRefreshTimeout) clearTimeout(realtimeRefreshTimeout);
  document.removeEventListener('click', handleBerkasDocumentClick);
});
</script>

<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else>
  <PageHeader :title="$t('kotak_masuk')" :items="breadcrumbs" />
  <div
    class="w-full h-[calc(100vh-140px)] flex flex-col bg-transparent dark:bg-gray-900 overflow-hidden max-w-full font-sans rounded-xl shadow-sm glass-blue transition-colors"
  >
    <!-- ── TOOLBAR ─────────────────────────────────────────────────────────── -->
    <div
      class="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 shrink-0 z-30 min-w-0 glass-panel bg-white dark:bg-gray-800 transition-colors"
    >
      <!-- LEFT: Checkbox + Filter + Refresh + Bulk Actions -->
      <div class="flex items-center gap-1 shrink-0 relative">
        <!-- Select All -->
        <UTooltip :text="$t('k_pilih_semua')">
          <div
            class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
            @click="toggleSelectAll"
          >
            <div
              class="w-3.5 h-3.5 border-[1.5px] border-gray-400 dark:border-gray-500 rounded-sm flex items-center justify-center transition-colors"
              :class="{
                'bg-primary border-primary': isAllSelected,
                'group-hover:border-gray-600 dark:group-hover:border-gray-300': !isAllSelected,
              }"
            >
              <Check v-if="isAllSelected" class="w-3 h-3 text-white" stroke-width="3" />
            </div>
          </div>
        </UTooltip>

        <!-- Filter Dropdown -->
        <div class="relative">
          <UTooltip :text="$t('k_opsi_filter')">
            <button
              @click="showFilterMenu = !showFilterMenu"
              class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors relative"
              :class="{
                'bg-gray-100 dark:bg-gray-700 text-neutral-900 dark:text-gray-200': showFilterMenu,
              }"
            >
              <MoreVertical class="w-4 h-4" />
              <!-- Dot indikator filter aktif -->
              <span
                v-if="activeFilterType !== 'Semua'"
                class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-800"
              />
            </button>
          </UTooltip>
          <div
            v-if="showFilterMenu"
            @click="showFilterMenu = false"
            class="fixed inset-0 z-40 bg-transparent"
          />
          <div
            v-if="showFilterMenu"
            class="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <button
              v-for="opt in filterMenuOptions"
              :key="opt.value"
              @click="applyFilter(opt.value)"
              class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
            >
              <span :class="activeFilterType === opt.value ? 'font-semibold text-primary' : ''">{{
                opt.label
              }}</span>
              <Check v-if="activeFilterType === opt.value" class="w-3.5 h-3.5 text-primary" />
            </button>
          </div>
        </div>

        <!-- Refresh -->
        <UTooltip :text="$t('k_muat_ulang')">
          <button
            @click="refreshData"
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
          >
            <RotateCw
              class="w-4 h-4 transition-transform duration-300"
              :class="{ 'animate-spin': isRefreshing }"
            />
          </button>
        </UTooltip>

        <!-- Bulk Actions (muncul saat ada item dipilih) -->
        <div v-if="selectedIds.size > 0" class="flex items-center">
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block" />
          <div class="flex items-center gap-0 animate-in fade-in slide-in-from-left-2 duration-200">
            <UTooltip :text="$t('k_arsipkan')">
              <button
                @click="showDeleteModal = true"
                class="p-1.5 text-primary dark:text-primary-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-primary rounded hidden sm:block transition-colors"
              >
                <Archive class="w-4 h-4" />
              </button>
            </UTooltip>
            <UTooltip :text="$t('k_label')">
              <button
                @click="openLabelAssignModal"
                class="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary rounded transition-colors"
              >
                <Tag class="w-4 h-4" />
              </button>
            </UTooltip>
            <UTooltip :text="$t('berbagi', 'Bagikan')">
              <button
                @click="handleBulkShare"
                class="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-500 rounded transition-colors"
              >
                <Share2 class="w-4 h-4" />
              </button>
            </UTooltip>
            <span class="text-xs text-neutral-500 dark:text-gray-400 ms-2"
              >{{ selectedIds.size }} {{ $t('km_dipilih') }}</span
            >
          </div>
        </div>

        <!-- Badge filter aktif -->
        <div
          v-if="activeFilterType !== 'Semua' && selectedIds.size === 0"
          class="flex items-center"
        >
          <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block" />
          <span
            class="hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 border border-primary-200 dark:border-primary-700 rounded-full font-medium animate-in fade-in duration-200"
          >
            {{ activeFilterLabel }}
            <button @click="applyFilter('Semua')" class="hover:text-primary-800 ml-0.5">
              <X class="w-3 h-3" />
            </button>
          </span>
        </div>

        <!-- Filter Sudah Berkas (client-side) -->
        <button
          @click="filterSudahBerkas = !filterSudahBerkas"
          :class="
            filterSudahBerkas
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 border border-primary-200 dark:border-primary-700'
              : 'text-neutral-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
          "
          class="hidden md:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors"
        >
          <UIcon name="i-lucide-folder-check" class="w-3.5 h-3.5" />
          Sudah Berkas
        </button>
      </div>

      <!-- RIGHT: Date + Sort + Download + Pagination -->
      <div class="flex items-center gap-1 shrink-0 min-w-0 pr-1">
        <!-- Date Filter -->
        <div class="relative">
          <UTooltip :text="$t('k_periode_data')">
            <button
              @click="showDateMenu = !showDateMenu"
              class="flex items-center gap-1 p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors relative"
            >
              <History class="w-4 h-4 shrink-0" />
              <span
                v-if="activeDateLabel !== 'Semua'"
                class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-gray-800"
              />
            </button>
          </UTooltip>
          <div
            v-if="showDateMenu"
            @click="showDateMenu = false"
            class="fixed inset-0 z-40 bg-transparent"
          />

          <div
            v-if="showDateMenu"
            class="absolute top-full right-0 mt-2 w-[480px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden flex animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <!-- Custom range -->
            <div
              class="w-7/12 p-4 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30"
            >
              <div
                class="text-[13px] font-semibold text-gray-900 dark:text-gray-200 mb-4 flex items-center justify-between"
              >
                <span>{{ $t('km_rentang_tanggal') }}</span>
                <Check v-if="isCustomDate" class="w-3.5 h-3.5 text-primary" />
              </div>
              <div class="space-y-4">
                <!-- Mulai -->
                <div>
                  <label
                    class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5"
                    >{{ $t('km_mulai') }}</label
                  >
                  <ClientOnly>
                    <UPopover
                      v-model:open="openStartDate"
                      :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
                    >
                      <div
                        class="flex items-center gap-2 cursor-pointer w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md"
                        @click="openStartDate = true"
                      >
                        <UInputDate
                          locale="id-ID"
                          v-model="startDateCal"
                          variant="none"
                          size="sm"
                          format="DD MMMM YYYY"
                          class="flex-1"
                          :ui="{
                            base: '!bg-transparent !text-sm !px-0 !ring-0 pointer-events-none inline-flex items-center h-5',
                          }"
                        />
                        <CalendarIcon class="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                      <template #content>
                        <UCalendar
                          v-model="startDateCal"
                          class="p-2"
                          @update:model-value="openStartDate = false"
                        />
                      </template>
                    </UPopover>
                  </ClientOnly>
                </div>
                <!-- Sampai -->
                <div>
                  <label
                    class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5"
                    >{{ $t('km_sampai') }}</label
                  >
                  <ClientOnly>
                    <UPopover
                      v-model:open="openEndDate"
                      :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
                    >
                      <div
                        class="flex items-center gap-2 cursor-pointer w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md"
                        @click="openEndDate = true"
                      >
                        <UInputDate
                          locale="id-ID"
                          v-model="endDateCal"
                          variant="none"
                          size="sm"
                          format="DD MMMM YYYY"
                          class="flex-1"
                          :ui="{
                            base: '!bg-transparent !text-sm !px-0 !ring-0 pointer-events-none inline-flex items-center h-5',
                          }"
                        />
                        <CalendarIcon class="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                      <template #content>
                        <UCalendar
                          v-model="endDateCal"
                          class="p-2"
                          @update:model-value="openEndDate = false"
                        />
                      </template>
                    </UPopover>
                  </ClientOnly>
                </div>
                <button
                  @click="applyCustomDate"
                  class="w-full mt-2 bg-primary text-white text-[12px] font-medium py-2.5 rounded-md hover:bg-primary-600 transition-colors shadow-sm active:scale-[0.98]"
                >
                  {{ $t('km_terapkan_filter') }}
                </button>
              </div>
            </div>

            <!-- Preset -->
            <div class="w-5/12 py-2 bg-white dark:bg-gray-800">
              <div
                class="px-4 py-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
              >
                {{ $t('km_preset') }}
              </div>
              <button
                v-for="opt in dateOptions"
                :key="opt.value"
                @click="selectDateFilter(opt.value)"
                class="w-full text-left px-4 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-primary flex items-center justify-between transition-colors"
              >
                <span>{{ opt.label }}</span>
                <Check v-if="activeDateLabel === opt.value" class="w-3.5 h-3.5 text-primary" />
              </button>
              <div class="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                <button
                  @click="selectDateFilter('Semua')"
                  class="w-full text-left px-4 py-2 text-[13px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                >
                  <RotateCw class="w-3.5 h-3.5" />
                  <span>{{ $t('df_reset_tanggal') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sort -->
        <div class="relative">
          <UTooltip :text="$t('k_urutkan')">
            <button
              @click="showSortMenu = !showSortMenu"
              class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
            >
              <ArrowUpDown class="w-4 h-4" />
            </button>
          </UTooltip>
          <div
            v-if="showSortMenu"
            @click="showSortMenu = false"
            class="fixed inset-0 z-40 bg-transparent"
          />
          <div
            v-if="showSortMenu"
            class="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <button
              v-for="opt in sortOptions"
              :key="opt.value"
              @click="selectSortOption(opt.value)"
              class="w-full text-left px-3 py-2 text-[13px] text-neutral-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
            >
              <span>{{ opt.label }}</span>
              <Check v-if="activeSortLabel === opt.value" class="w-3 h-3 text-primary" />
            </button>
          </div>
        </div>

        <!-- Download Excel -->
        <UTooltip :text="$t('k_download_excel')">
          <button
            @click="downloadExcel"
            :disabled="isExporting"
            class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors disabled:opacity-50"
          >
            <Loader2 v-if="isExporting" class="w-3.5 h-3.5 animate-spin" />
            <Download v-else class="w-3.5 h-3.5" />
          </button>
        </UTooltip>

        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

        <!-- Page Size + Pagination -->
        <div class="flex items-center gap-1">
          <div class="relative">
            <UTooltip :text="$t('k_item_per_halaman')">
              <button
                @click="showPageMenu = !showPageMenu"
                class="p-1.5 text-neutral-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-200 rounded transition-colors"
              >
                <Layers class="w-4 h-4" />
              </button>
            </UTooltip>
            <div
              v-if="showPageMenu"
              @click="showPageMenu = false"
              class="fixed inset-0 z-40 bg-transparent"
            />
            <div
              v-if="showPageMenu"
              class="absolute top-full right-0 mt-1 w-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                v-for="size in pageOptions"
                :key="size"
                @click="selectPageSize(size)"
                class="w-full text-left px-3 py-1.5 text-xs text-neutral-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary transition-colors"
                :class="{
                  'text-primary font-semibold bg-gray-50 dark:bg-gray-700': itemsPerPage === size,
                }"
              >
                {{ size }} {{ $t('km_item') }}
              </button>
            </div>
          </div>

          <div
            class="flex items-center gap-1 text-caption1 text-neutral-600 dark:text-gray-400 shrink-0 h-[34px]"
          >
            <span
              class="mx-1 font-medium hidden sm:inline whitespace-nowrap text-[12px] text-neutral-500 dark:text-gray-400"
            >
              {{ paginationInfo }}
            </span>
            <UTooltip :text="$t('sebelumnya')">
              <button
                class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent"
                @click="prevPage"
                :disabled="currentPage === 1"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
            </UTooltip>
            <UTooltip :text="$t('k_berikutnya')">
              <button
                class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-neutral-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent"
                @click="nextPage"
                :disabled="currentPage === totalPages"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </UTooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- ── MAIN CONTENT ───────────────────────────────────────────────────── -->
    <div class="flex-1 flex overflow-hidden relative w-full">
      <div
        class="flex flex-col bg-white dark:bg-gray-800 transition-all duration-300 border-r border-gray-200 dark:border-gray-700 overflow-y-auto overflow-x-hidden flex-1 w-full"
      >
        <!-- Tab Bar -->
        <div
          class="py-1.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 sticky top-0 z-10 w-full overflow-hidden"
        >
          <div class="flex gap-2 overflow-x-auto scrollbar-hide w-full py-1">
            <UButton
              v-for="tab in tabs"
              :key="tab.value"
              @click="() => { activeTab = tab.value }"
              color="primary"
              class="px-4 py-2 text-sm font-normal rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 first:ms-2 last:me-2"
              :class="
                activeTab === tab.value
                  ? 'bg-primary-400 text-white border-primary-400'
                  : 'bg-white dark:bg-gray-800 text-primary-500 dark:text-primary-400 border-neutral-200/50 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30'
              "
            >
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
              <span
                v-if="getTabCount(tab.value) > 0"
                class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                :class="
                  activeTab === tab.value
                    ? 'bg-white text-primary-500 dark:bg-gray-800 dark:text-primary-400'
                    : 'bg-primary-50 text-primary-500 dark:bg-primary-900/50 dark:text-primary-300'
                "
              >
                {{ getTabCount(tab.value) }}
              </span>
            </UButton>
          </div>
        </div>

        <!-- Search Bar (mobile only) -->
        <div class="lg:hidden px-3 py-2 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div class="relative flex items-center">
            <Search class="absolute left-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="$t('km_cari_perihal_nomor')"
              class="w-full pl-8 pr-8 py-1.5 text-[13px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <EmptyState
          v-if="displayItems.length === 0 && !pending && !isLoading"
          :icon="Inbox"
          :title="
            activeFilterType !== 'Semua' ? $t('k_filter_kosong') : $t('k_tidak_ada_data')
          "
          :description="
            activeFilterType !== 'Semua'
              ? $t('km_filter_kosong_desc')
              : $t('km_kotak_masuk_kosong')
          "
          :action-label="activeFilterType !== 'Semua' ? $t('km_reset_filter') : undefined"
          @action="applyFilter('Semua')"
          icon-wrapper-class="bg-gray-100 dark:bg-gray-700"
          icon-class="text-gray-400 dark:text-gray-500"
        />

        <!-- List -->
        <div v-else class="w-full overflow-x-auto pb-2">
          <div class="w-full min-w-full md:min-w-[800px]">
            <!-- Skeleton -->
            <div v-if="pending || isLoading" class="w-full">
              <div
                v-for="n in Math.min(itemsPerPage, 10)"
                :key="n"
                class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-3 items-center w-full min-h-[50px]"
              >
                <div class="flex items-center shrink-0 gap-2 w-full md:w-auto">
                  <div class="w-3.5 h-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div
                    class="md:hidden h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ml-2"
                  />
                </div>
                <div class="flex-1 w-full flex flex-col md:flex-row md:items-center md:gap-4">
                  <div class="md:w-44 lg:w-52 shrink-0 flex flex-col gap-1.5 mb-1 md:mb-0">
                    <div class="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div class="h-2.5 w-1/2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  </div>
                  <div class="flex-1 flex flex-wrap items-center gap-2 w-full">
                    <div class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div
                      class="h-3 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    />
                  </div>
                  <div class="hidden md:flex shrink-0 w-[50px] justify-start">
                    <div
                      class="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                    />
                  </div>
                  <div class="shrink-0 w-full md:w-[130px] md:text-right mt-1 md:mt-0">
                    <div
                      class="h-2.5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse md:ml-auto"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Mail Items -->
            <div
              v-else
              class="w-full"
              :key="`list-${activeTab}-${activeFilterType}-${currentPage}`"
            >
              <div
                v-for="mail in displayItems"
                :key="mail.id"
                @click="selectMail(mail)"
                class="group flex flex-col md:flex-row gap-3 items-start py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors relative w-full min-h-[50px]"
                :class="[
                  mail.is_priority
                    ? 'bg-red-50/60 dark:bg-red-900/20 hover:bg-red-100/60 dark:hover:bg-red-900/30 border-l-4 border-l-red-500 pl-3'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-l-transparent pl-4',
                ]"
              >
                <!-- Left Controls -->
                <div class="flex items-center shrink-0 pt-1 gap-2 w-full md:w-auto" @click.stop>
                  <div
                    class="w-3.5 h-3.5 border-[1.5px] border-neutral-300 dark:border-gray-600 rounded-sm flex items-center justify-center transition-colors"
                    :class="
                      selectedIds.has(mail.id)
                        ? 'bg-primary border-primary'
                        : 'bg-white dark:bg-gray-800'
                    "
                    @click="toggleSelection(mail.id)"
                  >
                    <Check v-if="selectedIds.has(mail.id)" class="w-3 h-3 text-white" />
                  </div>
                  <UTooltip :text="mail.isStarred ? $t('km_favorit_aktif') : $t('km_favorit_tandai')">
                    <Star
                      class="w-4 h-4 transition-colors hover:text-yellow-400 cursor-pointer"
                      :class="
                        mail.isStarred
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-neutral-300 dark:text-gray-600'
                      "
                      @click.stop="handleToggleFlag(mail, 'favorit')"
                    />
                  </UTooltip>
                  <UTooltip :text="mail.isTinjut ? $t('km_tinjut_sudah') : $t('km_tinjut_belum')">
                    <Tag
                      class="w-4 h-4 -rotate-45 transition-colors hover:text-primary-300 cursor-pointer"
                      :class="
                        mail.isTinjut
                          ? 'text-primary-500 fill-primary-500'
                          : 'text-neutral-300 dark:text-gray-600'
                      "
                    />
                  </UTooltip>
                  <!-- Badge kategori (mobile) -->
                  <UTooltip :text="getCategoryFullName(mail.category)">
                    <span
                      class="md:hidden ml-auto sm:ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                      :class="getCategoryStyle(mail.category)"
                    >
                      {{ getCategoryLabel(mail.category) }}
                    </span>
                  </UTooltip>
                </div>

                <!-- Content -->
                <div
                  class="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:gap-4 w-full"
                >
                  <div class="flex items-center md:w-44 lg:w-65 shrink-0 mb-1 md:mb-0">
                    <!-- Dot belum dibaca -->
                    <UTooltip v-if="!mail.isRead" :text="$t('k_belum_dibaca')">
                      <div
                        class="w-2 h-2 rounded-full bg-blue-600 shrink-0 mr-2"
                      />
                    </UTooltip>
                    <div class="flex flex-col min-w-0">
                      <UTooltip
                        :text="mail.fullRecipients"
                        :ui="{ content: 'h-auto py-2 px-3', text: 'whitespace-pre-line text-left' }"
                        class="min-w-0 truncate"
                      >
                        <span
                          class="block w-full md:w-48 xl:w-64 truncate text-[13px] text-neutral-900 dark:text-white shrink-0 font-semibold cursor-help"
                        >
                          {{ mail.from }}
                        </span>
                      </UTooltip>
                      <div
                        class="text-[11px] text-neutral-400 dark:text-gray-500 flex items-center gap-2 mt-0.5"
                      >
                        <span v-if="mail.category !== 'K'" class="font-mono truncate">{{ mail.nomor }}</span>
                        <span
                          v-if="mail.is_priority"
                          class="flex items-center gap-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-sm text-[9px] font-bold border border-red-200 dark:border-red-800 transition-colors"
                        >
                          <AlertTriangle class="w-3 h-3" /> {{ $t('km_prioritas_badge') }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                    <div v-if="mail.labels?.length > 0" class="flex flex-wrap gap-1 shrink-0">
                      <UTooltip
                        v-for="lbl in mail.labels"
                        :key="lbl"
                        :text="lbl"
                      >
                        <span
                          class="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 max-w-[80px] truncate cursor-help"
                        >
                          {{ lbl }}
                        </span>
                      </UTooltip>
                    </div>
                    <div
                      class="text-[13px] text-neutral-900 dark:text-white truncate flex-1 min-w-[120px]"
                      :class="!mail.isRead ? 'font-bold' : 'font-normal'"
                    >
                      {{ mail.subject }}
                    </div>
                  </div>

                  <!-- Badge kategori (desktop) -->
                  <div class="hidden md:flex shrink-0 w-[50px] justify-start items-center">
                    <UTooltip :text="getCategoryFullName(mail.category)">
                      <span
                        class="w-32 block text-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap truncate"
                        :class="getCategoryStyle(mail.category)"
                      >
                        {{ getCategoryLabel(mail.category) }}
                      </span>
                    </UTooltip>
                  </div>

                  <!-- Status Berkas -->
                  <div class="hidden md:flex shrink-0 w-[100px] justify-start items-center">
                    <span
                      v-if="berkasStatusMap[mail.naskahId]"
                      class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                    >
                      <Folder class="h-3.5 w-3.5" />
                      {{ berkasStatusMap[mail.naskahId].kode_berkas }}
                    </span>
                    <span
                      v-else
                      class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Belum
                    </span>
                  </div>

                  <div
                    class="shrink-0 pt-0.5 w-full md:w-[130px] md:text-right text-left md:pe-2 mt-1 md:mt-0"
                  >
                    <span
                      class="text-caption2b text-neutral-500 dark:text-gray-400 text-[12px] whitespace-nowrap"
                    >
                      {{ formatShortDate(mail.raw?.created_at) }}
                    </span>
                  </div>
                </div>

                <!-- Hover Quick Actions -->
                <div
                  class="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 rounded-md px-2 py-1.5 z-10 animate-in fade-in duration-200"
                >
                  <div class="flex items-center gap-2 p-1">
                    <UTooltip :text="mail.isNote ? $t('km_catatan_ada') : $t('km_catatan_tambah')">
                      <StickyNote
                        class="w-4 h-4 transition-colors hover:text-orange-500 dark:hover:text-orange-400 cursor-pointer"
                        :class="
                          mail.isNote
                            ? 'text-orange-600 fill-orange-100 dark:text-orange-400 dark:fill-orange-900/40'
                            : 'text-neutral-300 dark:text-gray-600'
                        "
                        @click.stop="handleToggleFlag(mail, 'note')"
                      />
                    </UTooltip>
                    <UTooltip :text="mail.isLocked ? $t('km_kunci_aktif') : $t('km_kunci_naskah')">
                      <Lock
                        v-if="mail.isLocked"
                        class="w-4 h-4 transition-colors text-red-600 fill-red-100 hover:text-red-600 dark:text-red-400 dark:fill-red-900/40 dark:hover:text-red-400 cursor-pointer"
                        @click.stop="handleToggleFlag(mail, 'lock')"
                      />
                      <LockOpen
                        v-else
                        class="w-4 h-4 transition-colors text-neutral-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                        @click.stop="handleToggleFlag(mail, 'lock')"
                      />
                    </UTooltip>
                    <UTooltip :text="mail.isArsip ? $t('km_arsip_aktif') : $t('km_arsip_arsipkan')">
                      <Archive
                        class="w-4 h-4 transition-colors hover:text-green-600 dark:hover:text-green-400 cursor-pointer"
                        :class="
                          mail.isArsip
                            ? 'text-green-700 fill-green-100 dark:text-green-400 dark:fill-green-900/40'
                            : 'text-neutral-300 dark:text-gray-600'
                        "
                        @click.stop="handleToggleFlag(mail, 'arsip')"
                      />
                    </UTooltip>
                    <UTooltip text="Masukkan ke Berkas">
                      <FolderPlus
                        class="w-4 h-4 transition-colors hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer"
                        :class="berkasStatusMap[mail.naskahId] ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-300 dark:text-gray-600'"
                        @click.stop="openAddToBerkasModal(mail)"
                      />
                    </UTooltip>
                    <UTooltip :text="$t('berbagi', 'Bagikan')">
                      <Share2
                        class="w-4 h-4 transition-colors hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer text-neutral-300 dark:text-gray-600"
                        @click.stop="handleShare(mail)"
                      />
                    </UTooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Share Modal -->
    <SharedShareModal
      v-if="showShareModal && shareNaskah"
      :naskah-id="shareNaskah.naskahId"
      :naskah-perihal="shareNaskah.perihal || shareNaskah.judul"
      :naskah-nomor="shareNaskah.nomor"
      @close="handleShareClose"
      @shared="handleShareClose"
    />

    <!-- Bulk Share Modal (multi-naskah) -->
    <SharedShareModal
      v-if="showBulkShareModal && bulkShareNaskahs.length"
      :naskah-items="bulkShareNaskahs"
      @close="handleBulkShareClose"
      @shared="handleBulkShareClose"
    />

    <!-- ── MODALS ─────────────────────────────────────────────────────────── -->

    <LabelAssignModal
      v-model="showLabelAssignModal"
      :selected-ids="selectedNaskahIds"
      source="inbox"
      @success="selectedIds.clear()"
    />

    <!-- Modal Masukkan ke Berkas -->
    <Teleport to="body">
      <Modal
        v-model="showAddToBerkasModal"
        size="md"
        :saving="isAddingToBerkas"
        @save="handleAddToBerkas"
      >
        <template #title>
          <div class="ml-5 mt-5 mb-2 flex items-center gap-2.5">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/40"
            >
              <UIcon name="i-lucide-folder-plus" class="size-4.5 text-primary-600 dark:text-primary-400" />
            </span>
            <Heading variant="heading9b" class="text-sm font-bold dark:text-white">
              Masukkan ke Berkas
            </Heading>
          </div>
        </template>

        <div class="space-y-4 p-1">
          <!-- Info naskah terpilih -->
          <div
            v-if="selectedNaskahForBerkas"
            class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/40"
          >
            <span
              class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-gray-800"
            >
              <UIcon name="i-lucide-file-text" class="size-4 text-primary-600 dark:text-primary-400" />
            </span>
            <div class="min-w-0">
              <p class="text-xs text-gray-500 dark:text-gray-400">Naskah</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ selectedNaskahForBerkas.subject || '-' }}
              </p>
            </div>
          </div>

          <!-- Dropdown berkas (pola data-custom-dropdown existing) -->
          <div v-if="!berkasLockedInfo">
            <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
              Pilih Berkas Aktif <span class="text-red-500">*</span>
            </Heading>
            <div class="relative mt-1" data-custom-dropdown>
              <button
                ref="berkasTriggerRef"
                type="button"
                :disabled="berkasListForModal.length === 0"
                @click.stop="toggleBerkasDropdown"
                :class="[
                  'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-200 disabled:cursor-not-allowed disabled:opacity-60',
                  !selectedBerkasId
                    ? 'border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500'
                    : 'border-gray-300 text-gray-700 dark:border-gray-600',
                ]"
              >
                <span class="truncate">{{ selectedBerkasLabel || 'Pilih berkas tujuan' }}</span>
                <UIcon
                  name="i-lucide-chevron-down"
                  class="size-4 shrink-0 text-gray-400 transition-transform duration-200"
                  :class="{ 'rotate-180': openBerkasDropdown }"
                />
              </button>
            </div>

            <!-- Panel dropdown di-teleport ke body agar tidak ter-clip overflow modal -->
            <Teleport to="body">
              <div
                v-if="openBerkasDropdown && berkasListForModal.length > 0"
                data-custom-dropdown
                class="fixed z-[10000] max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                :style="berkasPanelStyle"
              >
                <div class="border-b border-gray-100 p-2 dark:border-gray-700">
                  <div class="relative">
                    <UIcon
                      name="i-lucide-search"
                      class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      v-model="berkasSearch"
                      type="text"
                      placeholder="Cari berkas…"
                      class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:focus:bg-gray-800"
                      @click.stop
                    />
                  </div>
                </div>
                <div class="max-h-44 overflow-y-auto">
                  <button
                    v-for="b in filteredBerkasList"
                    :key="b.id"
                    type="button"
                    @click.stop="selectBerkas(b)"
                    :class="[
                      'w-full border-b border-gray-50 px-4 py-2.5 text-left text-sm transition-colors last:border-0 dark:border-gray-700',
                      selectedBerkasId === b.id
                        ? 'bg-primary/5 font-medium text-primary dark:text-primary-400'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700',
                    ]"
                  >
                    <span class="font-mono text-xs">{{ b.kodeBerkas ?? b.kode_berkas ?? '-' }}</span>
                    <span class="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
                      {{ b.judulBerkas ?? b.judul_berkas ?? '-' }}
                    </span>
                  </button>
                  <div
                    v-if="filteredBerkasList.length === 0"
                    class="px-4 py-3 text-sm text-gray-400"
                  >
                    Berkas tidak ditemukan.
                  </div>
                </div>
              </div>
            </Teleport>
            <p v-if="berkasListForModal.length === 0" class="mt-2 text-xs text-gray-400">
              Tidak ada berkas aktif. Buat berkas baru di halaman Pemberkasan.
            </p>
          </div>

          <!-- Naskah terkunci di berkas tertutup -->
          <div v-else class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <UIcon name="i-lucide-lock" class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div class="min-w-0">
              <p class="text-sm font-medium text-amber-800 dark:text-amber-200">
                Naskah tidak bisa dipindahkan
              </p>
              <p class="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                Naskah sudah berada di berkas
                <span class="font-semibold">{{ berkasLockedInfo.kode_berkas }}</span>
                yang berstatus {{ berkasLockedInfo.berkas_status === 'closed_retensi_aktif' ? 'Tertutup' : 'Retensi Inaktif' }}.
                Arsip yang sudah ditutup tidak dapat dipindah ke berkas lain.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Modal Konfirmasi Arsip / Unarsip Bulk -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800 transition-colors"
        >
          <div class="p-5 text-center">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              :class="
                isUnarchiveMode
                  ? 'bg-orange-100 dark:bg-orange-900/30'
                  : 'bg-blue-100 dark:bg-blue-900/30'
              "
            >
              <Archive
                class="w-6 h-6"
                :class="
                  isUnarchiveMode
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-blue-600 dark:text-blue-400'
                "
              />
            </div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {{ isUnarchiveMode ? $t('km_keluarkan_dari_arsip') : $t('km_arsipkan_surat') }}
            </h3>
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              <div v-if="selectedIds.size === 1 && firstSelectedItem">
                {{ $t('km_apakah_anda_yakin_ingin') }}
                {{ isUnarchiveMode ? $t('km_mengeluarkan') : $t('km_mengarsipkan') }} <br />
                <span class="font-semibold text-gray-700 dark:text-gray-200"
                  >"{{ firstSelectedItem.subject }}"</span
                >?
              </div>
              <div v-else>
                {{ $t('km_apakah_anda_yakin_ingin') }}
                {{ isUnarchiveMode ? $t('km_mengeluarkan') : $t('km_mengarsipkan') }} <br />
                <span class="font-bold text-gray-800 dark:text-gray-200"
                  >{{ selectedIds.size }} {{ $t('km_item_terpilih') }}</span
                >?
              </div>
            </div>
            <div class="flex gap-3 justify-center">
              <button
                @click="showDeleteModal = false"
                :disabled="isDeleting"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {{ $t('k_batal') }}
              </button>
              <button
                @click="handleBulkExecute"
                :disabled="isDeleting"
                class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="
                  isUnarchiveMode
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-primary hover:bg-primary-600'
                "
              >
                <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
                {{ isDeleting ? $t('km_memproses') : isUnarchiveMode ? $t('km_keluarkan') : $t('k_arsipkan') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Note Modal -->
    <Teleport to="body">
      <div
        v-if="showNoteModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800"
        >
          <div
            class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700"
          >
            <div class="flex items-center gap-2">
              <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <StickyNote class="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white">{{ $t('km_catatan_surat') }}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('km_tambah_atau_edit_catatan') }}</p>
              </div>
            </div>
            <button
              @click="showNoteModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-5">
            <textarea
              v-model="noteModalText"
              rows="5"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400 dark:text-white"
              :placeholder="$t('km_tulis_catatan')"
            ></textarea>
          </div>
          <div
            class="flex justify-between gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-700"
          >
            <button
              v-if="noteModalMail?.isNote"
              @click="removeNoteFromList"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 transition-colors"
            >
              {{ $t('km_hapus_catatan') }}
            </button>
            <div class="flex gap-3 ml-auto">
              <button
                @click="showNoteModal = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {{ $t('k_batal') }}
              </button>
              <button
                @click="saveNoteFromList"
                :disabled="isSavingNote"
                class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                <Loader2 v-if="isSavingNote" class="w-4 h-4 animate-spin" />
                {{ isSavingNote ? $t('km_menyimpan') : $t('k_simpan') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
  </div>
</template>

<style scoped>
* {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
