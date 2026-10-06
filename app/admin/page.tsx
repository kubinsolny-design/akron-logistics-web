import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseEnabled } from '../../supabase/config'
import { currentMember } from '../../supabase/server'
import { signIn, signOut } from './actions'
import { AdminPanel } from './panel'
import './admin.css'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Administrace | AKRON Logistics', robots: { index: false, follow: false } }

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!supabaseEnabled()) redirect('/studio/obsah')
  const member = await currentMember()
  if (!member) {
    const { error } = await searchParams
    return <main className="akron-admin"><div className="admin-login">
      <p className="admin-kicker">AKRON LOGISTICS</p><h1>Administrace webu</h1>
      <p>Přihlaste se e-mailem a heslem. Při prvním přihlášení použijte pozvánku ve svém e-mailu.</p>
      {error && <p role="alert">Přihlášení se nezdařilo. Zkontrolujte údaje a přidělený přístup.</p>}
      <form action={signIn}><label>E-mail<input name="email" type="email" autoComplete="username" required maxLength={254} /></label>
        <label>Heslo<input name="password" type="password" autoComplete="current-password" required maxLength={1024} /></label>
        <button type="submit">Přihlásit se</button></form>
      <Link href="/">Zpět na web</Link>
    </div></main>
  }
  const { data, error } = await member.client.from('cms_drafts').select('id,kind,data,revision').order('id')
  return <main className="akron-admin"><header className="admin-header"><div>
    <p className="admin-kicker">AKRON LOGISTICS</p><h1>Administrace</h1>
    <p>{member.user.email} · {({ admin: 'Admin', editor: 'Uživatel', viewer: 'Pouze náhled' })[member.role]}</p>
  </div><div><a href="/" target="_blank" rel="noreferrer">Otevřít web ↗</a><form action={signOut}><button>Odhlásit se</button></form></div></header>
    {error ? <p role="alert">Obsah se nepodařilo načíst. Zkuste stránku obnovit.</p>
      : <AdminPanel documents={data || []} role={member.role} userId={member.user.id} />}
  </main>
}
