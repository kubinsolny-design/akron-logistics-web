import { AuthShell } from '../auth-shell'
import { ForgotPasswordForm } from './recovery-form'
import { supabaseEnabled } from '../../../supabase/config'
import '../admin.css'

export const metadata = { title: 'Obnova hesla', robots: { index: false, follow: false } }
export default function ForgotPasswordPage() {
  return <AuthShell title="Zapomněl jsem heslo" description="Zadejte přihlašovací e-mail. Pošleme vám odkaz, přes který si bezpečně nastavíte nové heslo.">
    <ForgotPasswordForm available={supabaseEnabled()} />
  </AuthShell>
}
