import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { Intro } from '@/components/intro'
import { Events } from '@/components/events'
import { FeaturedEvent } from '@/components/featured-event'
import { Stats } from '@/components/stats'
import { FinalCta } from '@/components/final-cta'

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Intro />
        <Events />
        <FeaturedEvent />
        <Stats />
        <FinalCta />
      </main>
    </>
  )
}
