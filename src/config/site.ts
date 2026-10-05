/** Site-wide settings that are not academic content. */
export const site = {
  title: 'Dr. Rajakumar Arul',
  description:
    'Associate Professor and Head of the Department of Quantum Computing, VIT Chennai — research in quantum computing, post-quantum cryptography, quantum key distribution and network security.',
  locale: 'en-IN',

  /**
   * Show amber "To verify" markers (from `verify:` notes in the content files).
   * On by default only in the local preview (`npm run dev`), so the live site
   * stays clean while the notes remain a to-do list. Set to true to show them
   * on the live site as well.
   */
  showVerificationNotes: import.meta.env.DEV,

  /** Homepage "Academic Moments" carousel. Auto-advance never runs for reduced-motion visitors. */
  gallery: {
    autoplay: true,
    intervalMs: 6500,
  },

  nav: [
    { label: 'About', href: '/about' },
    { label: 'Research', href: '/research' },
    { label: 'Projects', href: '/projects' },
    { label: 'Publications', href: '/publications' },
    { label: 'Leadership', href: '/leadership' },
    { label: 'Teaching', href: '/teaching' },
    { label: 'Activities', href: '/activities' },
    { label: 'News', href: '/news' },
    { label: 'Gallery', href: '/gallery' },
  ],
  contact: { label: 'Contact', href: '/contact' },
} as const;
