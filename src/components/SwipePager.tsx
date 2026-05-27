import { ReactNode, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate, PanInfo } from "framer-motion";

interface Props {
  activeIndex: number;
  onIndexChange: (idx: number) => void;
  children: ReactNode[];
}

const SPRING = { type: "spring" as const, stiffness: 320, damping: 34, mass: 0.9 };

const SwipePager = ({ activeIndex, onIndexChange, children }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const count = children.length;

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animate to active index when route changes (and not currently dragging)
  useEffect(() => {
    if (!width) return;
    if (draggingRef.current) return;
    const target = -activeIndex * width;
    const controls = animate(x, target, SPRING);
    return () => controls.stop();
  }, [activeIndex, width, x]);

  const handleDragStart = () => {
    draggingRef.current = true;
    setDragging(true);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    draggingRef.current = false;
    setDragging(false);
    if (!width) return;
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const threshold = Math.min(80, width * 0.22);
    let next = activeIndex;
    if (offset < -threshold || velocity < -500) next = Math.min(count - 1, activeIndex + 1);
    else if (offset > threshold || velocity > 500) next = Math.max(0, activeIndex - 1);

    const target = -next * width;
    animate(x, target, SPRING);
    if (next !== activeIndex) onIndexChange(next);
  };

  // Block drag start when finger lands on horizontally scrollable / no-swipe elements
  const handlePointerDownCapture = (e: React.PointerEvent) => {
    let el = e.target as HTMLElement | null;
    while (el && el !== e.currentTarget) {
      if (el.hasAttribute && el.closest?.("[data-no-swipe]")) return;
      if (el.scrollWidth > el.clientWidth && getComputedStyle(el).overflowX !== "visible") return;
      el = el.parentElement;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ touchAction: "pan-y" }}
      onPointerDownCapture={handlePointerDownCapture}
    >
      <motion.div
        className="flex"
        style={{ x, width: `${count * 100}%`, willChange: "transform" }}
        drag="x"
        dragDirectionLock
        dragElastic={0.18}
        dragMomentum={false}
        dragConstraints={{ left: -(count - 1) * width, right: 0 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="shrink-0"
            style={{ width: `${100 / count}%` }}
            aria-hidden={i !== activeIndex}
            // Block clicks on non-active slots while dragging
            inert={dragging && i !== activeIndex ? "" as any : undefined}
          >
            {child}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default SwipePager;
