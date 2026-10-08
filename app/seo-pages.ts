/** Public route descriptions also power sharing cards and structured data. */
export const seoPages: Record<string, { title: string; description: string; label: string; card: string }> = {
  home: { title: 'Silniční přeprava a spedice', description: 'Vnitrostátní a mezinárodní silniční přeprava a spedice. Najdeme vhodné vozidlo a koordinujeme zakázku od poptávky po doručení.', label: 'ČESKO A EVROPA', card: 'Přepravu vyřešíme. Od A do B.' },
  preprava: { title: 'Silniční přeprava podle vašich potřeb', description: 'Celovozová přeprava, menší zásilky, sběrná i expresní přeprava. Zajistíme vhodné řešení a osobně koordinujeme přepravu v Česku i Evropě.', label: 'PŘEPRAVNÍ SLUŽBY', card: 'Velký náklad. Malá zásilka. Správné řešení.' },
  moznosti: { title: 'Vozidla a přepravní možnosti', description: 'Dodávka, sólo vozidlo nebo návěs. Plachtové, skříňové a chladírenské provedení i přeprava sypkých materiálů — srozumitelně a podle nákladu.', label: 'VOZIDLA A MOŽNOSTI', card: 'Vhodné vozidlo pro váš náklad.' },
  spoluprace: { title: 'Poptávka přepravy a spolupráce', description: 'Poptáte přepravu, domluvíme řešení a koordinujeme doručení. Vyplňte krátký formulář nebo kontaktujte AKRON Logistics přímo telefonem či e-mailem.', label: 'OSOBNÍ KOMUNIKACE', card: 'Od první poptávky až po doručení.' },
  'ochrana-osobnich-udaju': { title: 'Ochrana osobních údajů', description: 'Informace o zpracování osobních údajů při používání webu a odeslání poptávky AKRON Logistics, vašich právech a kontaktu na správce údajů.', label: 'INFORMACE PRO VÁS', card: 'Ochrana osobních údajů.' },
  cookies: { title: 'Cookies a úložiště prohlížeče', description: 'Přehled cookies a úložiště prohlížeče na webu AKRON Logistics. Zjistěte, k čemu slouží a jak můžete změnit své nastavení a souhlas.', label: 'INFORMACE PRO VÁS', card: 'Cookies. Přehledně a transparentně.' },
}

export const reservedSlugs = new Set(['home', ...Object.keys(seoPages), 'admin', 'studio', 'api', 'og', 'opengraph-image', 'icon', 'apple-icon', 'robots', 'sitemap'])
