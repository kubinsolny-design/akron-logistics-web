import { supabaseEnabled } from '../../supabase/config'
import { currentMember } from '../../supabase/server'
import { signOut } from './actions'
import { AuthShell } from './auth-shell'
import { LoginForm } from './login-form'
import { AdminPanel } from './panel'
import { AdminIcon } from './icons'
import './admin.css'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Administrace', robots: { index: false, follow: false } }

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const available = supabaseEnabled()
  const member = available ? await currentMember() : null
  if (!member) {
    const { error } = await searchParams
    return <AuthShell title="Vítejte zpět" description="Přihlaste se a spravujte obsah svého webu.">
      {!available ? <p className="admin-status" role="status">Přihlašování není momentálně dostupné. Kontaktujte správce webu.</p> : error && <p className="admin-error" role="alert">Přihlášení se nezdařilo. Zkontrolujte e-mail a heslo nebo využijte nápovědu níže.</p>}
      <LoginForm available={available} />
    </AuthShell>
  }
  const { data, error } = await member.client.from('cms_drafts').select('id,kind,data,revision').order('id')
  return <main className="akron-admin"><header className="admin-header">
    <div className="admin-brand"><span className="admin-brand-mark" aria-hidden="true">A<span>↗</span></span><div><h1>AKRON <span>Logistics</span></h1><p>Administrace webu</p></div></div>
    <div className="admin-header-actions"><a className="admin-open-site" href="/" target="_blank" rel="noreferrer">Otevřít web <AdminIcon name="external" /></a><div className="admin-account"><span className="admin-account-avatar" aria-hidden="true">{member.user.email?.slice(0, 1).toUpperCase() || 'A'}</span><div><strong>{member.user.email}</strong><span>{({ admin: 'Administrátor', editor: 'Uživatel', viewer: 'Pouze náhled' })[member.role]}</span></div></div><form action={signOut}><button>Odhlásit se</button></form></div></header>
    {error ? <p className="admin-error" role="alert">Obsah se nepodařilo načíst. Zkuste stránku obnovit.</p>
      : <AdminPanel documents={data || []} role={member.role} userId={member.user.id} />}
  </main>
}
