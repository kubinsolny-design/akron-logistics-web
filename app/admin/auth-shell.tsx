import Image from 'next/image'
import Link from 'next/link'

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="akron-admin admin-auth">
    <div className="admin-auth-layout">
      <aside className="admin-auth-brand">
        <Link href="/" aria-label="AKRON Logistics — úvod"><Image src="/images/akron-white.svg" alt="AKRON Logistics" width={875} height={280} priority /></Link>
        <div><span className="admin-auth-eyebrow">SPRÁVA VAŠEHO WEBU</span><h2>Vše důležité.<br />Na jednom místě.</h2><p>Upravujte obsah, pracujte s poptávkami a mějte přehled o změnách.</p></div>
        <span className="admin-auth-brand-bottom">AKRON Logistics · Administrace</span>
      </aside>
      <div className="admin-auth-content"><Link className="admin-auth-back" href="/">Zpět na web</Link>
        <div className="admin-auth-card"><p className="admin-kicker">ADMINISTRACE</p><h1>{title}</h1><p className="admin-auth-description">{description}</p>{children}</div>
        <p className="admin-auth-footnote">Přístup je určen pouze oprávněným uživatelům.</p>
      </div>
    </div>
  </section>
}
