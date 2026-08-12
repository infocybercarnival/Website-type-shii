// Central event registry — single source of truth for event content.
// Structured so it can later be replaced by / hydrated from the Flask backend.
// Poster files live in /public/assets/posters and are mapped by actual
// poster artwork (several uploaded filenames were swapped relative to
// their contents — mapping below follows the artwork, not the filename).

export type EventInfo = {
  no: string
  name: string
  tag: string
  desc: string
  /** Path under /public. Null = no official poster provided yet. */
  poster: string | null
  posterAlt: string
  /** Optional second poster (e.g. workshops have two partner posters). */
  extraPoster?: string
  extraPosterAlt?: string
  details: {
    date: string
    time: string
    venue: string
    teamSize: string
    fee: string
    prize: string
  }
}

// Placeholder used when the poster does not state a value.
// Kept as a constant so backend integration can find and replace these.
const TBA = 'TBA'

export const EVENT_DATES = '7 — 8 OCTOBER'

export const EVENTS: EventInfo[] = [
  {
    no: '01',
    name: 'CAPTURE THE FLAG',
    tag: 'COMPETITION',
    desc: 'A live jeopardy-style CTF spanning web, crypto, forensics, reversing, and pwn. Teams race the clock — and each other.',
    poster: '/assets/posters/ctf.jpg',
    posterAlt: 'Capture The Flag official event poster',
    details: {
      date: EVENT_DATES,
      time: TBA,
      venue: 'SRM RAMAPURAM',
      teamSize: TBA,
      fee: '₹250 PER TEAM',
      prize: TBA,
    },
  },
  {
    no: '02',
    name: 'BUG BOUNTY',
    tag: 'COMPETITION',
    desc: 'Hunt real vulnerabilities in a controlled target environment. Findings are scored on severity, impact, and report quality.',
    poster: '/assets/posters/bug-bounty.jpg',
    posterAlt: 'Bug Bounty official event poster',
    details: {
      date: EVENT_DATES,
      time: TBA,
      venue: 'SRM RAMAPURAM',
      teamSize: '2 MEMBERS',
      fee: '₹200 PER TEAM',
      prize: '₹3000',
    },
  },
  {
    no: '03',
    name: 'RED TEAM × BLUE TEAM',
    tag: 'LIVE EXERCISE',
    desc: 'Attackers breach. Defenders detect and contain. A head-to-head adversarial simulation on shared infrastructure.',
    poster: '/assets/posters/red-blue.jpg',
    posterAlt: 'Red Team vs Blue Team official event poster',
    details: {
      date: EVENT_DATES,
      time: TBA,
      venue: 'SRM RAMAPURAM',
      teamSize: TBA,
      fee: '₹250 PER TEAM',
      prize: TBA,
    },
  },
  {
    no: '04',
    name: 'PAPER PRESENTATION',
    tag: 'RESEARCH',
    desc: 'Present original security research before a panel of academics and practitioners. Best papers earn recognition and awards.',
    poster: '/assets/posters/paper-presentation.jpg',
    posterAlt: 'Paper Presentation official event poster',
    details: {
      date: EVENT_DATES,
      time: TBA,
      venue: 'SRM RAMAPURAM',
      teamSize: TBA,
      fee: TBA,
      prize: TBA,
    },
  },
  {
    no: '05',
    name: 'CYBER CONCLAVE',
    tag: 'PANEL',
    desc: 'Industry leaders and researchers in open conversation on the threats, tooling, and careers defining modern security.',
    poster: null,
    posterAlt: '',
    details: {
      date: EVENT_DATES,
      time: TBA,
      venue: 'SRM RAMAPURAM',
      teamSize: TBA,
      fee: TBA,
      prize: TBA,
    },
  },
  {
    no: '06',
    name: 'TOOL EXPO',
    tag: 'EXHIBITION',
    desc: 'Student-built security tooling on display — scanners, honeypots, OSINT frameworks, and hardware implants.',
    poster: '/assets/posters/tool-expo.jpg',
    posterAlt: 'Tool Expo official event poster',
    details: {
      date: EVENT_DATES,
      time: TBA,
      venue: 'SRM RAMAPURAM',
      teamSize: TBA,
      fee: '₹250 PER TEAM',
      prize: TBA,
    },
  },
  {
    no: '07',
    name: 'WORKSHOPS',
    tag: 'HANDS-ON',
    desc: 'Guided deep-dives with Supraja Technologies and Algorand. Bring a laptop, leave with a skillset.',
    poster: '/assets/posters/workshop-supraja.jpg',
    posterAlt: 'Supraja Technologies workshop official poster',
    extraPoster: '/assets/posters/workshop-algorand.jpg',
    extraPosterAlt: 'Algorand workshop official poster',
    details: {
      date: '7 OCTOBER',
      time: '10:00 — 1:00',
      venue: 'SRM RAMAPURAM',
      teamSize: TBA,
      fee: TBA,
      prize: TBA,
    },
  },
  {
    no: '08',
    name: 'SHARK TANK',
    tag: 'NON-TECHNICAL',
    desc: 'Pitch your idea to the panel and defend it under pressure. The strongest pitch takes the tank.',
    poster: '/assets/posters/shark-tank.jpg',
    posterAlt: 'Shark Tank official event poster',
    details: {
      date: EVENT_DATES,
      time: TBA,
      venue: 'SRM RAMAPURAM',
      teamSize: TBA,
      fee: '₹250 PER TEAM',
      prize: TBA,
    },
  },
  {
    no: '09',
    name: 'SHIPWRECK',
    tag: 'NON-TECHNICAL',
    desc: 'Argue your way off a sinking ship. Wit, persuasion, and quick thinking decide who stays afloat.',
    poster: '/assets/posters/shipwreck.jpg',
    posterAlt: 'Shipwreck official event poster',
    details: {
      date: EVENT_DATES,
      time: TBA,
      venue: 'SRM RAMAPURAM',
      teamSize: '1 — 2 MEMBERS',
      fee: '₹200 PER TEAM',
      prize: '₹3000',
    },
  },
  {
    no: '10',
    name: 'BEHIND THE CRIME',
    tag: 'NON-TECHNICAL',
    desc: 'Open the case file. Follow digital footprints, decrypt the messages, and unmask the intruder.',
    poster: '/assets/posters/behind-the-crime.jpg',
    posterAlt: 'Behind The Crime official event poster',
    details: {
      date: '7 OCTOBER',
      time: '10:00 — 1:00',
      venue: 'SRM',
      teamSize: TBA,
      fee: '₹250 PER TEAM',
      prize: TBA,
    },
  },
  {
    no: '11',
    name: 'CYBER AWARENESS RALLY',
    tag: 'NON-TECHNICAL',
    desc: 'A campus-wide rally spreading cyber hygiene and awareness — everyone marches, everyone learns.',
    poster: '/assets/posters/cyber-awareness-rally.jpg',
    posterAlt: 'Cyber Awareness Rally official event poster',
    details: {
      date: EVENT_DATES,
      time: TBA,
      venue: TBA,
      teamSize: TBA,
      fee: TBA,
      prize: TBA,
    },
  },
]
