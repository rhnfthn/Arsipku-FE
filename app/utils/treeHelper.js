export const buildLabelTree = (items) => {
  if (!items || items.length === 0) return [];

  const map = {};
  const roots = [];

  // 1. Init map
  items.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });

  // 2. Build tree
  items.forEach((item) => {
    const pid =
      item.idParent !== null && item.idParent !== undefined
        ? Number(item.idParent)
        : item.parentId !== null && item.parentId !== undefined
          ? Number(item.parentId)
          : item.parent_id !== null && item.parent_id !== undefined
            ? Number(item.parent_id)
            : null;

    if (pid !== null && map[pid]) {
      map[pid].children.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });

  // 3. Sort recursive
  const sortRecursive = (nodes) => {
    nodes.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
    nodes.forEach((node) => {
      if (node.children.length) sortRecursive(node.children);
    });
  };

  sortRecursive(roots);
  return roots;
};
