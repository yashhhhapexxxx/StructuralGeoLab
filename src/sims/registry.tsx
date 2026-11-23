import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import type { SimKey } from "@/content/levels";

/** Every simulation is its own lazy chunk, so a lesson only downloads what it shows. */
const SIMS: Record<SimKey, LazyExoticComponent<ComponentType>> = {
  WayUp: lazy(() => import("./WayUp")),
  StrainEllipse: lazy(() => import("./StrainEllipse")),
  FoldAnatomy: lazy(() => import("@/sims3d/FoldBlock3D")),
  FoldSymmetryLab: lazy(() => import("./FoldSymmetryLab")),
  ParasiticFolds: lazy(() => import("./ParasiticFolds")),
  BucklingLab: lazy(() => import("./BucklingLab")),
  FoldMechanisms: lazy(() => import("./FoldMechanisms")),
  FaultSection: lazy(() => import("./FaultSection")),
  StrikeSlipMap: lazy(() => import("./StrikeSlipMap")),
  WellLab: lazy(() => import("./WellLab")),
  SortStructures: lazy(() => import("./SortStructures")),
  StrikeDip3D: lazy(() => import("@/sims3d/StrikeDip3D")),
  StructureContours3D: lazy(() => import("@/sims3d/StructureContours3D")),
  RuleOfV3D: lazy(() => import("@/sims3d/RuleOfV3D")),
  CrossSectionBuilder: lazy(() => import("./CrossSectionBuilder")),
  TrueThickness: lazy(() => import("./TrueThickness")),
  Fault3D: lazy(() => import("@/sims3d/Fault3D")),
  RiftBuilder: lazy(() => import("./RiftBuilder")),
  FaultDrag: lazy(() => import("./FaultDrag")),
  TrishearFold: lazy(() => import("./TrishearFold")),
  FaultGrowth: lazy(() => import("./FaultGrowth")),
  WingCracks: lazy(() => import("./WingCracks")),
  FaultZone: lazy(() => import("./FaultZone")),
  MohrAnderson: lazy(() => import("./MohrAnderson")),
  SyntheticAntithetic: lazy(() => import("./SyntheticAntithetic")),
  AnticlineSyncline: lazy(() => import("./AnticlineSyncline")),
};

export const SIM_TITLES: Record<SimKey, string> = {
  WayUp: "Which way is up?",
  StrainEllipse: "Strain ellipse",
  FoldAnatomy: "Fold anatomy (3D)",
  FoldSymmetryLab: "Symmetry lab",
  ParasiticFolds: "Parasitic folds: S, Z & M",
  BucklingLab: "Buckling lab",
  FoldMechanisms: "Strain in folded layers",
  FaultSection: "Fault block",
  StrikeSlipMap: "Strike-slip in map view",
  WellLab: "Drill the well",
  SortStructures: "Primary or secondary?",
  StrikeDip3D: "Strike & dip in 3D",
  StructureContours3D: "Structure contours",
  RuleOfV3D: "The Rule of Vs",
  CrossSectionBuilder: "Build the cross-section",
  TrueThickness: "True vs apparent thickness",
  Fault3D: "Faults in 3D",
  RiftBuilder: "Rift builder",
  FaultDrag: "Fault drag",
  TrishearFold: "Trishear fold",
  FaultGrowth: "Fault growth & linkage",
  WingCracks: "Grow a fault",
  FaultZone: "Inside a fault zone",
  MohrAnderson: "Mohr circle & Anderson",
  SyntheticAntithetic: "Synthetic, antithetic & grabens",
  AnticlineSyncline: "Anticline vs syncline",
};

export function Sim({ name }: { name: SimKey }) {
  const C = SIMS[name];
  return (
    <Suspense
      fallback={
        <div className="grid h-[420px] place-items-center rounded-3xl border border-line bg-white/[0.02] text-muted">Loading simulation…</div>
      }
    >
      <C />
    </Suspense>
  );
}
