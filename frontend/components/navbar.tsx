'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Section links use the `/#id` form (not bare `#id`) so they resolve
// correctly from any route, not just when already on the homepage —
// bare hash links were the bug behind "returning to Home doesn't work"
// when clicked from /events.
const LINKS = [
  { label: 'HOME', href: '/#home' },
  { label: 'EVENTS', href: '/events' },
  { label: 'SCHEDULE', href: '/schedule' },
  { label: 'WORKSHOPS', href: '/events' },
  { label: 'SPEAKERS', href: '/speakers' },
  { label: 'ABOUT', href: '/#about' },
  { label: 'MY EVENTS', href: '/dashboard' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10"
      >
        <Link href="/#home" className="font-mono text-sm tracking-[0.3em] text-foreground">
          CYBERCARNIVAL
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <Link
            href="/register"
            className="hidden items-center gap-2 border border-primary/60 px-5 py-2 font-mono text-[11px] tracking-[0.2em] text-foreground transition-all hover:bg-primary hover:text-primary-foreground lg:inline-flex"
          >
            REGISTER <span aria-hidden="true">→</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span
              className={`h-px w-6 bg-foreground transition-transform ${open ? 'translate-y-[3.5px] rotate-45' : ''}`}
            />
            <span
              className={`h-px w-6 bg-foreground transition-transform ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`}
            />
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
          <ul className="flex flex-col px-6 py-6">
            {LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 font-mono text-sm tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-4">
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 border border-primary/60 px-5 py-3 font-mono text-xs tracking-[0.2em] text-foreground"
              >
                REGISTER <span aria-hidden="true">→</span>
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
