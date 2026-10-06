'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useClient, useCurrentUser } from 'sanity'

type Member = {
  sanityUserId: string
  profile: { displayName: string; email: string; isCurrentUser?: boolean }
  memberships: { resourceType: string; resourceId: string; roleNames: string[] }[]
}
type Invite = { id: string; email?: string; role: string; status: string }
type Page<T> = { data: T[]; nextCursor: string | null }
type Role = { name: string }
type Change = { kind: 'invite'; email: string; role: string } | { kind: 'role'; member: Member; role: string }
const labels: Record<string, string> = { administrator: 'Admin', editor: 'Uživatel — úpravy obsahu', viewer: 'Uživatel — pouze čtení', developer: 'Vývojář', contributor: 'Přispěvatel' }
const manageUrl = 'https://www.sanity.io/manage/project/l802e097/members'

export function UsersTool() {
  const studioClient = useClient({ apiVersion: '2025-07-11' })
  const user = useCurrentUser()
  // The authenticated Studio session is used, never the server's privileged write token.
  const client = useMemo(() => studioClient.withConfig({ useProjectHostname: false, useCdn: false }), [studioClient])
  const projectId = client.config().projectId!
  const base = `/access/project/${projectId}`
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [change, setChange] = useState<Change | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const isSelf = (member: Member) => Boolean(member.profile.isCurrentUser || member.sanityUserId === user?.id || (user?.email && member.profile.email.toLowerCase() === user.email.toLowerCase()))
  useEffect(() => {
    const controller = new AbortController()
    client.request<{ data: Record<string, boolean> }>({ url: `${base}/user-permissions/me/check`, query: { permissions: ['sanity.project.members.read', 'sanity.project.members.invite', 'sanity.project.members.update'] }, signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setIsAdmin(['sanity.project.members.read', 'sanity.project.members.invite', 'sanity.project.members.update'].every(permission => result.data[permission])) })
      .catch(() => { if (!controller.signal.aborted) setMessage('Oprávnění se nepodařilo ověřit. Správa uživatelů zůstává uzamčená.') })
      .finally(() => { if (!controller.signal.aborted) setCheckingAccess(false) })
    return () => controller.abort()
  }, [client, base])
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!isAdmin) return
    try {
      const [people, pending, available] = await Promise.all([
        client.request<Page<Member>>({ url: `${base}/users`, query: { limit: '100' }, signal }),
        client.request<Page<Invite>>({ url: `${base}/invites`, query: { limit: '100' }, signal }),
        client.request<Page<Role>>({ url: `${base}/roles`, query: { limit: '100' }, signal }),
      ])
      if (signal?.aborted) return
      setMembers(people.data); setCursor(people.nextCursor); setInvites(pending.data); setRoles(available.data)
    } catch {
      if (!signal?.aborted) setMessage('Seznam se nepodařilo načíst. Obnovte stránku nebo otevřete správu přístupů v Sanity.')
    } finally { if (!signal?.aborted) setLoading(false) }
  }, [isAdmin, client, base])
  useEffect(() => {
    const controller = new AbortController()
    // load updates state only after the asynchronous API response, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  async function loadMore() {
    if (!cursor || !isAdmin) return
    setBusy(true)
    try {
      const page = await client.request<Page<Member>>({ url: `${base}/users`, query: { limit: '100', nextCursor: cursor } })
      setMembers(previous => [...previous, ...page.data]); setCursor(page.nextCursor)
    } catch { setMessage('Další uživatele se nepodařilo načíst.') }
    finally { setBusy(false) }
  }
  async function confirmChange() {
    if (!change || !isAdmin || busy) return
    setBusy(true); setMessage('')
    try {
      if (change.kind === 'invite') {
        await client.request({ url: `${base}/invites`, method: 'POST', body: { email: change.email, role: change.role } })
        setEmail(''); setMessage('Pozvánka byla odeslána přes Sanity. Přístup vznikne až po jejím přijetí.')
      } else {
        if (isSelf(change.member)) throw new Error('Vlastní roli zde neměňte.')
        await client.request({ url: `${base}/users/${encodeURIComponent(change.member.sanityUserId)}/roles`, method: 'PUT', body: { roleNames: [change.role] } })
        setMessage('Přístup uživatele byl aktualizován.')
      }
      setChange(null); await load()
    } catch {
      setMessage('Změna se nezdařila. Ověřte oprávnění a dostupnost role v tarifu Sanity. Zkuste také nativní správu přístupů. Posledního admina Sanity nedovolí odebrat.')
    } finally { setBusy(false) }
  }
  const available = ['editor', 'administrator', 'viewer'].filter(name => roles.some(role => role.name === name))
  const memberRoles = (member: Member) => member.memberships.filter(membership => membership.resourceType === 'project' && membership.resourceId === projectId).flatMap(membership => membership.roleNames)
  return <div className="cms-admin-tool">
    <h1>Uživatelé a přístupy</h1>
    <p>Každý má vlastní účet. Uživatel upravuje obsah a poptávky; admin navíc zve a spravuje uživatele. Oprávnění kontroluje Sanity i při přímém požadavku na data.</p>
    <div className="cms-admin-notice"><strong>Tarif a ochrana dat</strong><p>Uživatel s úpravami (Editor) a soukromé poptávky vyžadují Growth nebo aktivní zkušební verzi. Free umožňuje Admin a pouze čtení (Viewer). Admin má plná projektová oprávnění, proto ho přidělujte jen důvěryhodným osobám. Editor může číst i soukromé poptávky tohoto projektu.</p><a href="https://www.sanity.io/pricing" target="_blank" rel="noopener noreferrer">Aktuální podmínky Sanity</a></div>
    {checkingAccess ? <p role="status">Ověřuji oprávnění…</p> : !isAdmin ? <p role="status">Správu přístupů může otevřít pouze admin. Tento účet nemá oprávnění spravovat uživatele.</p> : <>
      <section><h2>Pozvat dalšího uživatele</h2><p>Pozvánku posílá Sanity, takže nepotřebuje ověřený Resend. Samotné vyplnění formuláře nic neposílá.</p>
        <form onSubmit={event => { event.preventDefault(); if (available.includes(inviteRole)) setChange({ kind: 'invite', email: email.trim(), role: inviteRole }) }}>
          <label htmlFor="invite-email">E-mail pozvaného uživatele</label><input id="invite-email" type="email" required maxLength={254} autoComplete="off" value={email} onChange={event => setEmail(event.target.value)} disabled={busy} />
          <label htmlFor="invite-role">Přístup</label><select id="invite-role" value={inviteRole} onChange={event => setInviteRole(event.target.value)} disabled={busy || loading}><option value="editor" disabled={!available.includes('editor')}>Uživatel — úpravy obsahu</option><option value="administrator" disabled={!available.includes('administrator')}>Admin</option><option value="viewer" disabled={!available.includes('viewer')}>Uživatel — pouze čtení</option></select>
          <button type="submit" disabled={busy || loading || !available.includes(inviteRole)}>Připravit pozvánku</button>
        </form>
      </section>
      {change && <section className="cms-admin-confirm" aria-label="Potvrzení změny přístupu"><h2>Potvrzení {change.kind === 'invite' ? 'pozvánky' : 'změny přístupu'}</h2><p><strong>{change.kind === 'invite' ? change.email : change.member.profile.email}</strong> → {labels[change.role]}</p><p>{change.role === 'administrator' ? 'Tato osoba bude moci spravovat obsah, poptávky, členy a další nastavení projektu.' : change.role === 'editor' ? 'Tato osoba bude moci upravovat a publikovat obsah a pracovat s poptávkami. Nebude spravovat uživatele.' : 'Tato osoba bude moci obsah a poptávky pouze číst, nikoli měnit.'}</p><p>{change.kind === 'invite' ? 'Potvrzením odešlete e-mailovou pozvánku a po jejím přijetí udělíte uvedený přístup.' : 'Potvrzením nahradíte současné projektové role touto rolí. Ostatní projektová oprávnění budou odebrána.'}</p><button type="button" disabled={busy} onClick={() => void confirmChange()}>{busy ? 'Ukládám…' : change.kind === 'invite' ? 'Odeslat pozvánku' : 'Potvrdit změnu role'}</button><button type="button" disabled={busy} onClick={() => setChange(null)}>Zrušit</button></section>}
      <section><h2>Aktuální uživatelé</h2><button type="button" disabled={loading || busy} onClick={() => { setLoading(true); void load() }}>Obnovit seznam</button>{loading && <p role="status">Načítám přístupy…</p>}
        <ul className="cms-admin-members">{members.map(member => <li key={member.sanityUserId}><strong>{member.profile.displayName || member.profile.email}</strong><span>{member.profile.email}</span><span>{memberRoles(member).map(role => labels[role] || role).join(', ')}</span>{isSelf(member) ? <small>Váš účet — vlastní roli zde nelze změnit</small> : <label>Připravit změnu role<select value="" disabled={busy || loading} onChange={event => { if (available.includes(event.target.value)) setChange({ kind: 'role', member, role: event.target.value }) }}><option value="">Vyberte přístup</option>{available.map(role => <option key={role} value={role}>{labels[role]}</option>)}</select></label>}</li>)}</ul>
        {cursor && <button type="button" disabled={busy} onClick={() => void loadMore()}>Načíst další uživatele</button>}
      </section>
      <section><h2>Čekající pozvánky</h2>{invites.length ? <ul>{invites.map(invite => <li key={invite.id}>{invite.email} — {labels[invite.role] || invite.role}</li>)}</ul> : <p>Žádné načtené čekající pozvánky.</p>}<p>Úplný seznam a odvolání pozvánek najdete v nativní správě Sanity.</p></section>
      <a href={manageUrl} target="_blank" rel="noopener noreferrer">Otevřít správu přístupů v Sanity</a>
    </>}
    {message && <p role="status" className="cms-admin-notice">{message}</p>}
  </div>
}
