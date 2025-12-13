// ~/composables/useInbox.ts
import { ref, watch, isRef } from 'vue'

export function useInbox(positionId) {
  const items = ref([])
  const pending = ref(false)
  const error = ref(null)

  const fetchInbox = async (id) => {
    if (!id) {
      items.value = []
      return
    }
    pending.value = true
    error.value = null

    try {
      const token = (typeof window !== 'undefined')
        ? localStorage.getItem('token')
        : null

      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const res = await $fetch(
        `http://172.20.16.115:3011/naskah_sirkulasi/inbox/${encodeURIComponent(id)}`,
        { method: 'GET', headers }
      )

      const rawItems = res?.data?.items || []

items.value = rawItems.map(it => ({
  id: it.id_sirkulasi,
  naskahId: it.id_naskah,
  category: it.jenis,                  // ND, SDI, SDE, DI, KA
  category_label: it.jenis_label,      // “Nota Dinas”
  nomor: it.nomor,
  tanggal: it.tanggal,
  // subject tetap untuk daftar singkat
  subject: (it.perihal || it.nomor || '').toString().trim(),

  // --- tambahan untuk template detail ---
  // Catatan yang Anda minta: ambil dari perihal
  note: (it.perihal || '').toString().trim(),

  // body: kalau nanti mau isi lengkap (fallback ke perihal)
  body: (it.body || it.isi || it.perihal || '').toString().trim(),

  sifat: it.sifat,
  status: it.status,
  lampiran: it.lampiran,

  // PENGIRIM
  from: it.pengirim?.nama || "-",
  pengirim: it.pengirim,

  // STATUS
  isRead: it.status_baca === "sudah_dibaca",
  read_time: it.read_time,
  isStarred: it.is_favorit,
  isFavorit: it.is_favorit,
  isArsip: it.is_arsip,
  isNote: it.is_note,

    // PENERIMA (kepada user yang login)
  recipientName: it.penerima?.nama || "-",
  recipient: it.penerima,

  raw: it
}))
    } catch (err) {
      console.error("useInbox error:", err)
      error.value = err
      items.value = []
    } finally {
      pending.value = false
    }
  }

if (isRef(positionId)) {
  watch(positionId, (newId) => fetchInbox(newId), { immediate: true })
}

  const refresh = () => {
    const id = isRef(positionId) ? positionId.value : positionId
    return fetchInbox(id)
  }

  return { items, pending, error, refresh }
}
