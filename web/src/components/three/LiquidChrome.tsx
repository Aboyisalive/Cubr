import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;
uniform vec3 uCamPos;
varying vec3 vWorldPos;
varying vec2 vUv;

// --- noise helpers ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g  = step(x0.yzx, x0.xyz);
  vec3 l  = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  vec3 shift = vec3(100.0);
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 dir = normalize(vWorldPos - uCamPos);
  float t = uTime * 0.12;

  // Domain-warped flowing noise
  vec3 p = dir * 2.5;
  float n1 = fbm(p + vec3(t, t * 0.7, t * 0.3));
  float n2 = fbm(p * 1.4 + vec3(n1 * 0.6, t * 0.5, -t * 0.4) + vec3(5.0, 3.0, 7.0));
  float n3 = fbm(p * 0.8 + vec3(n2 * 0.4, -t * 0.3, t * 0.6) + vec3(10.0, 7.0, 2.0));

  // Base liquid chrome
  float flow = n3 * 0.5 + 0.5;

  // Bright chrome reflections (travelling bands)
  float band1 = pow(max(sin(dir.x * 4.0 + dir.y * 2.5 + t * 2.0 + n1 * 1.5), 0.0), 8.0);
  float band2 = pow(max(sin(dir.y * 3.5 - dir.z * 2.0 + t * 1.5 + n2), 0.0), 12.0);
  float band3 = pow(max(sin(dir.z * 5.0 + dir.x * 1.5 - t + n3 * 0.8), 0.0), 6.0);

  // Mouse-responsive highlight
  float mouseInfluence = dot(dir.xy, uMouse * 0.3);
  float mouseHighlight = pow(max(sin(mouseInfluence * 3.0 + t * 2.0), 0.0), 10.0);

  // Fresnel (edge glow)
  float fresnel = pow(1.0 - max(dot(-dir, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);

  // Compose chrome layers
  vec3 dark   = vec3(0.01, 0.01, 0.02);
  vec3 shadow = vec3(0.04, 0.045, 0.055);
  vec3 mid    = vec3(0.12, 0.125, 0.14);
  vec3 silver = vec3(0.35, 0.37, 0.42);
  vec3 bright = vec3(0.7, 0.73, 0.8);
  vec3 white  = vec3(0.92, 0.93, 0.95);

  vec3 col = dark;
  col = mix(col, shadow, smoothstep(0.2, 0.35, flow));
  col = mix(col, mid,     smoothstep(0.38, 0.52, flow));
  col = mix(col, silver,  band1 * 0.7);
  col = mix(col, bright,  band2 * 0.5);
  col = mix(col, white,   band3 * 0.35 + mouseHighlight * 0.3);
  col += white * fresnel * 0.12;

  // CUBR orange accent — very sparingly
  vec3 orange = vec3(1.0, 0.42, 0.06);
  float orangeScroll = smoothstep(0.7, 1.0, uScroll);
  float orangeWave = pow(max(sin(dir.x * 2.0 + dir.y * 3.0 + t * 1.2), 0.0), 16.0);
  float orangeFresnel = pow(fresnel, 2.0) * 0.5;
  col += orange * orangeWave * (0.06 + orangeScroll * 0.12);
  col += orange * orangeFresnel * (0.02 + orangeScroll * 0.08);
  col += orange * mouseHighlight * 0.04;

  // Traveling light sweep
  float sweep = pow(max(sin(dir.x * 1.5 + dir.z + t * 0.8), 0.0), 20.0);
  col += white * sweep * 0.15;

  // Subtle scan lines for depth
  float scan = sin(dir.y * 40.0 + t * 3.0) * 0.5 + 0.5;
  col *= 0.97 + scan * 0.03;

  gl_FragColor = vec4(col, 1.0);
}
`;

interface LiquidChromeProps {
  mouseNDC?: THREE.Vector2;
  scrollProgress?: number;
}

export function LiquidChrome({
  mouseNDC,
  scrollProgress = 0,
}: LiquidChromeProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uCamPos: { value: new THREE.Vector3(0, 0, 6) },
    }),
    [],
  );

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    matRef.current.uniforms.uCamPos.value.copy(state.camera.position);
    if (mouseNDC) matRef.current.uniforms.uMouse.value.copy(mouseNDC);
    matRef.current.uniforms.uScroll.value = scrollProgress;
  });

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[50, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
