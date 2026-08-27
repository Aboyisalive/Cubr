import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CUBIE_SIZE = 0.96;
const STEP = 1.04;
const AXIS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
} as const;

type Axis = keyof typeof AXIS;
type Move = "R" | "R'" | "L" | "L'" | "U" | "U'" | "D" | "D'" | "F" | "F'" | "B" | "B'";

interface MoveConfig { axis: Axis; layer: number; angle: number; }

// These are cube-space rotations, not a decorative whole-cube animation.
const MOVE_MAP: Record<Move, MoveConfig> = {
  R: { axis: "x", layer: 1, angle: -Math.PI / 2 }, "R'": { axis: "x", layer: 1, angle: Math.PI / 2 },
  L: { axis: "x", layer: -1, angle: Math.PI / 2 }, "L'": { axis: "x", layer: -1, angle: -Math.PI / 2 },
  U: { axis: "y", layer: 1, angle: -Math.PI / 2 }, "U'": { axis: "y", layer: 1, angle: Math.PI / 2 },
  D: { axis: "y", layer: -1, angle: Math.PI / 2 }, "D'": { axis: "y", layer: -1, angle: -Math.PI / 2 },
  F: { axis: "z", layer: 1, angle: -Math.PI / 2 }, "F'": { axis: "z", layer: 1, angle: Math.PI / 2 },
  B: { axis: "z", layer: -1, angle: -Math.PI / 2 }, "B'": { axis: "z", layer: -1, angle: Math.PI / 2 },
};

const SCRAMBLE: Move[] = ["R", "U", "F", "L'", "D", "B", "U'", "R'", "F'", "L", "D'", "B'"];
const invertMove = (move: Move): Move => (move.endsWith("'") ? move.slice(0, -1) : `${move}'`) as Move;
const axisIndex = (axis: Axis) => (axis === "x" ? 0 : axis === "y" ? 1 : 2);
const ease = (value: number) => value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

interface CubiePose { homeGrid: THREE.Vector3; grid: THREE.Vector3; position: THREE.Vector3; quaternion: THREE.Quaternion; }

function applyMove(cubies: CubiePose[], move: Move, amount = 1) {
  const config = MOVE_MAP[move];
  const rotation = new THREE.Quaternion().setFromAxisAngle(AXIS[config.axis], config.angle * amount);
  cubies.forEach((cubie) => {
    if (cubie.grid.getComponent(axisIndex(config.axis)) !== config.layer) return;
    cubie.position.applyQuaternion(rotation);
    cubie.quaternion.premultiply(rotation);
    if (amount === 1) {
      cubie.position.set(Math.round(cubie.position.x), Math.round(cubie.position.y), Math.round(cubie.position.z));
      cubie.grid.copy(cubie.position);
    }
  });
}

function getCubeState(progress: number, solution: Move[]) {
  const cubies: CubiePose[] = [];
  for (let x = -1; x <= 1; x += 1) for (let y = -1; y <= 1; y += 1) for (let z = -1; z <= 1; z += 1) {
    const position = new THREE.Vector3(x, y, z);
    cubies.push({ homeGrid: position.clone(), grid: position.clone(), position, quaternion: new THREE.Quaternion() });
  }

  // The initial pose is genuinely scrambled. Each scroll segment applies one inverse move.
  SCRAMBLE.forEach((move) => applyMove(cubies, move));
  const moveProgress = THREE.MathUtils.clamp(progress, 0, 1) * solution.length;
  const completedMoves = Math.floor(moveProgress);
  solution.slice(0, completedMoves).forEach((move) => applyMove(cubies, move));
  if (completedMoves < solution.length) applyMove(cubies, solution[completedMoves], ease(moveProgress - completedMoves));
  return cubies;
}

function Cubie({ pose, faces, core }: { pose: CubiePose; faces: Record<Axis, [THREE.Material, THREE.Material]>; core: THREE.Material }) {
  const materials = useMemo(() => {
    const isOuter = (axis: Axis, value: number) => Math.abs(pose.homeGrid.getComponent(axisIndex(axis)) - value) < 0.001;
    return [isOuter("x", 1) ? faces.x[1] : core, isOuter("x", -1) ? faces.x[0] : core, isOuter("y", 1) ? faces.y[1] : core, isOuter("y", -1) ? faces.y[0] : core, isOuter("z", 1) ? faces.z[1] : core, isOuter("z", -1) ? faces.z[0] : core];
  }, [core, faces, pose.homeGrid]);

  return (
    <mesh position={pose.position.clone().multiplyScalar(STEP)} quaternion={pose.quaternion} material={materials} castShadow receiveShadow>
      <boxGeometry args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} />
    </mesh>
  );
}

export interface CubrCubeProps {
  scrollProgress: number;
  mouseNDC: THREE.Vector2;
  position?: [number, number, number];
  scale?: number;
}

export function CubrCube({ scrollProgress, mouseNDC, position = [0, 0, 0], scale = 1 }: CubrCubeProps) {
  const cursorPivotRef = useRef<THREE.Group>(null);
  const floatRef = useRef<THREE.Group>(null);
  const solution = useMemo(() => [...SCRAMBLE].reverse().map(invertMove), []);
  const faces = useMemo(() => {
    const enamel = (color: string) => new THREE.MeshPhysicalMaterial({ color, metalness: 0.72, roughness: 0.2, clearcoat: 0.7, clearcoatRoughness: 0.1 });
    return {
      x: [enamel("#24272d"), enamel("#d86a1d")],
      y: [enamel("#b7bec8"), enamel("#24272d")],
      z: [enamel("#d86a1d"), enamel("#b7bec8")],
    } as Record<Axis, [THREE.Material, THREE.Material]>;
  }, []);
  const core = useMemo(() => new THREE.MeshStandardMaterial({ color: "#090a0d", metalness: 0.85, roughness: 0.22 }), []);
  const cubies = useMemo(() => getCubeState(scrollProgress, solution), [scrollProgress, solution]);

  useFrame((state, delta) => {
    const cursor = cursorPivotRef.current;
    const floating = floatRef.current;
    if (cursor) {
      cursor.rotation.y = THREE.MathUtils.damp(cursor.rotation.y, mouseNDC.x * 0.18, 5, delta);
      cursor.rotation.x = THREE.MathUtils.damp(cursor.rotation.x, -mouseNDC.y * 0.12, 5, delta);
    }
    if (floating) {
      const time = state.clock.elapsedTime;
      floating.position.y = Math.sin(time * 0.42) * 0.1;
      floating.rotation.z = Math.sin(time * 0.24) * 0.018;
    }
  });

  return (
    <group position={position} scale={scale}>
      <group ref={cursorPivotRef}>
        <group ref={floatRef}>
          {cubies.map((pose, index) => <Cubie key={index} pose={pose} faces={faces} core={core} />)}
        </group>
      </group>
    </group>
  );
}
