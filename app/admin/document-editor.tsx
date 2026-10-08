'use client'

import { useEffect, useRef, useState } from 'react'
import { portableTextHtml, readDocument, safeTextLink, type TextValue } from './rich-text'

export function DocumentEditor({ value, onChange, disabled }: { value: TextValue[]; onChange: (value: TextValue[]) => void; disabled: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const selection = useRef<Range | null>(null)
  const emitted = useRef('')
  const [linkOpen, setLinkOpen] = useState(false)
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    const serialized = JSON.stringify(value)
    if (root.current && serialized !== emitted.current) {
      root.current.innerHTML = portableTextHtml(value)
      emitted.current = serialized
      selection.current = null
    }
  }, [value])
  function remember() {
    const range = window.getSelection()
    if (range?.rangeCount && root.current?.contains(range.anchorNode) && root.current?.contains(range.focusNode)) selection.current = range.getRangeAt(0).cloneRange()
  }
  function sync() {
    if (!root.current || disabled) return
    const next = readDocument(root.current, value)
    emitted.current = JSON.stringify(next)
    onChange(next)
    remember()
  }
  function command(name: string, argument?: string) {
    if (disabled || !root.current) return
    root.current.focus()
    if (selection.current && root.current.contains(selection.current.commonAncestorContainer)) {
      const current = window.getSelection(); current?.removeAllRanges(); current?.addRange(selection.current)
    }
    // Browser editing commands retain the native undo history; saved content is converted to safe structured data.
    if (!document.execCommand(name, false, argument)) setError('Nejdříve klikněte do textu nebo označte text, který chcete upravit.')
    else setError('')
    sync()
  }
  const tools = [ ['bold', 'Tučně', 'B'], ['italic', 'Kurzíva', 'I'], ['underline', 'Podtržení', 'U'], ['insertUnorderedList', 'Odrážky', '• Seznam'], ['insertOrderedList', 'Číslovaný seznam', '1. Seznam'], ['undo', 'Zpět', '↶'], ['redo', 'Znovu', '↷'] ]
  return <fieldset className="admin-document-editor"><legend>Text stránky</legend>
    <p className="admin-muted">Celý článek upravujte na jednom listu. Klikněte do odstavce pro změnu nadpisu nebo označte text pro formátování.</p>
    <div className="admin-document-toolbar" role="group" aria-label="Formátování textu stránky">
      <label>Styl odstavce<select aria-label="Styl odstavce" defaultValue="" disabled={disabled} onMouseDown={remember} onChange={event => { command('formatBlock', event.target.value); event.target.value = '' }}><option value="" disabled>Vybrat styl…</option><option value="p">Běžný text</option><option value="h2">Nadpis 2</option><option value="h3">Nadpis 3</option><option value="h4">Nadpis 4</option><option value="blockquote">Citace</option></select></label>
      {tools.map(([name, label, text]) => <button type="button" key={name} disabled={disabled} aria-label={label} title={label} onMouseDown={event => { event.preventDefault(); remember() }} onClick={() => command(name)}>{text}</button>)}
      <button type="button" disabled={disabled} onMouseDown={event => { event.preventDefault(); remember() }} onClick={() => { setLinkOpen(!linkOpen); setLink(''); setError('') }}>Odkaz</button>
      <button type="button" disabled={disabled} onMouseDown={event => { event.preventDefault(); remember() }} onClick={() => command('unlink')}>Odebrat odkaz</button>
    </div>
    {linkOpen && <div className="admin-document-link"><label>Adresa odkazu<input type="text" value={link} placeholder="https://… nebo /cookies" onChange={event => setLink(event.target.value)} /></label><button type="button" onClick={() => { if (!safeTextLink(link)) { setError('Zadejte webovou adresu, e-mail, telefon nebo odkaz na stránku.'); return }; command('createLink', link); setLinkOpen(false) }}>Vložit odkaz</button><button type="button" onClick={() => setLinkOpen(false)}>Zrušit</button></div>}
    {error && <p className="admin-status admin-status-error" role="alert">{error}</p>}
    <div className="admin-document-paper"><div ref={root} className="admin-document-content" contentEditable={!disabled} suppressContentEditableWarning role="textbox" aria-label="Text stránky — dokumentový editor" aria-multiline="true" aria-readonly={disabled} tabIndex={0} onInput={sync} onMouseUp={remember} onKeyUp={remember} onPaste={event => { event.preventDefault(); remember(); command('insertText', event.clipboardData.getData('text/plain')) }} onDrop={event => event.preventDefault()} /></div>
    <small className="admin-muted">{disabled ? 'Pouze náhled — tento účet nemůže text měnit.' : 'Změny se uloží až tlačítkem „Uložit koncept“. Vložený text se přenáší bez cizích stylů a obrázků.'}</small>
  </fieldset>
}
