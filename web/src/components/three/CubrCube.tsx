import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ================================================================
   Constants
   ================================================================ */

const CUBIE_SIZE = 1;
const GAP = 0.06;
const STEP = CUBIE_SIZE + GAP;

const FACE_COLORS = {
  R: "#B90000",
  L: "#FF5900",
  U: "#FFFFFF",
  D: "#FFD500",
  F: "#009B48",
  B: "#0045AD",
} as const;

const INTERNAL_COLOR = "#0D0E10";

type Move = "R" | "R'" | "L" | "L'" | "U" | "U'" | "D" | "D'" | "F" | "F'" | "B" | "B'";

interface MoveConfig {
  axis: "x" | "y" | "z";
  layer: number;
  angle: number;
}

const MOVE_MAP: Record<Move, MoveConfig> = {
  R:  { axis: "x", layer:  1, angle: -Math.PI / 2 },
  "R'": { axis: "x", layer:  1, angle:  Math.PI / 2 },
  L:  { axis: "x", layer: -1, angle:  Math.PI / 2 },
  "L'": { axis: "x", layer: -1, angle: -Math.PI / 2 },
  U:  { axis: "y", layer:  1, angle: -Math.PI / 2 },
  "U'": { axis: "y", layer:  1, angle:  Math.PI / 2 },
  D:  { axis: "y", layer: -1, angle:  Math.PI / 2 },
  "D'": { axis: "y", layer: -1, angle: -Math.PI / 2 },
  F:  { axis: "z", layer:  1, angle: -Math.PI / 2 },
  "F'": { axis: "z", layer:  1, angle:  Math.PI / 2 },
  B:  { axis: "z", layer: -1, angle:  Math.PI / 2 },
  "B'": { axis: "z", layer: -1, angle: -Math.PI / 2 },
};

// A scramble that distributes moves across all faces.
// The solution is the reverse.
const SCRAMBLE: Move[] = [
  "R", "U", "F", "L'", "D", "B",
  "U'", "R'", "F'", "L", "D'", "B'",
];

/* ================================================================
   Helpers
   ================================================================ */

function cubieMaterials(x: number, y: number, z: number) {
  const rgba = (hex: string) => {
    const c = new THREE.Color(hex);
    return new THREE.MeshStandardMaterial({
      color: c,
      metalness: 0.88,
      roughness: 0.12,
    });
  };
  const black = () =>
    new THREE.MeshStandardMaterial({
      color: INTERNAL_COLOR,
      metalness: 0.95,
      roughness: 0.05,
    });

  // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  return [
    x ===  1 ? rgba(FACE_COLORS.R) : black(),
    x === -1 ? rgba(FACE_COLORS.L) : black(),
    y ===  1 ? rgba(FACE_COLORS.U) : black(),
    y === -1 ? rgba(FACE_COLORS.D) : black(),
    z ===  1 ? rgba(FACE_COLORS.F) : black(),
    z === -1 ? rgba(FACE_COLORS.B) : black(),
  ] as THREE.Material[];
}

function layerMatch(pos: number, layer: number) {
  return pos === layer;
}

function axisIndex(axis: "x" | "y" | "z"): 0 | 1 | 2 {
  return axis === "x" ? 0 : axis === "y" ? 1 : 2;
}

/* ================================================================
   Cubie
   ================================================================ */

interface CubieProps {
  gridPos: [number, number, number];
  materials: THREE.Material[];
}

function Cubie({ gridPos, materials }: CubieProps) {
  const ref = useRef<THREE.Mesh>(null);

  // Store grid position on the mesh for layer selection
  useEffect(() => {
    if (ref.current) {
      (ref.current as any).__gridPos = gridPos;
    }
  }, [gridPos]);

  return (
    <mesh
      ref={ref}
      position={[gridPos[0] * STEP, gridPos[1] * STEP, gridPos[2] * STEP]}
      material={materials}
    >
      <boxGeometry args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} />
    </mesh>
  );
}

/* ================================================================
   CubrCube
   ================================================================ */

export interface CubrCubeProps {
  scrollProgress: number;
  mouseNDC: THREE.Vector2;
  position?: [number, number, number];
  scale?: number;
}

