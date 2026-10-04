'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type NavigationLink = { href: string; label: string }

export function MobileNavigation({ links }: { links: NavigationLink[] }) {
  const pathname = usePathname()
  return <MobileMenu key={pathname} links={links} />
}

function MobileMenu({ links }: { links: NavigationLink[] }) {
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggle.current?.focus()
      }
    }
    const desktop = window.matchMedia('(min-width: 751px)')
    const resize = () => { if (desktop.matches) setOpen(false) }
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('keydown', escape)
    desktop.addEventListener('change', resize)
    return () => {
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('keydown', escape)
      desktop.removeEventListener('change', resize)
    }
  }, [open])

  return <div className="mobile-nav" ref={container}>
    <button ref={toggle} type="button" className="mobile-nav-toggle" aria-label={open ? 'Zavřít navigaci' : 'Otevřít navigaci'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(value => !value)}>
      <span aria-hidden="true" /><span aria-hidden="true" />
    </button>
    <nav id="mobile-navigation" aria-label="Mobilní navigace" hidden={!open}>
      {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}
      <Link href="/spoluprace#poptavka" onClick={() => setOpen(false)}>Poptat přepravu</Link>
    </nav>
  </div>
}
