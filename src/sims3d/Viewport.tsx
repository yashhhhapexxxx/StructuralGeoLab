import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Standard 3D stage for the map-skills sims: orbit with mouse/touch, render only while
 * on screen, cap DPR for phones, local clipping enabled for cut-away blocks.
 */
export function Viewport({
  children,
  camera = [7, 6, 9],
  target = [0, 0, 0],
  height = "min(70vh, 560px)",
  topView = false,
}: {
  children: ReactNode;
  camera?: [number, number, number];
  target?: [number, number, number];
  height?: string;
  topView?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ height }} className="relative w-full touch-none">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.75]}
        gl={{ antialias: true, localClippingEnabled: true }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          gl.setClearColor("#0d130f");
        }}
      >
        {/* Switch cameras inside one canvas (re-creating the canvas breaks HTML labels). */}
        {topView ? (
          <PerspectiveCamera key="top" makeDefault position={[0, 22, 0.001]} fov={32} />
        ) : (
          <PerspectiveCamera key="persp" makeDefault position={camera} fov={40} />
        )}
        <ambientLight intensity={0.7} />
        <directionalLight position={[-6, 10, 4]} intensity={1.1} />
        {children}
        <OrbitControls
          key={topView ? "top" : "persp"}
          target={target}
          enablePan={false}
          enableRotate={!topView}
          minDistance={6}
          maxDistance={28}
          maxPolarAngle={Math.PI * 0.49}
          enableDamping
        />
      </Canvas>
      <p className="pointer-events-none absolute bottom-3 left-4 text-xs text-white/55">{topView ? "Map view · scroll to zoom" : "Drag to orbit · scroll / pinch to zoom"}</p>
    </div>
  );
}

/** Compass rose lying on a horizontal plane at height y. North = −z. */
export function CompassRose({ y = 0, r = 1.2, x = 0, z = 0 }: { y?: number; r?: number; x?: number; z?: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 0.92, r, 48]} />
        <meshBasicMaterial color="#e8dcc4" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -r * 0.45]}>
        <coneGeometry args={[0.16, r * 0.9, 3]} />
        <meshBasicMaterial color="#c8703f" />
      </mesh>
    </group>
  );
}