export function CubrCube({
  scrollProgress,
  mouseNDC,
  position = [0, 0, 0],
  scale = 1,
}: CubrCubeProps) {
  const cubeGroupRef = useRef<THREE.Group>(null);
  const cursorPivotRef = useRef<THREE.Group>(null);
  const tempGroupRef = useRef<THREE.Group | null>(null);
  const currentAngleRef = useRef(0);

  // Build cubies once
  const cubies = useMemo(() => {
    const out: { pos: [number, number, number]; materials: THREE.Material[] }[] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          out.push({
            pos: [x, y, z],
            materials: cubieMaterials(x, y, z),
          });
        }
      }
    }
    return out;
  }, []);

  const solution = useMemo(() => [...SCRAMBLE].reverse(), []);
  const totalMoves = solution.length;

  // Smoothed angle that useFrame drives toward target
  const targetAngleRef = useRef(0);
  const activeMoveRef = useRef(0);

  useFrame((_, delta) => {
    if (!cubeGroupRef.current) return;

    // --- Cursor tilt ---
    if (cursorPivotRef.current) {
      cursorPivotRef.current.rotation.y += (mouseNDC.x * 0.3 - cursorPivotRef.current.rotation.y) * 0.05;
      cursorPivotRef.current.rotation.x += (-mouseNDC.y * 0.2 - cursorPivotRef.current.rotation.x) * 0.05;
    }

    // --- Ambient floating ---
    const t = performance.now() * 0.001;
    cubeGroupRef.current.position.y = Math.sin(t * 0.4) * 0.15;
    cubeGroupRef.current.rotation.z = Math.sin(t * 0.25) * 0.02;

    // --- Scroll → move ---
    const moveFloat = scrollProgress * totalMoves;
    const moveIdx = Math.min(Math.floor(moveFloat), totalMoves - 1);
    const frac = moveFloat - moveIdx;

    activeMoveRef.current = moveIdx;
    const cfg = MOVE_MAP[solution[moveIdx]];
    targetAngleRef.current = frac * cfg.angle;

    // Smooth interpolation toward target
    const diff = targetAngleRef.current - currentAngleRef.current;
    if (Math.abs(diff) < 0.0005) {
      currentAngleRef.current = targetAngleRef.current;
    } else {
      currentAngleRef.current += diff * Math.min(delta * 10, 1);
    }

    // --- Apply layer rotation ---
    if (Math.abs(diff) > 0.0001) {
      const angle = currentAngleRef.current;
      const { axis, layer } = cfg;

      // Collect matching cubies
      const selected: THREE.Object3D[] = [];
      cubeGroupRef.current.children.forEach((child) => {
        const gp = (child as any).__gridPos as [number, number, number] | undefined;
        if (gp && layerMatch(gp[axisIndex(axis)], layer)) {
          selected.push(child);
        }
      });

      if (selected.length > 0) {
        // Create temp pivot at origin
        if (!tempGroupRef.current) {
          tempGroupRef.current = new THREE.Group();
        }
        const pivot = tempGroupRef.current;
        pivot.rotation.set(0, 0, 0);

        // Reparent into pivot
        selected.forEach((obj) => pivot.attach(obj));

        // Apply rotation
        if (axis === "x") pivot.rotation.x = angle;
        else if (axis === "y") pivot.rotation.y = angle;
        else pivot.rotation.z = angle;

        pivot.updateMatrixWorld(true);

        // Reparent back to cube group
        while (pivot.children.length > 0) {
          const child = pivot.children[0];
          child.updateMatrixWorld(true);
          const wp = new THREE.Vector3();
          const wq = new THREE.Quaternion();
          child.getWorldPosition(wp);
          child.getWorldQuaternion(wq);
          cubeGroupRef.current.attach(child);
          child.position.copy(wp);
          child.quaternion.copy(wq);
        }
      }
    }
  });

  return (
    <group position={position} scale={scale}>
      <group ref={cursorPivotRef}>
        <group ref={cubeGroupRef}>
          {cubies.map(({ pos, materials }, i) => (
            <Cubie key={i} gridPos={pos} materials={materials} />
          ))}
        </group>
      </group>
    </group>
  );
}
