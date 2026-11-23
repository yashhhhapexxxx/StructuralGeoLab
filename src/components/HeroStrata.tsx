import { useEffect, useRef } from "react";
import { BED_COLORS } from "@/geo/beds";

/**
 * Hero band: a stack of strata that slowly folds into an anticline–syncline pair and is then
 * cut by a normal fault that slips — looping. Pure SVG; paths are rewritten each frame by
 * direct DOM updates (no React re-render), and the loop pauses when off screen.
 */
export function HeroStrata({ className = "" }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 1200;
  const H = 300;
  const N = 6;
  const T = 34;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const fw = Array.from(svg.querySelectorAll<SVGPathElement>("[data-fw]"));
    const hw = Array.from(svg.querySelectorAll<SVGPathElement>("[data-hw]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    const t0 = performance.now();

    const band = (k: number, amp: number, dx: number, dy: number) => {
      const y = (x: number, j: number) => 70 + (k + j) * T - amp * Math.cos(((x - 420) * 2 * Math.PI) / 760) + dy;
      let d = "";
      for (let x = -40; x <= W + 40; x += 20) d += `${d ? "L" : "M"}${x + dx} ${y(x, 0).toFixed(1)} `;
      for (let x = W + 40; x >= -40; x -= 20) d += `L${x + dx} ${y(x, 1).toFixed(1)} `;
      return d + "Z";
    };

    const draw = (now: number) => {
      const t = ((now - t0) / 1000) % 12; // 12 s cycle
      const fold = reduce ? 1 : Math.min(1, t / 5) * (t < 11 ? 1 : 1 - (t - 11));
      const slip = reduce ? 0.6 : Math.max(0, Math.min(1, (t - 5.5) / 3)) * (t < 11 ? 1 : 1 - (t - 11));
      const amp = 62 * (1 - Math.pow(1 - fold, 3));
      const s = 46 * slip;
      for (let k = 0; k < N; k++) {
        fw[k]?.setAttribute("d", band(k, amp, 0, 0));
        hw[k]?.setAttribute("d", band(k, amp, s * 0.42, s * 0.9));
      }
      if (visible && !reduce) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(draw);
      if (!visible && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(svg);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  // Fault from (840, 0) dipping right ~65°
  const fault = { x1: 800, y1: 20, x2: 920, y2: 300 };
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <defs>
        <clipPath id="hs-fw">
          <path d={`M -100 -100 L ${fault.x1 - 8.6} -100 L ${fault.x2 + 8.6} ${H + 100} L -100 ${H + 100} Z`} />
        </clipPath>
        <clipPath id="hs-hw">
          <path d={`M ${fault.x1 - 8.6} -100 L ${W + 100} -100 L ${W + 100} ${H + 100} L ${fault.x2 + 8.6} ${H + 100} Z`} />
        </clipPath>
        <linearGradient id="hs-fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0b0f0c" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="#0b0f0c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath="url(#hs-fw)">
        {Array.from({ length: N }).map((_, k) => (
          <path key={k} data-fw="" fill={BED_COLORS[k % BED_COLORS.length]} stroke="#0b0f0c" strokeOpacity="0.4" />
        ))}
      </g>
      <g clipPath="url(#hs-hw)">
        {Array.from({ length: N }).map((_, k) => (
          <path key={k} data-hw="" fill={BED_COLORS[k % BED_COLORS.length]} stroke="#0b0f0c" strokeOpacity="0.4" />
        ))}
      </g>
      <line {...fault} x1={fault.x1 - 20} y1={fault.y1 - 46} stroke="#fff" strokeWidth="3" strokeOpacity="0.85" />
      <rect width={W} height={H} fill="url(#hs-fade)" />
    </svg>
  );
}

export default HeroStrata;
