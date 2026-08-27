import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const FACE_COLORS = {
  U: "#FFFFFF",
  D: "#FFD500",
  F: "#009B48",
  B: "#0045AD",
  R: "#B90000",
  L: "#FF5900",
} as const;

const GAP = 0.08;
const CUBIE_SIZE = 1;

interface CubieProps {
  position: [number, number, number];
  colors: string[];
}

function Cubie({ position, colors }: CubieProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const materials = useMemo(
    () =>
      colors.map(
        (c) =>
          new THREE.MeshStandardMaterial({
            color: c,
            metalness: 0.6,
            roughness: 0.15,
            envMapIntensity: 1.2,
          })
      ),
    [colors]
  );

  return (
    <mesh ref={meshRef} position={position} material={materials}>
      <boxGeometry args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} />
    </mesh>
  );
}

function buildCubies() {
  const cubies: { pos: [number, number, number]; colors: string[] }[] = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const colors: string[] = [
          x === 1 ? FACE_COLORS.R : "#111111",
          x === -1 ? FACE_COLORS.L : "#111111",
          y === 1 ? FACE_COLORS.U : "#111111",
          y === -1 ? FACE_COLORS.D : "#111111",
          z === 1 ? FACE_COLORS.F : "#111111",
          z === -1 ? FACE_COLORS.B : "#111111",
        ];
        cubies.push({
          pos: [x * (CUBIE_SIZE + GAP), y * (CUBIE_SIZE + GAP), z * (CUBIE_SIZE + GAP)],
          colors,
        });
      }
    }
  }
  return cubies;
}

/**
 * A 3x3x3 Rubik's cube made of cubies.
 * Rotates entire cube slowly + animates a single layer on a loop.
 */
interface RubiksCubeProps {
  position?: [number, number, number];
  scale?: number;
  /** Algorithm: list of face rotations to cycle through */
  algorithm?: string[];
  rotationSpeed?: number;
  layerSpeed?: number;
}

export function RubiksCube({
  position = [0, 0, 0],
  scale = 1,
  algorithm = ["R", "U"],
  rotationSpeed = 0.15,
  layerSpeed = 0.8,
}: RubiksCubeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cubies = useMemo(() => buildCubies(), []);
  const algoIndex = useRef(0);
  const layerAngle = useRef(0);
  const layerActive = useRef(false);
  const layerTarget = useRef(Math.PI / 2);
  const timer = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Slow idle rotation of the whole cube
    groupRef.current.rotation.y += delta * rotationSpeed;
    groupRef.current.rotation.x += delta * rotationSpeed * 0.3;

    // Layer rotation animation
    timer.current += delta;
    if (!layerActive.current && timer.current > 1.5) {
      layerActive.current = true;
      layerAngle.current = 0;
      layerTarget.current = Math.PI / 2;
      algoIndex.current = (algoIndex.current + 1) % algorithm.length;
      timer.current = 0;
    }

    if (layerActive.current) {
      layerAngle.current += delta * layerSpeed;
      if (layerAngle.current >= layerTarget.current) {
        layerActive.current = false;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {cubies.map(({ pos, colors }, i) => (
        <Cubie key={i} position={pos} colors={colors} />
      ))}
    </group>
  );
}

/**
 * Floating chrome cube with metallic finish — decorative accent.
 */
interface ChromeCubeDecoProps {
  position: [number, number, number];
  size?: number;
  speed?: number;
}

export function ChromeCubeDeco({ position, size = 1, speed = 0.3 }: ChromeCubeDecoProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialPos = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = t * speed;
    meshRef.current.rotation.y = t * speed * 0.7;
    meshRef.current.position.y = initialPos.y + Math.sin(t * 0.5) * 0.3;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial
        color="#A6ABB6"
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={1.5}
      />
    </mesh>
  );
}
