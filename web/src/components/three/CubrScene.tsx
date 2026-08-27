import { useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LiquidChrome } from "./LiquidChrome";
import { CubrCube } from "./CubrCube";

// R3F Canvas type workaround
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const R3FCanvas = Canvas as any;

/* ================================================================
   Smooth mouse tracker
   ================================================================ */

function MouseTracker({ onMove }: { onMove: (v: THREE.Vector2) => void }) {
  const target = useRef(new THREE.Vector2(0, 0));
  const smooth = useRef(new THREE.Vector2(0, 0));

  useFrame(() => {
    smooth.current.lerp(target.current, 0.04);
    onMove(smooth.current);
  });

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      target.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
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

function SceneContents({ mouseNDC, scrollProgress }: SceneContentsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Cube drifts down and scales as user scrolls
  useFrame(() => {
    if (!groupRef.current) return;
    // Subtle positional drift based on scroll
    groupRef.current.position.y = -scrollProgress * 0.5;
  });

  return (
    <>
      {/* Lighting — chrome reflections */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 8, 6]} intensity={1.4} color="#e8eaf0" />
      <directionalLight position={[-4, -3, -5]} intensity={0.4} color="#8899cc" />
      <pointLight position={[0, 5, 3]} intensity={0.6} color="#ffffff" distance={20} />
      <pointLight position={[-3, -2, 4]} intensity={0.3} color="#aabbcc" distance={15} />

      {/* Orange accent light — intensifies with solve progress */}
      <pointLight
        position={[3, 2, 5]}
        intensity={0.15 + scrollProgress * 0.6}
        color="#FF6B0F"
        distance={18}
      />
      <pointLight
        position={[-2, -3, 4]}
        intensity={0.05 + scrollProgress * 0.3}
        color="#FF8533"
        distance={14}
      />

      {/* Liquid chrome environment */}
      <LiquidChrome mouseNDC={mouseNDC} scrollProgress={scrollProgress} />

      {/* Giant cube */}
      <group ref={groupRef}>
        <CubrCube
          scrollProgress={scrollProgress}
          mouseNDC={mouseNDC}
          position={[0, 0, 0]}
          scale={1.3}
        />
      </group>
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
  const [mouseNDC, setMouseNDC] = useState(() => new THREE.Vector2(0, 0));

  const handleMouseMove = useCallback((v: THREE.Vector2) => {
    setMouseNDC(v.clone());
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
      dpr={[1, 1.5]}
      style={{ background: "#000" }}
      className={className}
    >
      <MouseTracker onMove={handleMouseMove} />
      <SceneContents mouseNDC={mouseNDC} scrollProgress={scrollProgress} />
    </R3FCanvas>
  );
}
