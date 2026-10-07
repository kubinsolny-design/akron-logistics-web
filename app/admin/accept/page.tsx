import { supabaseEnabled } from '../../../supabase/config'
import { AcceptInvite } from './accept-invite'
import { AuthShell } from '../auth-shell'
import '../admin.css'

export const metadata = { title: 'Nastavení přístupu', robots: { index: false, follow: false } }
export default function Page() {
  return <AuthShell title="Váš přístup k webu" description="Dokončete nastavení přístupu do administrace.">
    {supabaseEnabled() ? <AcceptInvite /> : <p className="admin-status" role="status">Přihlašování není momentálně dostupné. Kontaktujte správce webu.</p>}
  </AuthShell>
}
