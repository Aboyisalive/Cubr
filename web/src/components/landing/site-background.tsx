import { Suspense, lazy, useEffect, useState } from 'react'

const ShaderBackground = lazy(() => import('./shader-background'))

type Phase = 'poster' | 'loading' | 'live' | 'fallback'

/**
 * The sitewide background, fixed behind the whole app (mounted once at
 * the App root): scrolling and page changes never remove it — only the
 * content and the cube move. The WebP poster is painted first (it is
 * the LCP element and the permanent fallback). After first paint, on
 * idle, the WebGL2 shader lazy-loads and fades in over the poster. If
 * WebGL2 is missing or the shader fails, the poster stays.
 */
export function SiteBackground() {
  const [phase, setPhase] = useState<Phase>('poster')

  useEffect(() => {
    let cancelled = false
    const start = () => {
      if (!cancelled) setPhase((p) => (p === 'poster' ? 'loading' : p))
    }
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(start, { timeout: 1500 })
      return () => {
        cancelled = true
        window.cancelIdleCallback(id)
      }
    }
    const id = setTimeout(start, 600)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [])

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-black">
      <img
        src="/hero-poster.webp"
        alt=""
        fetchPriority="high"
        className="h-full w-full object-cover"
      />
      {(phase === 'loading' || phase === 'live') && (
        <Suspense fallback={null}>
          <ShaderBackground
            className={`absolute inset-0 transition-opacity duration-700 ${
              phase === 'live' ? 'opacity-100' : 'opacity-0'
            }`}
            onReady={() => setPhase('live')}
            onError={() => setPhase('fallback')}
          />
        </Suspense>
      )}
    </div>
  )
}
