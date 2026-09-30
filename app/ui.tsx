import Link from 'next/link'

const links = [
  { href: '/preprava', label: 'Přepravy' },
  { href: '/moznosti', label: 'Vozidla a směry' },
  { href: '/spoluprace', label: 'Spolupráce' },
]

export function Logo() {
  return <Link className="logo" href="/" aria-label="AKRON Logistics – úvod"><span>AKRON</span><small>LOGISTICS</small></Link>
}

export function Header() {
  return <header className="site-header">
    <div className="shell nav-wrap">
      <Logo />
      <nav className="desktop-nav" aria-label="Hlavní navigace">
        {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
      </nav>
      <Link className="nav-action" href="/spoluprace#poptavka">Poptat přepravu <span aria-hidden="true">↗</span></Link>
      <details className="mobile-nav">
        <summary><span className="sr-only">Otevřít navigaci</span><i></i><i></i></summary>
        <nav aria-label="Mobilní navigace">
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          <Link href="/spoluprace#poptavka">Poptat přepravu</Link>
        </nav>
      </details>
    </div>
  </header>
}

export function Footer() {
  return <footer className="site-footer" id="kontakt">
    <div className="shell footer-grid">
      <div><Logo /><p>Silniční přeprava a spedice<br />v Česku i za hranicemi.</p></div>
      <div className="footer-address"><strong>AKRON Logistics s.r.o.</strong><span>Ostravsko · Česká republika</span><span>Kontaktní údaje budou doplněny před zveřejněním.</span></div>
      <div className="footer-links">{links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div>
    </div>
    <div className="shell footer-bottom"><span>© {new Date().getFullYear()} AKRON Logistics s.r.o.</span><span>Neveřejný koncept</span></div>
  </footer>
}

export function Arrow() { return <span className="arrow" aria-hidden="true">↗</span> }

export function RouteLine() {
  return <div className="route-line" aria-hidden="true"><span></span><i></i><b></b></div>
}
