import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform float uScroll;
uniform vec2 uMouse;
uniform vec2 uResolution;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(41.43, 289.17))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y);
}
float fbm(vec2 p) {
  float value = 0., amplitude = .5;
  for (int i = 0; i < 4; i++) { value += noise(p) * amplitude; p = p * 2.03 + 8.1; amplitude *= .5; }
  return value;
}

void main() {
  vec2 p = (vUv - .5) * vec2(uResolution.x / uResolution.y, 1.);
  float t = uTime * .035;
  vec2 motion = vec2(fbm(p * .9 + vec2(t, -t * .48)), fbm(p * .9 + vec2(8.3 - t * .38, 3.7 + t))) - .5;
  p += motion * .14 + uMouse * .012;

  // Broad curved boundaries imply massive folded surfaces extending past the viewport.
  float foldA = p.y + .36 * p.x * p.x - .31 + (fbm(p * 1.35 + t) - .5) * .12;
  float foldB = p.x - .22 * p.y * p.y + .53 + (fbm(p * 1.08 + 5. + t) - .5) * .13;
  float foldC = dot(p, normalize(vec2(.69, .72))) + .68 + (fbm(p * .82 - 4. - t) - .5) * .10;
  float dA = abs(foldA), dB = abs(foldB), dC = abs(foldC);
  float nearestFold = min(dA, min(dB, dC));

  float mass = smoothstep(.025, .48, nearestFold);
  float softRim = exp(-nearestFold * 15.) * .16;
  float hardRim = exp(-dA * 92.) + exp(-dB * 78.) * .82 + exp(-dC * 110.) * .42;
  float sheen = fbm(p * 2.6 + vec2(t * 2., -t)) * .035;

  vec3 black = vec3(.001, .002, .005);
  vec3 graphite = vec3(.012, .020, .033);
  vec3 blueChrome = vec3(.10, .14, .20);
  vec3 silver = vec3(.56, .66, .80);
  vec3 white = vec3(.93, .97, 1.);
  vec3 color = mix(black, graphite, mass * (.48 + sheen));
  color += blueChrome * softRim;
  color += silver * hardRim * .46;
  color += white * pow(hardRim, 3.) * .52;

  // CUBR orange only exists as a fleeting reflection in one narrow seam.
  float warmth = exp(-dB * 170.) * (.012 + smoothstep(.72, 1., uScroll) * .016);
  color += vec3(1., .25, .045) * warmth;

  float vignette = 1. - smoothstep(.24, 1.18, length(p));
  gl_FragColor = vec4(color * (.35 + vignette * .65), 1.);
}
`;

interface LiquidChromeProps { mouseNDC?: THREE.Vector2; scrollProgress?: number; }

export function LiquidChrome({ mouseNDC, scrollProgress = 0 }: LiquidChromeProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uScroll: { value: 0 }, uMouse: { value: new THREE.Vector2() },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
  }), []);

  useFrame((state) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = state.clock.elapsedTime;
    material.current.uniforms.uScroll.value = scrollProgress;
    material.current.uniforms.uResolution.value.set(state.size.width, state.size.height);
    if (mouseNDC) material.current.uniforms.uMouse.value.lerp(mouseNDC, .025);
  });

  return (
    <mesh position={[0, 0, -8]} scale={[30, 30, 1]} renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={material} vertexShader={VERTEX_SHADER} fragmentShader={FRAGMENT_SHADER} uniforms={uniforms} depthTest={false} depthWrite={false} />
    </mesh>
  );
}
