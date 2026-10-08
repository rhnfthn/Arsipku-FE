import type { Ref } from 'vue';

interface MinimapNode {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

export const useOrganizationMinimap = (
  chart: Ref<HTMLElement | null>,
  viewport: Ref<HTMLElement | null>
) => {
  const map = shallowRef({
    width: 1,
    height: 1,
    nodes: [] as MinimapNode[],
    edges: [] as string[],
    view: { x: 0, y: 0, width: 1, height: 1 },
  });
  let frame: number | null = null;
  let observer: ResizeObserver | null = null;
  let offset = { x: 0, y: 0 };
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const visibleArea = (width: number, height: number) => {
    const scroller = viewport.value;
    if (!scroller) return { x: 0, y: 0, width: 0, height: 0 };
    const startX = scroller.scrollLeft - offset.x;
    const startY = scroller.scrollTop - offset.y;
    const x = clamp(startX, 0, width);
    const y = clamp(startY, 0, height);
    return {
      x,
      y,
      width: clamp(startX + scroller.clientWidth, 0, width) - x,
      height: clamp(startY + scroller.clientHeight, 0, height) - y,
    };
  };

  const measure = () => {
    const surface = chart.value;
    const scroller = viewport.value;
    if (!surface || !scroller) return;
    const bounds = surface.getBoundingClientRect();
    const viewportBounds = scroller.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    offset = {
      x: bounds.left - viewportBounds.left - scroller.clientLeft + scroller.scrollLeft,
      y: bounds.top - viewportBounds.top - scroller.clientTop + scroller.scrollTop,
    };
    const elements = [...surface.querySelectorAll<HTMLElement>('[data-chart-node-type]')];
    const boxes = new Map<Element, MinimapNode>();
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      boxes.set(element, {
        x: rect.left - bounds.left,
        y: rect.top - bounds.top,
        width: rect.width,
        height: rect.height,
        type: element.dataset.chartNodeType || 'unit',
      });
    }
    const company = elements.find((element) => element.dataset.chartNodeType === 'company');
    const edges: string[] = [];
    for (const element of elements) {
      if (element === company) continue;
      const branch = element.closest('li.structure-branch');
      const parentBranch = branch?.parentElement?.closest('li.structure-branch');
      const parent = parentBranch?.querySelector('[data-chart-node-type]') || company;
      const from = parent && boxes.get(parent);
      const to = boxes.get(element);
      if (!from || !to) continue;
      const startX = from.x + from.width / 2;
      const startY = from.y + from.height;
      const endX = to.x + to.width / 2;
      const middleY = (startY + to.y) / 2;
      edges.push(`M ${startX} ${startY} V ${middleY} H ${endX} V ${to.y}`);
    }
    map.value = {
      width: bounds.width,
      height: bounds.height,
      nodes: [...boxes.values()],
      edges,
      view: visibleArea(bounds.width, bounds.height),
    };
  };
  const refresh = () => {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      measure();
    });
  };
  const syncViewport = () => {
    const scroller = viewport.value;
    if (!scroller) return;
    map.value = {
      ...map.value,
      view: visibleArea(map.value.width, map.value.height),
    };
  };
  const navigate = (event: PointerEvent) => {
    const svg = event.currentTarget as SVGSVGElement;
    const matrix = svg.getScreenCTM();
    const scroller = viewport.value;
    if (!matrix || !scroller) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const target = point.matrixTransform(matrix.inverse());
    scroller.scrollTo({
      left: clamp(
        target.x + offset.x - scroller.clientWidth / 2,
        0,
        scroller.scrollWidth - scroller.clientWidth
      ),
      top: clamp(
        target.y + offset.y - scroller.clientHeight / 2,
        0,
        scroller.scrollHeight - scroller.clientHeight
      ),
      behavior: 'instant',
    });
    syncViewport();
  };
  const navigateByKeyboard = (event: KeyboardEvent) => {
    const scroller = viewport.value;
    if (!scroller || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key))
      return;
    event.preventDefault();
    scroller.scrollBy({
      left:
        event.key === 'ArrowLeft'
          ? -scroller.clientWidth / 2
          : event.key === 'ArrowRight'
            ? scroller.clientWidth / 2
            : 0,
      top:
        event.key === 'ArrowUp'
          ? -scroller.clientHeight / 2
          : event.key === 'ArrowDown'
            ? scroller.clientHeight / 2
            : 0,
      behavior: 'instant',
    });
    syncViewport();
  };
  onMounted(() => {
    observer = new ResizeObserver(refresh);
    if (chart.value) observer.observe(chart.value);
    if (viewport.value) observer.observe(viewport.value);
    refresh();
  });
  onBeforeUnmount(() => {
    observer?.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
  });
  return { map, refresh, syncViewport, navigate, navigateByKeyboard };
};
