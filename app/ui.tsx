import Link from 'next/link'
import Image from 'next/image'
import { getSettings } from '../content/content'
import { imageUrl, safeHref } from '../content/client'
import { CookieSettingsButton } from './cookie-preferences'
import { MobileNavigation } from './mobile-navigation'
import { publicNavigationLabel } from './public-links'
import { siteTextDefaults } from './site-text'

export function Logo({ light = false, src }: { light?: boolean; src?: string }) {
  return <Link className="logo" href="/" aria-label="AKRON Logistics – úvod"><Image src={src || `/images/akron-${light ? 'white' : 'black'}.svg`} alt="AKRON Logistics" width={875} height={280} priority={!light} /></Link>
}

export async function Header() {
  const settings = await getSettings()
  const navigation = settings.navigation.map(link => ({ label: publicNavigationLabel(link.label || '', link.href || ''), href: safeHref(link.href) }))
  return <header className="site-header">
    <div className="shell nav-wrap">
      <Logo src={imageUrl(settings.logo, 900)} />
      <nav className="desktop-nav" aria-label="Hlavní navigace">
        {navigation.map((link, i) => <Link key={`${link.href}-${i}`} href={link.href}>{link.label}</Link>)}
      </nav>
      <Link className="nav-action" href={safeHref(settings.headerAction?.href)}>{settings.headerAction?.label}</Link>
      <MobileNavigation links={navigation} action={{label:settings.headerAction?.label || 'Poptat přepravu',href:safeHref(settings.headerAction?.href)}} />
    </div>
  </header>
}

export async function Footer() {
  const company = await getSettings()
  const text = {...siteTextDefaults,...company.siteText}
  return <footer className="site-footer" id="kontakt">
    <div className="shell footer-grid">
      <div><Logo light src={imageUrl(company.lightLogo, 900)} /><p className="cms-paragraph">{company.footerText}</p></div>
      <div className="footer-address">
        <strong>{company.name}</strong>
        <span>{company.street}</span>
        <span>{company.city}</span>
        <span>IČO {company.registrationNumber}</span>
      </div>
      <div className="footer-contact">
        <span>{company.footerContactLabel}</span>
        <strong>{company.contactName}</strong>
        <a href={company.phoneHref}>{company.phone}</a>
        <a href={`mailto:${company.email}`}>{company.email}</a>
      </div>
      <nav className="footer-links" aria-label="Navigace v patičce">
        {company.navigation.map((link, i) => <Link key={link._key || i} href={safeHref(link.href)}>{publicNavigationLabel(link.label || '', link.href || '')}</Link>)}
        <Link href={safeHref(company.footerAction?.href)}>{company.footerAction?.label}</Link>
      </nav>
    </div>
    <div className="shell footer-bottom"><span>© {new Date().getFullYear()} {company.name}</span><nav className="footer-legal" aria-label="Právní informace"><Link href="/ochrana-osobnich-udaju">{text.privacyLabel}</Link><Link href="/cookies">{text.cookiesLabel}</Link><CookieSettingsButton label={text.cookieSettings} /></nav></div>
    <div className="shell footer-credit-row"><p className="footer-credit">{text.footerCreditPrefix} <a href={safeHref(text.footerCreditHref)} target="_blank" rel="noopener noreferrer">{text.footerCreditLabel}</a></p></div>
  </footer>
}


export function RouteJourney({loadingLabel='Nakládka',deliveryLabel='Doručení'}:{loadingLabel?:string;deliveryLabel?:string}={}) {
  return <div className="route-journey" aria-hidden="true">
    <div className="route-track">
      <span className="route-point route-point-start"><i>A</i><small>{loadingLabel}</small></span>
      <span className="route-point route-point-end"><i>B</i><small>{deliveryLabel}</small></span>
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
