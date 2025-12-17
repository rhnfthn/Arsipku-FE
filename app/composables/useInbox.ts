// ~/composables/useInbox.ts
import { ref, watch, isRef } from 'vue'
import { useApi } from '~/composables/useApi'

export function useInbox(positionId: any) {
  const { apiGet } = useApi()

  const items = ref<any[]>([])
  const pending = ref(false)
  const error = ref<any>(null)

  const fetchInbox = async (id: string | null) => {
    if (!id) {
      items.value = []
      return
    }

    pending.value = true
    error.value = null

    try {
      const res = await apiGet(
        `/naskah_sirkulasi/inbox/${encodeURIComponent(id)}`
      )

      const rawItems = res?.data?.items || []

      items.value = rawItems.map((it: any) => ({
        id: it.id_sirkulasi,
        naskahId: it.id_naskah,

        category: it.jenis,
        category_label: it.jenis_label,
        nomor: it.nomor,
        tanggal: it.tanggal,

        subject: (it.perihal || it.nomor || '').toString().trim(),
        note: (it.perihal || '').toString().trim(),
        body: (it.body || it.isi || it.perihal || '').toString().trim(),

        sifat: it.sifat,
        status: it.status,
        lampiran: it.lampiran,

        // pengirim
        from: it.pengirim?.nama || '-',
        pengirim: it.pengirim,

        // penerima
        recipientName: it.penerima?.nama || '-',
        recipient: it.penerima,

        // flags
        isRead: it.status_baca === 'sudah_dibaca',
        read_time: it.read_time,
        isStarred: it.is_favorit,
        isFavorit: it.is_favorit,
        isArsip: it.is_arsip,
        isNote: it.is_note,

        raw: it
      }))
    } catch (err) {
      console.error('useInbox error:', err)
      error.value = err
      items.value = []
    } finally {
      pending.value = false
    }
  }

  // 🔁 auto fetch kalau positionId ref
  if (isRef(positionId)) {
    watch(positionId, (newId) => fetchInbox(newId), { immediate: true })
  }

  const refresh = () => {
    const id = isRef(positionId) ? positionId.value : positionId
    return fetchInbox(id)
  }

  return { items, pending, error, refresh }
}
