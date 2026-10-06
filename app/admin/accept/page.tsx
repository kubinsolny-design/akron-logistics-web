import { redirect } from 'next/navigation'
import { supabaseEnabled } from '../../../supabase/config'
import { AcceptInvite } from './accept-invite'
import '../admin.css'

export const metadata = { title: 'Přijetí pozvánky | AKRON', robots: { index: false, follow: false } }
export default function Page() {
  if (!supabaseEnabled()) redirect('/studio/obsah')
  return <main className="akron-admin"><div className="admin-login"><p className="admin-kicker">AKRON LOGISTICS</p>
    <h1>Vítejte v administraci</h1><AcceptInvite /></div></main>
}
