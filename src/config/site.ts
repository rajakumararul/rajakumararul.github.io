/** Site-wide settings that are not academic content. */
export const site = {
  title: 'Dr. Rajakumar Arul',
  description:
    'Associate Professor and Head of the Department of Quantum Computing, VIT Chennai — research in quantum computing, post-quantum cryptography, quantum key distribution and network security.',
  locale: 'en-IN',

  /**
   * Show amber "To verify" markers for details that still need confirmation.
   * Set to false once the content has been reviewed.
   */
  showVerificationNotes: true,

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
