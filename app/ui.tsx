import Link from 'next/link'
import { company } from './site'

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
      <div className="footer-address">
        <strong>{company.name}</strong>
        <span>{company.street}</span>
        <span>{company.city}</span>
        <span>IČO {company.registrationNumber}</span>
      </div>
      <div className="footer-contact">
        <span>Přepravu s vámi řeší</span>
        <strong>{company.contactName}</strong>
        <Link className="footer-action" href="/spoluprace#poptavka">Poslat poptávku <Arrow /></Link>
      </div>
      <div className="footer-links">{links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div>
    </div>
    <div className="shell footer-bottom"><span>© {new Date().getFullYear()} {company.name}</span><span>Vnitrostátní a mezinárodní silniční přeprava</span></div>
  </footer>
}

export function Arrow() { return <span className="arrow" aria-hidden="true">↗</span> }

export function RouteJourney() {
  return <div className="route-journey" aria-hidden="true">
    <div className="route-track">
      <span className="route-point route-point-start"><i>A</i><small>Nakládka</small></span>
      <span className="route-point route-point-end"><i>B</i><small>Doručení</small></span>
      <span className="route-truck">
        <svg viewBox="0 0 152 58">
          <path d="M3 10h92v35H3zM95 22h31l20 16v7H95z" />
          <path className="route-window" d="M103 27h20l11 9h-31z" />
          <circle cx="31" cy="46" r="8" /><circle cx="118" cy="46" r="8" />
        </svg>
      </span>
    </div>
  </div>
}
