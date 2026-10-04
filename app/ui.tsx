import Link from 'next/link'
import Image from 'next/image'
import { company } from './site'
import { CookieSettingsButton } from './cookie-preferences'

const links = [
  { href: '/preprava', label: 'Přepravy' },
  { href: '/moznosti', label: 'Vozidla a směry' },
  { href: '/spoluprace', label: 'Spolupráce' },
]

export function Logo({ light = false }: { light?: boolean }) {
  return <Link className="logo" href="/" aria-label="AKRON Logistics – úvod"><Image src={`/images/akron-${light ? 'white' : 'black'}.svg`} alt="AKRON Logistics" width={875} height={280} priority={!light} /></Link>
}

export function Header() {
  return <header className="site-header">
    <div className="shell nav-wrap">
      <Logo />
      <nav className="desktop-nav" aria-label="Hlavní navigace">
        {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
      </nav>
      <Link className="nav-action" href="/spoluprace#poptavka">Poptat přepravu</Link>
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
      <div><Logo light /><p>Silniční přeprava a spedice<br />v Česku i za hranicemi.</p></div>
      <div className="footer-address">
        <strong>{company.name}</strong>
        <span>{company.street}</span>
        <span>{company.city}</span>
        <span>IČO {company.registrationNumber}</span>
      </div>
      <div className="footer-contact">
        <span>Přepravu s vámi řeší</span>
        <strong>{company.contactName}</strong>
        <a href={company.phoneHref}>{company.phone}</a>
        <a href={`mailto:${company.email}`}>{company.email}</a>
        <Link className="footer-action" href="/spoluprace#poptavka">Poslat poptávku</Link>
      </div>
      <div className="footer-links">{links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div>
    </div>
    <div className="shell footer-bottom"><span>© {new Date().getFullYear()} {company.name}</span><span>Vnitrostátní a mezinárodní silniční přeprava</span></div>
    <nav className="shell footer-legal" aria-label="Právní informace"><Link href="/ochrana-osobnich-udaju">Ochrana osobních údajů</Link><Link href="/cookies">Cookies</Link><CookieSettingsButton /></nav>
    <p className="footer-credit">Vytvořili <a href="https://webaci.cz" target="_blank" rel="noopener noreferrer">Webáci</a></p>
  </footer>
}


export function RouteJourney() {
  return <div className="route-journey" aria-hidden="true">
    <div className="route-track">
      <span className="route-point route-point-start"><i>A</i><small>Nakládka</small></span>
      <span className="route-point route-point-end"><i>B</i><small>Doručení</small></span>
      <span className="route-truck">
        <svg viewBox="0 0 210 78" focusable="false">
          <path className="route-trailer" d="M3 12h133v43H3z" />
          <path className="route-trailer-edge" d="M11 19h117M11 47h117M19 22v22M45 22v22M71 22v22M97 22v22M123 22v22" />
          <path className="route-chassis" d="M5 55h195" />
          <path className="route-cab" d="M136 19h39l23 22 8 2v12h-70z" />
          <path className="route-window" d="M146 25h25l16 16h-41z" />
          <path className="route-cab-accent" d="M143 45h48" />
          <path className="route-cab-detail" d="M177 24v31M192 45h11M192 49h11M144 32h-6M139 28v10" />
          <path className="route-light" d="M199 42h7v5h-7z" />
          <g className="route-wheels">
            <circle className="route-wheel" cx="31" cy="57" r="10" />
            <circle className="route-hub" cx="31" cy="57" r="3" />
            <circle className="route-wheel" cx="110" cy="57" r="10" />
            <circle className="route-hub" cx="110" cy="57" r="3" />
            <circle className="route-wheel" cx="169" cy="57" r="10" />
            <circle className="route-hub" cx="169" cy="57" r="3" />
          </g>
        </svg>
      </span>
    </div>
  </div>
}
