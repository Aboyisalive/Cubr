import { ThemeProvider } from '@/components/theme-provider'
import { LandingPage } from '@/components/landing/landing-page'
import { WaitlistProvider } from '@/components/waitlist/waitlist-modal'
import { GlassFilter } from '@/components/ui/liquid-glass-button'

export default function App() {
  return (
    <ThemeProvider>
      <WaitlistProvider>
        <LandingPage />
        {/* SVG glass filter for LiquidButton: rendered once, app-wide. */}
        <GlassFilter />
      </WaitlistProvider>
    </ThemeProvider>
  )
}
