// Content model for the Akron Logistics editor. No credentials belong in this file.
const text = (name, title, rows = 3) => ({ name, title, type: 'text', rows })
const string = (name, title) => ({ name, title, type: 'string' })
const image = (name, title) => ({
  name, title, type: 'image', options: { hotspot: true },
  fields: [string('alt', 'Popis obrázku pro čtečky a vyhledávače')],
})
const link = {
  name: 'action', title: 'Odkaz nebo tlačítko', type: 'object',
  fields: [string('label', 'Text odkazu'), string('href', 'Adresa odkazu')],
}
const card = {
  name: 'contentCard', title: 'Karta', type: 'object',
  fields: [
    string('anchor', 'Kotva odkazu (např. celovozova)'),
    string('title', 'Nadpis'), text('description', 'Popis'),
    { name: 'vehicle', title: 'Náčrt vozidla', type: 'string', options: { list: [
      { title: 'Velké auto — návěs', value: 'trailer' },
      { title: 'Střední auto — sólo', value: 'box' },
      { title: 'Malé auto — dodávka', value: 'van' },
      { title: 'Sklápěčka', value: 'tipper' },
      { title: 'Posuvná podlaha', value: 'walking-floor' },
      { title: 'Bez náčrtu', value: 'none' },
    ] } },
    image('image', 'Vlastní fotografie'),
    { name: 'action', title: 'Odkaz', type: 'action' },
  ],
  preview: { select: { title: 'title', subtitle: 'description', media: 'image' } },
}
const section = {
  name: 'pageSection', title: 'Sekce stránky', type: 'object',
  fields: [
    string('editorLabel', 'Název sekce v administraci'),
    { name: 'layout', title: 'Zobrazení sekce', type: 'string', initialValue: 'text', options: { list: [
      { title: 'Úvodní velký nadpis', value: 'hero' },
      { title: 'Text a obrázek', value: 'text' },
      { title: 'Karty služeb / vozidel', value: 'cards' },
      { title: 'Postup spolupráce', value: 'process' },
      { title: 'Mapa přepravních směrů', value: 'map' },
      { title: 'Časté otázky', value: 'faq' },
      { title: 'Osobní představení', value: 'person' },
      { title: 'Poptávkový formulář', value: 'inquiry' },
      { title: 'Pruh s tlačítkem', value: 'cta' },
      { title: 'Přehled výhod', value: 'trust' },
      { title: 'Poznámka a výzva', value: 'note' },
    ] }, validation: rule => rule.required() },
    { name: 'visible', title: 'Zobrazit na webu', type: 'boolean', initialValue: true },
    string('anchor', 'Kotva sekce (např. poptavka)'),
    string('eyebrow', 'Malý nadpis nad titulkem'),
    text('heading', 'Hlavní nadpis', 2),
    text('highlight', 'Zvýrazněný druhý řádek nadpisu', 2),
    text('description', 'Text sekce', 5),
    image('image', 'Obrázek sekce'),
    { ...string('imagePath', 'Výchozí obrázek'), readOnly: true, hidden: ({ parent }) => Boolean(parent?.image?.asset) },
    text('caption', 'Popisek obrázku / doplňková poznámka', 2),
    { name: 'cardStyle', title: 'Zobrazení karet', type: 'string', initialValue: 'rail', options: { list: [
      { title: 'Vedle sebe', value: 'rail' }, { title: 'Řádky pod sebou', value: 'list' },
    ] } },
    { name: 'theme', title: 'Barevné provedení', type: 'string', initialValue: 'light',
      options: { list: [{ title: 'Světlé', value: 'light' }, { title: 'Tmavé', value: 'dark' }] } },
    { name: 'actions', title: 'Tlačítka a odkazy', type: 'array', of: [{ type: 'action' }] },
    { name: 'cards', title: 'Položky / kroky', type: 'array', of: [{ type: 'contentCard' }] },
    { name: 'questions', title: 'Otázky a odpovědi', type: 'array', of: [{ type: 'object', name: 'question',
      fields: [string('question', 'Otázka'), text('answer', 'Odpověď', 4)],
      preview: { select: { title: 'question' } },
    }] },
  ],
  preview: { select: { title: 'editorLabel', subtitle: 'heading', media: 'image' } },
}

