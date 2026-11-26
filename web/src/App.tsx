import { ThemeProvider } from '@/components/theme-provider'
import { LandingPage } from '@/components/landing/landing-page'
import { SiteBackground } from '@/components/landing/site-background'
import { WaitlistProvider } from '@/components/waitlist/waitlist-modal'
import { GlassFilter } from '@/components/ui/liquid-glass-button'

export default function App() {
  return (
    <ThemeProvider>
      <WaitlistProvider>
        {/* Sitewide background: fixed behind the whole app. */}
        <SiteBackground />
        <LandingPage />
        {/* SVG glass filter for LiquidButton: rendered once, app-wide. */}
        <GlassFilter />
      </WaitlistProvider>
    </ThemeProvider>
  )
}
