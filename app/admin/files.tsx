'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { browserClient } from '../../supabase/browser'
import { AdminIcon } from './icons'
import { maxFileSize, mediaUploadPath, referencedMedia, uploadTypes, type MediaFile } from './media'
import { trashMedia, restoreMedia } from './manage-actions'

function fileSize(value?: number) { return value == null ? 'Velikost neuvedena' : value < 1024 * 1024 ? `${Math.ceil(value / 1024)} kB` : `${(value / (1024 * 1024)).toFixed(1)} MB` }
function isImage(file: MediaFile) { return file.mime?.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)(?:\?|$)/i.test(file.url) }

export function AdminFiles({ documents, readOnly, admin=false }: { documents: { data: unknown }[]; readOnly: boolean; admin?:boolean }) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [reload, setReload] = useState(0)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedUrl, setSelectedUrl] = useState('')
  const [trash,setTrash]=useState<{id:string;path:string}[]>([])
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError('')
      const referenced = referencedMedia(documents)
      if(admin) {const {data}=await browserClient().from('cms_media_trash').select('id,path').eq('state','trashed');if(!cancelled)setTrash(data||[])}
      try {
        const bucket = browserClient().storage.from('site-media')
        const collected: MediaFile[] = []
        const folders = ['']
        const visited = new Set<string>()
        // Supabase lists one folder at a time; include nested folders and all pages.
        for (let i = 0; i < folders.length && !cancelled; i++) {
          const folder = folders[i]
          if (visited.has(folder)) continue
          visited.add(folder)
          for (let offset = 0; !cancelled; offset += 100) {
            const { data, error } = await bucket.list(folder, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } })
            if (error) throw error
            for (const item of data || []) {
              const path = folder ? `${folder}/${item.name}` : item.name
              if (!item.id) { folders.push(path); continue }
              if (item.name === '.emptyFolderPlaceholder') continue
              collected.push({ path, name: item.name, source: 'storage', url: bucket.getPublicUrl(path).data.publicUrl, mime: item.metadata?.mimetype, size: item.metadata?.size, created: item.created_at || undefined })
            }
            if ((data || []).length < 100) break
          }
        }
        if (!cancelled) {
          const urls = new Set(collected.map(file => file.url))
          setFiles([...collected, ...referenced.filter(file => !urls.has(file.url))])
        }
      } catch {
        if (!cancelled) { setFiles(referenced); setError('Úložiště se nepodařilo načíst. Zobrazené jsou pouze soubory odkazované v obsahu webu. Zkuste obnovit seznam.') }
      } finally { if (!cancelled) setLoading(false) }
    }
    void load()
    return () => { cancelled = true }
  }, [documents, reload, admin])

  async function remove(path:string) {
    if(!admin || !window.confirm('Přesunout tento nepoužívaný soubor do soukromého koše? Použité soubory nelze smazat.'))return
    setUploading(true);setError('');setNotice('')
    try{const result=await trashMedia(path);if(!result.ok)setError(result.message);else{setNotice(result.message);setReload(value=>value+1)}}finally{setUploading(false)}
  }
  async function restore(id:string) {
    setUploading(true);setError('');setNotice('')
    try{const result=await restoreMedia(id);if(!result.ok)setError(result.message);else{setNotice(result.message);setReload(value=>value+1)}}finally{setUploading(false)}
  }

  async function upload(file: File) {
    if (readOnly || uploading) return
    setError(''); setNotice('')
    if (!uploadTypes[file.type] || file.size <= 0 || file.size > maxFileSize) { setError('Vyberte JPEG, PNG, WebP nebo PDF do 10 MB. Soubor nesmí být prázdný.'); return }
    setUploading(true)
    try {
      const bucket = browserClient().storage.from('site-media')
      const path = mediaUploadPath(file, crypto.randomUUID())
      const { error } = await bucket.upload(path, file, { upsert: false, contentType: file.type, cacheControl: '3600' })
      if (error) throw error
      setSelectedUrl(bucket.getPublicUrl(path).data.publicUrl)
      setNotice('Soubor je nahraný. Zkopírujte odkaz a vložte jej do příslušné stránky. Nahrání samo obsah stránky nezmění.')
      setReload(value => value + 1); setPage(0)
    } catch { setError('Soubor se nepodařilo nahrát. Ověřte přístup, připojení a povolené typy souborů v úložišti.') }
    finally { setUploading(false) }
  }
  async function copy(url: string) {
    setSelectedUrl(url)
    try { await navigator.clipboard.writeText(url); setNotice('Odkaz byl zkopírován. V Obsahu stránek jej vložte do adresy obrázku nebo cílového odkazu na PDF.') }
    catch { setNotice('Odkaz najdete v poli níže. Označte jej a zkopírujte ručně.') }
  }
  const visible = files.filter(file => `${file.name} ${file.path}`.toLocaleLowerCase('cs').includes(query.toLocaleLowerCase('cs')) && (filter === 'all' || (filter === 'images' ? isImage(file) : !isImage(file))))
  const shown = visible.slice(page * 24, (page + 1) * 24)
  return <section className="admin-records admin-files">
    <div className="admin-files-intro"><div><h3>Knihovna souborů</h3><p>Nahrané soubory i podklady použité v obsahu webu. Odkaz můžete použít na libovolné stránce.</p></div>{!readOnly && <label className="admin-file-upload"><AdminIcon name="upload" /> {uploading ? 'Nahrávám…' : 'Nahrát soubor'}<input type="file" aria-label="Nahrát veřejný soubor" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={loading || uploading} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file) }} /></label>}</div>
    <p className="admin-files-warning">JPEG, PNG, WebP a PDF · do 10 MB. Aktivní soubory jsou veřejné — nenahrávejte osobní údaje ani soukromé dokumenty. Administrátor může nepoužívané nahrané soubory přesunout do soukromého koše. Obrázky dodané se šablonou nahraďte v obsahu stránky.</p>
    <div className="admin-record-toolbar"><label>Vyhledat soubor<input type="search" value={query} placeholder="Název souboru…" onChange={event => { setQuery(event.target.value); setPage(0) }} /></label><label>Typ souboru<select value={filter} onChange={event => { setFilter(event.target.value); setPage(0) }}><option value="all">Všechny soubory</option><option value="images">Obrázky</option><option value="documents">Dokumenty a ostatní</option></select></label><button disabled={loading || uploading} onClick={() => setReload(value => value + 1)}>Obnovit</button></div>
    {error && <p role="alert" className="admin-error">{error}</p>}{notice && <p role="status" className="admin-status admin-status-success">{notice}</p>}
    {selectedUrl && <label>Odkaz na soubor<input value={selectedUrl} readOnly onFocus={event => event.target.select()} /></label>}
    {loading ? <p role="status">Načítám soubory…</p> : <><p className="admin-muted">{visible.length} souborů{readOnly ? ' · pouze prohlížení' : ''}</p><div className="admin-file-grid">{shown.map(file => <article className="admin-file-card" key={file.url}><div className="admin-file-preview">{isImage(file) ? <Image unoptimized src={file.url} alt="" width={320} height={180} /> : <AdminIcon name="pages" />}</div><div className="admin-file-info"><h4 title={file.path}>{file.name}</h4><p>{file.source === 'storage' ? fileSize(file.size) : 'Odkaz z obsahu webu'}{file.created ? ` · ${new Date(file.created).toLocaleDateString('cs-CZ')}` : ''}</p><small className="admin-file-path">{file.path}</small><div><button onClick={() => copy(file.url)}>Kopírovat odkaz</button><a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={`Otevřít soubor ${file.name}`}><AdminIcon name="external" /></a>{admin && file.source==='storage' && <button className="admin-danger" disabled={uploading} onClick={()=>void remove(file.path)}>Do koše</button>}</div></div></article>)}</div>{!visible.length && <p className="admin-empty">{query ? 'Žádný odpovídající soubor.' : 'Zatím zde nejsou žádné soubory.'}</p>}<div className="admin-pagination"><button disabled={page === 0} onClick={() => setPage(value => value - 1)}>Předchozí</button><span>Strana {page + 1} / {Math.max(1, Math.ceil(visible.length / 24))}</span><button disabled={(page + 1) * 24 >= visible.length} onClick={() => setPage(value => value + 1)}>Další</button></div></>}
    {admin && <details className="admin-invite"><summary>Koš souborů ({trash.length})</summary><p>Soubory v tomto koši nejsou veřejné. Obnovení vrátí původní adresu; existující soubory se nepřepisují.</p>{trash.map(item=><div className="admin-item-tools" key={item.id}><span className="admin-file-path">{item.path}</span><button disabled={uploading} onClick={()=>void restore(item.id)}>Obnovit soubor</button></div>)}</details>}
  </section>
}
