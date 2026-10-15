/** Transactional HTML: inline styles and PNG branding also work without web fonts. */
export function invitationEmail({ origin, invitationLink, role, preview=false }: { origin: string; invitationLink: string; role: string; preview?:boolean }) {
  const escape = (value: string) => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')
  const roleLabel = ({admin:'Administrátor',editor:'Uživatel',viewer:'Pouze náhled'} as Record<string,string>)[role] || 'Uživatel'
  const permissions = role === 'admin' ? 'Správa obsahu webu, poptávek a uživatelských přístupů.' : role === 'viewer' ? 'Prohlížení obsahu webu bez úprav a bez přístupu k poptávkám.' : 'Úpravy obsahu webu a vyřizování poptávek. Bez správy uživatelských přístupů.'
  const subject = `${preview?'[NÁHLED] ':''}Pozvánka do administrace | AKRON Logistics`
  const text = `${preview?'NÁHLED VZHLEDU: Toto není skutečná pozvánka. Nevytváří účet ani nemění oprávnění. Tlačítko pouze otevře přihlášení.\n\n':''}Pozvánka do administrace AKRON Logistics\n\nSprávce webu AKRON Logistics vás pozval do administrace firemního webu.\nVáš přístup: ${roleLabel}. ${permissions}\n\nPřijmout pozvánku a nastavit vlastní heslo:\n${invitationLink}\n\nOdkaz je jednorázový a určený pouze vám. Nikomu jej nepřeposílejte. Pokud už neplatí, požádejte správce o novou pozvánku.\nPokud jste pozvánku nečekali, neklikejte na odkaz a ověřte ji u správce webu.\n\nAKRON Logistics s.r.o.\n${origin}/admin`
  const html = `<!doctype html><html lang="cs" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;background:#f2f4f7;color:#152236;font-family:Arial,Helvetica,sans-serif"><div lang="cs" dir="ltr">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Získejte přístup ke správě webu AKRON Logistics a nastavte si vlastní heslo.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-top:5px solid #ff5a00;border-radius:12px"><tr><td style="padding:32px 28px">
<img src="${escape(origin)}/images/akron-email-logo.png" width="220" height="70" alt="AKRON Logistics" style="display:block;width:220px;max-width:100%;height:auto;margin-bottom:28px">
${preview?'<p style="padding:12px;border:1px solid #ff5a00;font-size:14px;line-height:1.6"><strong>NÁHLED VZHLEDU</strong><br>Toto není skutečná pozvánka. Nevytváří účet ani nemění oprávnění. Tlačítko pouze otevře přihlášení.</p>':''}
<p style="margin:0 0 10px;font-size:12px;font-weight:bold;letter-spacing:1px;color:#526174">SPRÁVA FIREMNÍHO WEBU</p>
<h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#152236">Pozvánka do administrace</h1>
<p style="margin:0 0 22px;font-size:16px;line-height:1.65">Správce webu <strong>AKRON Logistics</strong> vás pozval do administrace firemního webu. Přijměte pozvánku a nastavte si vlastní heslo.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;border-radius:8px"><tr><td style="padding:16px"><p style="margin:0 0 6px;font-size:14px;line-height:1.5">Váš přístup: <strong>${escape(roleLabel)}</strong></p><p style="margin:0;font-size:14px;line-height:1.6;color:#526174">${escape(permissions)}</p></td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td bgcolor="#ff5a00" style="border-radius:6px;mso-padding-alt:16px 24px"><a href="${escape(invitationLink)}" style="display:inline-block;box-sizing:border-box;padding:16px 24px;border:1px solid #ff5a00;border-radius:6px;background:#ff5a00;color:#152236;text-decoration:none;font-size:16px;font-weight:bold;line-height:1.5">Přijmout pozvánku</a></td></tr></table>
<p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#526174">Odkaz je jednorázový a určený pouze vám. Nikomu jej nepřeposílejte. Pokud už neplatí, požádejte správce o novou pozvánku.</p>
<p style="margin:0;font-size:14px;line-height:1.65;color:#526174">Pokud jste pozvánku nečekali, neklikejte na odkaz a ověřte ji u správce webu.</p>
<hr style="border:0;border-top:1px solid #dce1e8;margin:28px 0 18px"><p style="margin:0;font-size:13px;line-height:1.7;color:#526174"><strong>AKRON Logistics s.r.o.</strong><br><a href="${escape(origin)}/admin" style="color:#152236;text-decoration:underline">Administrace webu AKRON Logistics</a></p>
</td></tr></table></td></tr></table></div></body></html>`
  return {subject,html,text}
}
