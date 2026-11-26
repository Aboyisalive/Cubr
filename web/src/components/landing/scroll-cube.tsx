import { useEffect, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { cubieTransformsAt, solvedPositions } from './cube-scrub'

// Cube-face colors from the design tokens (tokens.css primitives):
// U white, D yellow, F grey, B blue, R red, L orange. The front face is
// the logo's grey (#545455, sampled from Cubr-logo.png) instead of green,
// so the solved cube reads like the logo: white top, orange side, grey
// front. The cube-green token itself is unchanged everywhere else.
const FACE_COLORS = {
  px: '#c9001b',
  nx: '#ff7200',
  py: '#ffffff',
  ny: '#ffd500',
  pz: '#545455',
  nz: '#0057b8',
} as const

/**
 * Three.js cube behind the blended steps + Why slides: it cycles a
 * repetitive algorithm through the step slides, then solves during the
 * Why slides. Progress arrives via a ref (written by the scroll handler);
 * the render loop reads it and recomputes cubie transforms from the
 * solved state every frame — nothing here touches React state, and
 * scrubbing up/down is exact. Loaded lazily (React.lazy) so Three.js is
 * never in the landing page's initial bundle.
 */
export default function ScrollCube({
  progressRef,
}: {
  progressRef: RefObject<number>
}) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0, 8.2)

    scene.add(new THREE.AmbientLight(0xffffff, 1.15))
    const key = new THREE.DirectionalLight(0xffffff, 1.6)
    key.position.set(4, 6, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffe0c2, 0.5)
    rim.position.set(-5, -3, -4)
    scene.add(rim)

    const cube = new THREE.Group()
    scene.add(cube)

    // Refined cubies (same silhouette, softer hand): rounded bodies and
    // beveled sticker slabs with real depth instead of flat planes.
    const bodyGeometry = new RoundedBoxGeometry(0.94, 0.94, 0.94, 3, 0.07)
    const stickerGeometry = new RoundedBoxGeometry(0.8, 0.8, 0.07, 2, 0.03)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: '#131316',
      roughness: 0.45,
      metalness: 0.15,
    })
    const stickerMaterials = Object.fromEntries(
      Object.entries(FACE_COLORS).map(([face, color]) => [
        face,
        new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.05 }),
      ]),
    ) as Record<keyof typeof FACE_COLORS, THREE.MeshStandardMaterial>

    const faces: { face: keyof typeof FACE_COLORS; dir: THREE.Vector3 }[] = [
      { face: 'px', dir: new THREE.Vector3(1, 0, 0) },
      { face: 'nx', dir: new THREE.Vector3(-1, 0, 0) },
      { face: 'py', dir: new THREE.Vector3(0, 1, 0) },
      { face: 'ny', dir: new THREE.Vector3(0, -1, 0) },
      { face: 'pz', dir: new THREE.Vector3(0, 0, 1) },
      { face: 'nz', dir: new THREE.Vector3(0, 0, -1) },
    ]

    const cubies = solvedPositions().map((home) => {
      const group = new THREE.Group()
      group.add(new THREE.Mesh(bodyGeometry, bodyMaterial))
      for (const { face, dir } of faces) {
        const onFace =
          (dir.x !== 0 && home.x === dir.x) ||
          (dir.y !== 0 && home.y === dir.y) ||
          (dir.z !== 0 && home.z === dir.z)
        if (!onFace) continue
        const sticker = new THREE.Mesh(stickerGeometry, stickerMaterials[face])
        sticker.position.copy(dir).multiplyScalar(0.47)
        sticker.lookAt(dir.clone().multiplyScalar(2))
        group.add(sticker)
      }
      cube.add(group)
      return group
    })

    const axisVectors = {
      x: new THREE.Vector3(1, 0, 0),
      y: new THREE.Vector3(0, 1, 0),
      z: new THREE.Vector3(0, 0, 1),
    } as const

    const applyProgress = (progress: number) => {
      const transforms = cubieTransformsAt(progress)
      transforms.forEach((transform, i) => {
        const mesh = cubies[i]
        mesh.position.set(
          transform.position.x * 1.02,
          transform.position.y * 1.02,
          transform.position.z * 1.02,
        )
        const quaternion = new THREE.Quaternion()
        for (const rotation of transform.rotations) {
          const q = new THREE.Quaternion().setFromAxisAngle(
            axisVectors[rotation.axis],
            rotation.angle,
          )
          quaternion.premultiply(q)
        }
        mesh.quaternion.copy(quaternion)
      })
      // Ends in the logo's pose: white top, orange face on the left,
      // grey face on the right (positive yaw brings the -x orange face
      // and the +z grey face both toward the camera).
      cube.rotation.set(0.34 - progress * 0.06, 0.78 - progress * 0.33, 0)
    }

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    let visible = false
    let raf = 0
    let disposed = false
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const renderOnce = () => {
      applyProgress(progressRef.current ?? 0)
      renderer.render(scene, camera)
    }

    const loop = () => {
      if (disposed) return
      raf = requestAnimationFrame(loop)
      if (!visible || document.hidden) return
      renderOnce()
    }

    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible && reducedMotion) renderOnce()
      },
      { threshold: 0 },
    )
    intersection.observe(mount)

    if (reducedMotion) {
      renderOnce()
    } else {
      raf = requestAnimationFrame(loop)
    }

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      intersection.disconnect()
      resizeObserver.disconnect()
      bodyGeometry.dispose()
      stickerGeometry.dispose()
      bodyMaterial.dispose()
      Object.values(stickerMaterials).forEach((m) => m.dispose())
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [progressRef])

  return <div ref={mountRef} aria-hidden className="h-full w-full [&>canvas]:block" />
}
