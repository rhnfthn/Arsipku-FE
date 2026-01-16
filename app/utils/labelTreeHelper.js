// utils/labelTreeHelper.js

/**
 * Mengubah array label datar menjadi array linear yang terurut secara hierarki (DFS)
 * dan menambahkan properti 'level' untuk indentasi UI.
 */
export const buildFlatLabelTree = (labels) => {
  if (!labels || labels.length === 0) return [];

  const map = {};
  const roots = [];

  // 1. Inisialisasi Map
  labels.forEach((label) => {
    // Pastikan membuat copy object agar tidak memutasi state asli
    map[label.id] = { ...label, children: [], level: 0 };
  });

  // 2. Susun Tree (Assign anak ke parent)
  labels.forEach((label) => {
    if (label.parent_id && map[label.parent_id]) {
      map[label.parent_id].children.push(map[label.id]);
    } else {
      roots.push(map[label.id]); // Ini adalah Root (Induk Utama)
    }
  });

  // 3. Ratakan kembali menjadi array tunggal untuk v-for (Depth-First Search)
  const flatList = [];

  const traverse = (nodes, level) => {
    // Urutkan berdasarkan nama agar rapi
    nodes.sort((a, b) => a.nama.localeCompare(b.nama));

    nodes.forEach((node) => {
      node.level = level; // Set kedalaman
      flatList.push(node);

      if (node.children.length > 0) {
        traverse(node.children, level + 1); // Rekursif ke anak
      }
    });
  };

  traverse(roots, 0);
  return flatList;
};
