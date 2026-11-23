import { useMemo, useState } from "react";
import { Readout, SimFrame, Slider, Toggle, Verdict } from "@/components/sim-ui";
import { analyseWell, drillWell, faultX, hangingWallShift, type Bed, type FaultLine } from "@/geo/faults";
import { BED_COLORS, BED_LETTERS, BED_NAMES } from "@/geo/beds";
import { cn } from "@/lib/utils";

const W = 800;
const H = 460;
const SECTION_W = 640; // log column lives to the right
const SURFACE = 50;
const BED_T = 50;
const N_BEDS = 7;
const M_PER_PX = 2;

const BEDS: Bed[] = Array.from({ length: N_BEDS }, (_, i) => ({
  id: BED_LETTERS[i],
  name: BED_NAMES[i],
  color: BED_COLORS[i],
  top: SURFACE + i * BED_T,
  base: SURFACE + (i + 1) * BED_T,
}));

type Kind = "normal" | "reverse";

/**
 * Sim 7.1 — Drill the well (Fossen "Faults" e-module: stratigraphic separation in wells).
 * Normal fault: well steeper than fault → missing section; fault steeper than well → repeated.
 * Reverse fault: well steeper than fault → repeated; well shallower than fault → missing.
 */
export function WellLab() {
  const [kind, setKind] = useState<Kind>("normal");
  const [dip, setDip] = useState(60);
  const [throwPx, setThrowPx] = useState(55);
  const [wellX, setWellX] = useState(380);
  const [incl, setIncl] = useState(0);

  const fault: FaultLine = { x0: 300, y0: SURFACE, dip };
  const slip = (kind === "normal" ? 1 : -1) * (throwPx / Math.sin((dip * Math.PI) / 180));
  const { dx, dy } = hangingWallShift(dip, slip);

  const wellLen = 560;
  const res = useMemo(
    () => drillWell(BEDS, fault, slip, { x: wellX, y: SURFACE - 30, incl, length: wellLen }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dip, slip, wellX, incl],
  );
  const analysis = analyseWell(BEDS, res);

  // Well path drawn until it leaves the section.
  const r = (incl * Math.PI) / 180;
  const wx2 = wellX + Math.sin(r) * wellLen;
  const wy2 = SURFACE - 30 + Math.cos(r) * wellLen;

  const fx = (y: number) => faultX(fault, y);
  const yTop = -400;
  const yBot = H + 400;
  const fwClip = `M -10 ${yTop} L ${fx(yTop)} ${yTop} L ${fx(yBot)} ${yBot} L -10 ${yBot} Z`;
  const hwClip = `M ${fx(yTop)} ${yTop} L ${SECTION_W} ${yTop} L ${SECTION_W} ${yBot} L ${fx(yBot)} ${yBot} Z`;
  const stack = BEDS.map((b) => (
    <g key={b.id}>
      <rect x={-300} y={b.top} width={SECTION_W + 600} height={BED_T} fill={b.color} stroke="#0b0f0c" strokeOpacity="0.35" />
      <text x={20} y={b.top + BED_T / 2 + 5} fontSize="15" fill="#0b0f0c" fontWeight="700">
        {b.id}
      </text>
    </g>
  ));

  // Well path angle from horizontal vs fault dip — the e-module's comparison.
  const wellDipFromHorizontal = 90 - Math.abs(incl);
  const steeperThanFault = wellDipFromHorizontal > dip;
  const cases = [
    { k: "normal", steeper: true, out: "Missing section" },
    { k: "normal", steeper: false, out: "Repeated section" },
    { k: "reverse", steeper: true, out: "Repeated section" },
    { k: "reverse", steeper: false, out: "Missing section" },
  ];

  // Log column geometry
  const logTop = 30;
  const logScale = (H - 60) / wellLen;

  const verdict =
    res.jumps.length === 0
      ? "Well misses the fault"
      : analysis.kind === "none"
        ? "No separation"
        : `${analysis.kind === "missing" ? "Missing" : "Repeated"} section`;

  return (
    <SimFrame
      title="Drill the well"
      subtitle="Repeated or missing section?"
      controls={
        <>
          <Toggle label="Fault type" value={kind} onChange={setKind} options={[{ value: "normal", label: "Normal" }, { value: "reverse", label: "Reverse" }]} />
          <Slider label="Fault dip" value={dip} min={20} max={85} onChange={setDip} format={(v) => `${v}°`} />
          <Slider label="Throw" value={throwPx} min={10} max={120} onChange={setThrowPx} format={(v) => `${v * M_PER_PX} m`} />
          <Slider label="Well position" value={wellX} min={40} max={600} onChange={setWellX} />
          <Slider
            label="Well deviation"
            value={incl}
            min={-75}
            max={75}
            onChange={setIncl}
            format={(v) => (v === 0 ? "vertical" : `${Math.abs(v)}° ${v > 0 ? "→" : "←"}`)}
          />
          <div className="rounded-2xl border border-line p-3 text-[13px]">
            <p className="mb-1.5 font-display text-xs uppercase tracking-[0.2em] text-lichen">The four cases</p>
            {cases.map((c) => {
              const active = c.k === kind && c.steeper === steeperThanFault && res.jumps.length > 0;
              return (
                <p key={`${c.k}${c.steeper}`} className={cn("rounded px-1.5 py-0.5", active ? "bg-moss/25 text-ink" : "text-muted")}>
                  {c.k} · well {c.steeper ? "steeper" : "shallower"} than fault → <b>{c.out}</b>
                </p>
              );
            })}
          </div>
        </>
      }
      readouts={
        <>
          <Readout label="Result" value={verdict} accent />
          <Readout label="Thickness" value={analysis.kind === "none" ? "—" : `${(analysis.thickness * M_PER_PX).toFixed(0)} m`} />
          <Readout label="Units affected" value={analysis.beds.length ? analysis.beds.join(", ") : "—"} />
          <Readout label="Well vs fault" value={`${wellDipFromHorizontal.toFixed(0)}° vs ${dip}°`} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`Well through a ${kind} fault: ${verdict}`}>
        <defs>
          <clipPath id="wl-fw">
            <path d={fwClip} />
          </clipPath>
          <clipPath id="wl-hw">
            <path d={hwClip} />
          </clipPath>
          <clipPath id="wl-sec">
            <rect x="0" y="0" width={SECTION_W} height={H} />
          </clipPath>
        </defs>
        <rect width={W} height={H} fill="#0d130f" />
        <g clipPath="url(#wl-sec)">
          <g clipPath="url(#wl-fw)">{stack}</g>
          <g clipPath="url(#wl-hw)">
            <g transform={`translate(${dx} ${dy})`}>{stack}</g>
          </g>
          <line x1={fx(-50)} y1={-50} x2={fx(H + 50)} y2={H + 50} stroke="#fff" strokeWidth="3" />
          {/* derrick + well path */}
          <path d={`M ${wellX - 12} ${SURFACE - 30} L ${wellX} ${SURFACE - 58} L ${wellX + 12} ${SURFACE - 30} Z`} fill="none" stroke="#fff" strokeWidth="2" />
          <line x1={wellX} y1={SURFACE - 30} x2={wx2} y2={wy2} stroke="#0b0f0c" strokeWidth="7" />
          <line x1={wellX} y1={SURFACE - 30} x2={wx2} y2={wy2} stroke="#fff" strokeWidth="3" strokeDasharray="10 6" />
          {res.jumps.map((j) => (
            <circle key={j.md} cx={wellX + Math.sin(r) * j.md} cy={SURFACE - 30 + Math.cos(r) * j.md} r="9" fill="none" stroke="#c8703f" strokeWidth="3" />
          ))}
        </g>

        {/* Well log column */}
        <g>
          <text x={SECTION_W + 80} y={20} textAnchor="middle" className="font-display" fontSize="16" fill="#eef1ea">
            WELL LOG
          </text>
          <rect x={SECTION_W + 50} y={logTop} width="60" height={wellLen * logScale} fill="#1a221c" stroke="#fff" strokeOpacity="0.2" />
          {res.log.map((e, i) => (
            <g key={i}>
              <rect x={SECTION_W + 50} y={logTop + e.from * logScale} width="60" height={Math.max(1, (e.to - e.from) * logScale)} fill={e.bed.color} />
              {(e.to - e.from) * logScale > 12 && (
                <text x={SECTION_W + 80} y={logTop + ((e.from + e.to) / 2) * logScale + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0b0f0c">
                  {e.bed.id}
                </text>
              )}
            </g>
          ))}
          {res.jumps.map((j) => (
            <g key={`j${j.md}`}>
              <line x1={SECTION_W + 40} x2={SECTION_W + 120} y1={logTop + j.md * logScale} y2={logTop + j.md * logScale} stroke="#c8703f" strokeWidth="2.5" />
              <text x={SECTION_W + 124} y={logTop + j.md * logScale + 4} fontSize="11" fill="#f0a57c">
                fault
              </text>
            </g>
          ))}
        </g>
      </svg>
      <Verdict tone={analysis.kind === "missing" ? "clay" : analysis.kind === "repeated" ? "moss" : "sand"}>{verdict}</Verdict>
    </SimFrame>
  );
}

export default WellLab;