export const schemaTypes = [link, card, section, {
  name: 'siteSettings', title: 'Firma, kontakty a vzhled', type: 'document',
  groups: [
    { name: 'company', title: 'Firma a kontakty', default: true },
    { name: 'design', title: 'Vzhled' },
    { name: 'navigation', title: 'Menu a patička' },
    { name: 'form', title: 'Poptávkový formulář' },
  ],
  fields: [
    ...[
      ['name', 'Název firmy'], ['contactName', 'Jméno kontaktní osoby'],
      ['email', 'Kontaktní e-mail'], ['phone', 'Telefon'],
      ['street', 'Ulice a číslo'], ['city', 'PSČ a město'], ['registrationNumber', 'IČO'],
    ].map(([name, title]) => ({ ...string(name, title), group: 'company', validation: rule => name === 'email' ? rule.required().email() : rule.required() })),
    { ...image('portrait', 'Fotografie kontaktní osoby'), group: 'company' },
    { ...text('about', 'Osobní představení firmy', 5), group: 'company' },
    { ...image('logo', 'Logo na světlém pozadí'), group: 'design' },
    { ...image('lightLogo', 'Logo na tmavém pozadí'), group: 'design' },
    ...[['accentColor', 'Hlavní oranžová', '#ff5a00'], ['darkColor', 'Tmavě modrá', '#152236'],
      ['backgroundColor', 'Světlé pozadí', '#f2f2f2'], ['textColor', 'Barva textu', '#0d1117']
    ].map(([name, title, initialValue]) => ({ ...string(name, title), initialValue, group: 'design',
      validation: rule => rule.regex(/^#[0-9a-fA-F]{6}$/).error('Zadejte barvu ve tvaru #ff5a00.') })),
    { name: 'font', title: 'Písmo', type: 'string', group: 'design', initialValue: 'poppins',
      options: { list: [{ title: 'Poppins', value: 'poppins' }, { title: 'Orbitron', value: 'orbitron' }] } },
    { name: 'navigation', title: 'Položky hlavního menu', type: 'array', group: 'navigation', of: [{ type: 'action' }] },
    { ...text('footerText', 'Text v patičce'), group: 'navigation' },
    { name: 'headerAction', title: 'Tlačítko v hlavičce', type: 'action', group: 'navigation' },
    { name: 'footerAction', title: 'Tlačítko v patičce', type: 'action', group: 'navigation' },
    { ...string('footerContactLabel', 'Nadpis kontaktu v patičce'), group: 'navigation' },
    { ...string('footerTagline', 'Doplňkový text dole v patičce'), group: 'navigation' },
    { ...string('inquiryEmail', 'E-mail pro příjem poptávek'), group: 'form',
      validation: rule => rule.email() },
    { ...string('formHeading', 'Nadpis formuláře'), group: 'form' },
    { ...text('formDescription', 'Vysvětlení nad formulářem'), group: 'form' },
    { ...string('submitLabel', 'Text odesílacího tlačítka'), group: 'form' },
    { ...text('successMessage', 'Zpráva po přijetí poptávky'), group: 'form' },
  ],
  preview: { prepare: () => ({ title: 'Firma, kontakty a vzhled' }) },
}, {
  name: 'page', title: 'Stránka webu', type: 'document',
  groups: [{ name: 'content', title: 'Obsah', default: true }, { name: 'seo', title: 'Vyhledávače a sdílení' }],
  fields: [
    { ...string('title', 'Název v administraci'), group: 'content', validation: rule => rule.required() },
    { name: 'slug', title: 'Adresa stránky', type: 'slug', group: 'content',
      description: 'Úvod má adresu home; ostatní např. preprava, moznosti nebo spoluprace.',
      readOnly: ({ document }) => ['page-home', 'page-preprava', 'page-moznosti', 'page-spoluprace', 'page-cookies', 'page-ochrana-osobnich-udaju'].includes(document?._id?.replace(/^drafts\./, '')),
      validation: rule => rule.required().custom(value => !value?.current || (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current) && !['studio', 'api', 'sitemap', 'robots'].includes(value.current)) ? true : 'Použijte malá písmena bez diakritiky a pomlčky. Adresy studio a api jsou vyhrazené.') },
    { name: 'sections', title: 'Sekce — pořadí změníte přetažením', type: 'array', group: 'content', of: [{ type: 'pageSection' }] },
    { name: 'body', title: 'Dlouhý text (např. právní stránka)', type: 'array', group: 'content', of: [{ type: 'block' }] },
    { ...string('seoTitle', 'Titulek pro vyhledávače'), group: 'seo' },
    { ...text('seoDescription', 'Popis pro vyhledávače'), group: 'seo' },
    { ...image('shareImage', 'Obrázek při sdílení'), group: 'seo' },
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
}]
