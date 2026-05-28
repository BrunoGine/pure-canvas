import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const dragEnabledRef = useRef(true);
  const [dragEnabled, setDragEnabled] = useState(true);
  const activeIndexRef = useRef(activeIndex);
  const count = children.length;

  activeIndexRef.current = activeIndex;

  // Measure synchronously to avoid a 0-width first paint flash.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const apply = (w: number) => {
      if (!w) return;
      setWidth(w);
      // If not mid-drag, snap x to the current active slot immediately (no animation),
      // so the correct page is visible on first paint and after layout changes.
      if (!draggingRef.current) {
        x.set(-activeIndexRef.current * w);
      }
    };
    apply(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      apply(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate when activeIndex changes externally (BottomNav click, etc.)
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

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    draggingRef.current = false;
    setDragging(false);
    if (!width) return;
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const threshold = Math.min(80, width * 0.22);
    let next = activeIndex;
    if (offset < -threshold || velocity < -500) next = Math.min(count - 1, activeIndex + 1);
    else if (offset > threshold || velocity > 500) next = Math.max(0, activeIndex - 1);

    animate(x, -next * width, SPRING);
    if (next !== activeIndex) onIndexChange(next);
    // re-enable drag for next gesture in case it was disabled on pointerdown
    dragEnabledRef.current = true;
    setDragEnabled(true);
  };

  // Disable drag entirely when the finger lands on a no-swipe / horizontally-scrollable element.
  // We re-enable on pointerup.
  const handlePointerDown = (e: React.PointerEvent) => {
    let el = e.target as HTMLElement | null;
    let blocked = false;
    while (el && el !== e.currentTarget) {
      if (el.dataset?.noSwipe !== undefined || el.closest?.("[data-no-swipe]")) {
        blocked = true;
        break;
      }
      const style = getComputedStyle(el);
      const ox = style.overflowX;
      if ((ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth) {
        blocked = true;
        break;
      }
      el = el.parentElement;
    }
    if (blocked) {
      dragEnabledRef.current = false;
      setDragEnabled(false);
    } else if (!dragEnabledRef.current) {
      dragEnabledRef.current = true;
      setDragEnabled(true);
    }
  };

  const handlePointerUp = () => {
    if (!draggingRef.current && !dragEnabledRef.current) {
      dragEnabledRef.current = true;
      setDragEnabled(true);
    }
  };

  // Use pixel-based widths (not %) so we never get a 0-width collapsed first paint.
  const trackWidth = width ? count * width : undefined;
  const slotWidth = width || undefined;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ touchAction: "pan-y" }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <motion.div
        className="flex"
        style={{
          x,
          width: trackWidth ?? "100%",
          willChange: "transform",
        }}
        drag={dragEnabled && width ? "x" : false}
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
            style={{
              width: slotWidth ?? "100%",
              pointerEvents: dragging && i !== activeIndex ? "none" : undefined,
            }}
            aria-hidden={i !== activeIndex}
          >
            {child}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default SwipePager;
