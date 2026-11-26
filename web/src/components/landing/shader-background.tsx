import { useEffect, useRef } from 'react'
import {
  HERO_COLORS,
  HERO_FRAGMENT_SRC,
  HERO_POSTER_TIME,
  HERO_UBLOCK,
  HERO_VERTEX_SRC,
} from './hero-shader'

const RENDER_SCALES = [0.75, 0.6, 0.5, 0.35] as const

type Props = {
  onReady?: () => void
  onError?: () => void
  className?: string
}

function compile(gl: WebGL2RenderingContext, src: string, type: number) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || 'shader compile error'
    gl.deleteShader(shader)
    throw new Error(info)
  }
  return shader
}

/**
 * Raw WebGL2 hero background (no Three.js). Performance contract (F0.8):
 * antialias off, starts at 0.75 render scale and steps down when frame
 * time stays over ~20 ms, DPR capped at 1.5, loop paused while off-screen
 * (IntersectionObserver) or the tab is hidden, and a single static frame
 * under prefers-reduced-motion. All state lives in refs — the render loop
 * never touches React state.
 */
export default function ShaderBackground({ onReady, onError, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const callbacks = useRef({ onReady, onError })
  callbacks.current = { onReady, onError }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let gl: WebGL2RenderingContext | null = null
    try {
      gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        powerPreference: 'high-performance',
      })
    } catch {
      gl = null
    }
    if (!gl) {
      callbacks.current.onError?.()
      return
    }

    let program: WebGLProgram | null = null
    let raf = 0
    let disposed = false
    let visible = true
    let scaleIndex = 0
    let frameTimeTotal = 0
    let frameCount = 0
    let lastFrameAt = performance.now()

    try {
      const vs = compile(gl, HERO_VERTEX_SRC, gl.VERTEX_SHADER)
      const fs = compile(gl, HERO_FRAGMENT_SRC, gl.FRAGMENT_SHADER)
      program = gl.createProgram()!
      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      gl.linkProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'program link error')
      }
    } catch (error) {
      console.warn('cubr hero shader unavailable, keeping poster', error)
      callbacks.current.onError?.()
      return
    }

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
      gl.STATIC_DRAW,
    )
    gl.useProgram(program)
    const positionLoc = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, 'time')
    const uRes = gl.getUniformLocation(program, 'resolution')
    const uBlock = gl.getUniformLocation(program, 'uBlock')
    const uColorA = gl.getUniformLocation(program, 'uColorA')
    const uColorB = gl.getUniformLocation(program, 'uColorB')
    const uColorC = gl.getUniformLocation(program, 'uColorC')
    gl.uniform1f(uBlock, HERO_UBLOCK)
    gl.uniform3f(uColorA, ...HERO_COLORS[0])
    gl.uniform3f(uColorB, ...HERO_COLORS[1])
    gl.uniform3f(uColorC, ...HERO_COLORS[2])

    const fit = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const scale = RENDER_SCALES[scaleIndex] * dpr
      const width = Math.max(1, Math.floor(rect.width * scale))
      const height = Math.max(1, Math.floor(rect.height * scale))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl!.viewport(0, 0, width, height)
      }
    }
    fit()
    const resizeObserver = new ResizeObserver(fit)
    resizeObserver.observe(canvas)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const draw = (timeSeconds: number) => {
      gl!.uniform2f(uRes, canvas.width, canvas.height)
      gl!.uniform1f(uTime, timeSeconds)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    }

    let readyNotified = false
    const loop = (now: number) => {
      if (disposed) return
      raf = requestAnimationFrame(loop)
      if (!visible || document.hidden) {
        lastFrameAt = now
        return
      }
      // Adaptive scale: average frame time over 30 frames; step down a
      // tier when it stays above ~20 ms (60 fps degrading gracefully).
      frameTimeTotal += now - lastFrameAt
      lastFrameAt = now
      if (++frameCount >= 30) {
        const avg = frameTimeTotal / frameCount
        frameTimeTotal = 0
        frameCount = 0
        if (avg > 20 && scaleIndex < RENDER_SCALES.length - 1) {
          scaleIndex++
          fit()
        }
      }
      draw(now * 1e-3)
      if (!readyNotified) {
        readyNotified = true
        callbacks.current.onReady?.()
      }
    }

    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
      },
      { threshold: 0 },
    )
    intersection.observe(canvas)

    if (reducedMotion.matches) {
      // One static frame — the same moment as the poster.
      draw(HERO_POSTER_TIME)
      callbacks.current.onReady?.()
    } else {
      raf = requestAnimationFrame(loop)
    }

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      intersection.disconnect()
      resizeObserver.disconnect()
      gl.deleteBuffer(buffer)
      if (program) gl.deleteProgram(program)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
