export const getSortedLabels = (labels) => {
  if (!labels || labels.length === 0) return [];

  const map = {};
  const roots = [];
  const result = [];

  // 1. Inisialisasi Map
  // Kita clone object dengan {...label} agar data asli tidak termutasi
  labels.forEach((label) => {
    map[label.id] = { ...label, children: [], level: 0 };
  });

  // 2. Susun Hubungan Parent -> Child
  labels.forEach((label) => {
    // PENTING: Cek semua kemungkinan nama field dari backend/frontend
    // Backend Anda menggunakan 'idParent'
    const pid = label.idParent || label.parentId || label.parent_id;

    // Logika: Jika punya Parent ID DAN Parent-nya ada di data map
    if (pid && map[pid] && pid !== label.id) {
      map[pid].children.push(map[label.id]);
    } else {
      // Jika tidak punya parent (atau parent tidak ditemukan), masukkan ke Root
      roots.push(map[label.id]);
    }
  });

  // 3. Ratakan Array (Flatten) secara Rekursif untuk memberi Level
  const traverse = (nodes, currentLevel) => {
    // Opsional: Urutkan abjad per level
    nodes.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));

    nodes.forEach((node) => {
      node.level = currentLevel; // Set level kedalaman (0, 1, 2...)
      result.push(node); // Masukkan ke array hasil urut

      // Jika punya anak, proses anaknya dengan level + 1
      if (node.children.length > 0) {
        traverse(node.children, currentLevel + 1);
      }
    });
  };

  traverse(roots, 0);
  return result;
};
