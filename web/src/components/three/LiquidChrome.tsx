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
  float t = uTime * .32;
  p += uMouse * .018;

  // A wide ribbon travels continuously across the viewport like folded chrome.
  float wave = sin(p.x * 2.7 + t) * .22
    + sin(p.x * 5.1 - t * .73 + 1.4) * .08
    + sin(p.x * 1.15 + t * .38) * .12;
  wave += (fbm(vec2(p.x * 1.25 + t * .18, 3.0)) - .5) * .10;
  float ribbonDistance = abs(p.y - wave);
  float ribbon = 1. - smoothstep(.22, .31, ribbonDistance);
  float edge = exp(-pow(ribbonDistance - .255, 2.) * 1800.);
  float innerEdge = exp(-pow(ribbonDistance - .17, 2.) * 420.);

  // Moving reflection bands provide the bright, liquid-metal read.
  float reflection = .5 + .5 * sin(
    (p.y - wave) * 30. + sin(p.x * 4. + t) * 3. + p.x * 8. - t * 1.4
  );
  reflection = pow(reflection, 5.);
  float broadReflection = .5 + .5 * sin(p.x * 7. - t * 1.1 + p.y * 5.);
  float texture = fbm(vec2(p.x * 3.2 - t * .2, p.y * 2.6 + t * .14));

  vec3 black = vec3(.001, .002, .004);
  vec3 deepBlue = vec3(.008, .025, .055);
  vec3 chromeBlue = vec3(.24, .53, .78);
  vec3 silver = vec3(.68, .78, .88);
  vec3 highlight = vec3(.96, .985, 1.);
  vec3 metal = mix(deepBlue, silver, reflection * .72 + broadReflection * .16);
  metal = mix(metal, chromeBlue, smoothstep(.25, .72, texture) * .38);

  vec3 color = black;
  color += metal * ribbon;
  color += chromeBlue * innerEdge * .55;
  color += silver * edge * (.65 + reflection * .5);
  color += highlight * pow(edge, 2.) * .5;

  // Keep CUBR orange as a restrained, occasional reflection.
  color += vec3(1., .24, .035) * edge
    * (.012 + smoothstep(.72, 1., uScroll) * .014);

  float vignette = 1. - smoothstep(.42, 1.2, length(p * vec2(.72, 1.)));
  gl_FragColor = vec4(color * (.42 + vignette * .58), 1.);
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
