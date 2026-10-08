export type TextValue = string | number | boolean | null | TextValue[] | { [key: string]: TextValue }
type TextObject = { [key: string]: TextValue }
const decorators = new Set(['strong', 'em', 'underline', 'strike-through', 'code'])
const styles = new Set(['normal', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'])
const object = (value: TextValue): value is TextObject => !!value && typeof value === 'object' && !Array.isArray(value)
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

export function safeTextLink(value: string): boolean {
  return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value) && !/[\u0000-\u0020<>"']/u.test(value)
}

// Unsupported custom blocks remain in the original structured editor, never silently dropped.
export function supportsDocumentEditor(value: TextValue[]): boolean {
  return value.every(block => object(block) && block._type === 'block' && styles.has(String(block.style || 'normal'))
    && (!block.listItem || ['bullet', 'number'].includes(String(block.listItem)))
    && (!block.level || block.level === 1)
    && Array.isArray(block.children) && Array.isArray(block.markDefs)
    && block.markDefs.every(def => object(def) && def._type === 'link' && typeof def.href === 'string' && safeTextLink(def.href))
    && block.children.every(child => object(child) && child._type === 'span' && typeof child.text === 'string'
      && Array.isArray(child.marks) && child.marks.every(mark => decorators.has(String(mark)) || (block.markDefs as TextValue[]).some(def => object(def) && def._key === mark))))
}

export function portableTextHtml(value: TextValue[]): string {
  let html = '', list = ''
  for (const entry of value) {
    if (!object(entry)) continue
    const wantedList = entry.listItem === 'bullet' ? 'ul' : entry.listItem === 'number' ? 'ol' : ''
    if (wantedList !== list) { if (list) html += `</${list}>`; if (wantedList) html += `<${wantedList}>`; list = wantedList }
    const tag = list ? 'li' : styles.has(String(entry.style)) && entry.style !== 'normal' ? String(entry.style) : 'p'
    const key = typeof entry._key === 'string' ? ` data-block-key="${escape(entry._key)}"` : ''
    const children = Array.isArray(entry.children) ? entry.children : []
    const defs = Array.isArray(entry.markDefs) ? entry.markDefs : []
    let inline = ''
    for (const child of children) {
      if (!object(child)) continue
      let text = escape(String(child.text || '')).replace(/\n/g, '<br>')
      for (const mark of Array.isArray(child.marks) ? child.marks : []) {
        const tag = ({ strong: 'strong', em: 'em', underline: 'u', 'strike-through': 's', code: 'code' } as Record<string, string>)[String(mark)]
        const def = defs.find(def => object(def) && def._key === mark)
        if (tag) text = `<${tag}>${text}</${tag}>`
        else if (def && object(def) && typeof def.href === 'string' && safeTextLink(def.href)) text = `<a href="${escape(def.href)}" data-mark-key="${escape(String(mark))}">${text}</a>`
      }
      inline += text
    }
    html += `<${tag}${key}>${inline || '<br>'}</${tag}>`
  }
  return html + (list ? `</${list}>` : '') || '<p><br></p>'
}

// Only Portable Text data is saved. DOM attributes, scripts, images and arbitrary HTML are not persisted.
export function readDocument(root: HTMLElement, original: TextValue[], newKey = () => crypto.randomUUID()): TextValue[] {
  const output: TextValue[] = [], usedKeys = new Set<string>()
  const originals = new Map(original.filter(object).map(block => [String(block._key), block]))
  function block(element: Node, listItem?: string, level = 1) {
    const sourceKey = element instanceof HTMLElement ? element.dataset.blockKey : undefined
    const old = sourceKey && !usedKeys.has(sourceKey) ? originals.get(sourceKey) : undefined
    const key = old && sourceKey ? sourceKey : newKey(); usedKeys.add(key)
    const defs: TextObject[] = [], children: TextObject[] = []
    function inline(node: Node, marks: string[] = []) {
      if (node.nodeType === Node.TEXT_NODE) { if (node.textContent) children.push({ _type: 'span', _key: newKey(), text: node.textContent, marks }); return }
      if (!(node instanceof HTMLElement)) return
      const tag = node.tagName.toLowerCase()
      if (['script', 'style', 'iframe', 'object', 'img', 'svg', 'ul', 'ol'].includes(tag)) return
      if (tag === 'br') { children.push({ _type: 'span', _key: newKey(), text: '\n', marks }); return }
      const next = [...marks]
      const decorator = ({ b: 'strong', strong: 'strong', i: 'em', em: 'em', u: 'underline', s: 'strike-through', strike: 'strike-through', code: 'code' } as Record<string, string>)[tag]
      if (decorator) next.push(decorator)
      if (node.style.fontWeight === 'bold' || Number(node.style.fontWeight) >= 600) next.push('strong')
      if (node.style.fontStyle === 'italic') next.push('em')
      if (node.style.textDecoration.includes('underline')) next.push('underline')
      if (node.style.textDecoration.includes('line-through')) next.push('strike-through')
      if (tag === 'a') {
        const href = node.getAttribute('href') || ''
        if (safeTextLink(href)) {
          const existing = defs.find(def => def.href === href)
          const oldDef = Array.isArray(old?.markDefs) ? old.markDefs.find(def => object(def) && def._key === node.dataset.markKey && def.href === href) : undefined
          const def = existing || { ...(oldDef && object(oldDef) ? oldDef : {}), _type: 'link', _key: newKey(), href }
          if (!existing) defs.push(def)
          next.push(String(def._key))
        }
      }
      node.childNodes.forEach(child => inline(child, [...new Set(next)]))
    }
    if (element instanceof HTMLElement) element.childNodes.forEach(child => inline(child))
    else inline(element)
    if (children.length === 1 && children[0].text === '\n') children[0].text = ''
    if (!children.length) children.push({ _type: 'span', _key: newKey(), text: '', marks: [] })
    const tag = element instanceof HTMLElement ? element.tagName.toLowerCase() : 'p'
    const result: TextObject = { ...old, _type: 'block', _key: key, style: styles.has(tag) ? tag : 'normal', children, markDefs: defs }
    delete result.listItem; delete result.level
    if (listItem) { result.listItem = listItem; result.level = level }
    output.push(result)
  }
  function walk(parent: Node, listItem?: string, level = 1) {
    let loose: HTMLElement | undefined
    const flush = () => { if (loose) block(loose, listItem, level); loose = undefined }
    for (const node of Array.from(parent.childNodes)) {
      if (node instanceof HTMLElement) {
        const tag = node.tagName.toLowerCase()
        if (['span', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'a', 'code', 'br'].includes(tag)) { loose ??= document.createElement('p'); loose.append(node.cloneNode(true)); continue }
        flush()
        if (tag === 'ul' || tag === 'ol') { walk(node, tag === 'ul' ? 'bullet' : 'number', listItem ? level + 1 : level); continue }
        if (['script', 'style', 'iframe', 'object', 'img', 'svg'].includes(tag)) continue
        if (tag === 'div' && node.querySelector('p,h1,h2,h3,h4,h5,h6,ul,ol,blockquote')) { walk(node, listItem, level); continue }
        const nestedLists = Array.from(node.children).filter(child => ['UL', 'OL'].includes(child.tagName))
        const hasOwnText = Array.from(node.childNodes).some(child => !(child instanceof HTMLElement && ['UL', 'OL'].includes(child.tagName)) && (child.textContent?.trim() || child instanceof HTMLElement && child.tagName === 'BR'))
        if (!nestedLists.length || hasOwnText) block(node, tag === 'li' ? listItem : undefined, level)
        for (const nested of nestedLists) walk(nested, nested.tagName === 'UL' ? 'bullet' : 'number', tag === 'li' ? level + 1 : level)
      } else if (node.textContent) { loose ??= document.createElement('p'); loose.append(node.cloneNode(true)) }
    }
    flush()
  }
  walk(root)
  return output
}
