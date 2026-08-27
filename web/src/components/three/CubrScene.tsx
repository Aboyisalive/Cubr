import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LiquidChrome } from "./LiquidChrome";
import { CubrCube } from "./CubrCube";

// R3F Canvas type workaround
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const R3FCanvas = Canvas as any;

/* ================================================================
   Smooth mouse tracker
   ================================================================ */

function MouseTracker({ mouseNDC }: { mouseNDC: THREE.Vector2 }) {
  const target = useRef(new THREE.Vector2(0, 0));
  const smooth = useRef(new THREE.Vector2(0, 0));
  const invalidate = useThree((state) => state.invalidate);

  useFrame(() => {
    smooth.current.lerp(target.current, 0.04);
    mouseNDC.copy(smooth.current);
  });

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      target.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
      invalidate();
    };
    window.addEventListener("pointermove", handler, { passive: true });
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  return null;
}

/* ================================================================
   Scene contents
   ================================================================ */

interface SceneContentsProps {
  mouseNDC: THREE.Vector2;
  scrollProgress: number;
}

function CubeStory({ mouseNDC, scrollProgress }: SceneContentsProps) {
  const ref = useRef<THREE.Group>(null);
  const reveal = THREE.MathUtils.smoothstep(scrollProgress, 0.08, 0.2);
  const solveProgress = THREE.MathUtils.clamp((scrollProgress - 0.2) / 0.72, 0, 1);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const targetX = scrollProgress < 0.42 ? 1.05 : scrollProgress < 0.76 ? -0.85 : 0.48;
    const targetY = scrollProgress < 0.42 ? 0.05 : scrollProgress < 0.76 ? -0.36 : 0.1;
    ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, targetX, 1.5, delta);
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, targetY, 1.5, delta);
    ref.current.scale.setScalar(THREE.MathUtils.damp(ref.current.scale.x, 0.92 * reveal, 1.8, delta));
  });

  return <group ref={ref} scale={0.001}><CubrCube scrollProgress={solveProgress} mouseNDC={mouseNDC} scale={1} /></group>;
}

function SceneContents({ mouseNDC, scrollProgress }: SceneContentsProps) {
  return (
    <>
      {/* Layer 0: liquid chrome. Layer 1 enters after the opening atmosphere. */}
      <LiquidChrome mouseNDC={mouseNDC} scrollProgress={scrollProgress} />
      <CubeStory mouseNDC={mouseNDC} scrollProgress={scrollProgress} />

    </>
  );
}

/* ================================================================
   Exported scene (Canvas + state)
   ================================================================ */

export interface CubrSceneProps {
  scrollProgress: number;
  className?: string;
}

export function CubrScene({ scrollProgress, className }: CubrSceneProps) {
  const mouseNDC = useRef(new THREE.Vector2(0, 0));
  const [isVisible, setIsVisible] = useState(() => document.visibilityState === "visible");
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const syncVisibility = () => setIsVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReducedMotion(media.matches);
    media.addEventListener("change", syncMotionPreference);
    return () => media.removeEventListener("change", syncMotionPreference);
  }, []);

  return (
    <R3FCanvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      dpr={[1, window.innerWidth < 768 || reducedMotion ? 1 : 1.5]}
      frameloop={isVisible ? (reducedMotion ? "demand" : "always") : "never"}
      style={{ background: "#000" }}
      className={className}
    >
      <MouseTracker mouseNDC={mouseNDC.current} />
      <SceneContents mouseNDC={mouseNDC.current} scrollProgress={scrollProgress} />
    </R3FCanvas>
  );
}
