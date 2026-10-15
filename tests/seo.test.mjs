import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module from 'node:module'
import ts from 'typescript'

function load(relative, stubs = {}) {
  const file = new URL(relative, import.meta.url)
  const mod = new Module(file.pathname)
  mod.paths=Module._nodeModulePaths(new URL('.',file).pathname)
  const fallback=mod.require.bind(mod)
  mod.require=name=>Object.hasOwn(stubs,name)?stubs[name]:fallback(name)
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx:ts.JsxEmit.ReactJSX } }).outputText, file.pathname)
  return mod.exports
}
const { pageMetadata } = load('../app/seo.ts')
const { seoPages, reservedSlugs } = load('../app/seo-pages.ts')

test('each built-in page has its own share image, description and title', () => {
  const images = new Set(), descriptions = new Set(), titles = new Set()
  for (const [slug, entry] of Object.entries(seoPages)) {
    if (slug === 'spoluprace') continue // Legacy OG alias; /kontakt is canonical.
    const path = slug === 'home' ? '/' : `/${slug}`
    const metadata = pageMetadata(entry.title, entry.description, path)
    assert.equal(metadata.alternates.canonical, path)
    assert.equal(metadata.openGraph.url, path)
    assert.equal(metadata.openGraph.images[0].url, `/og/${slug}`)
    assert.equal(metadata.twitter.images[0], `/og/${slug}`)
    assert.equal(metadata.openGraph.images[0].width, 1200)
    images.add(metadata.openGraph.images[0].url)
    descriptions.add(metadata.description)
    titles.add(metadata.title.absolute)
  }
  for (const values of [images, descriptions, titles]) assert.equal(values.size, 6)
})

test('CMS title is not suffixed with a duplicate brand', () => {
  assert.equal(pageMetadata('  Naše služby | AKRON Logistics  ', 'Text', '/sluzby').title.absolute, 'Naše služby | AKRON Logistics')
  assert.equal(pageMetadata('Doprava', 'Text', '/doprava').title.absolute, 'Doprava | AKRON Logistics')
})

test('private and generated routes are excluded from custom sitemap pages', () => {
  for (const slug of ['admin', 'studio', 'api', 'og', 'opengraph-image', 'home', 'cookies']) assert.ok(reservedSlugs.has(slug))
  assert.ok(!reservedSlugs.has('nova-stranka'))
})

test('contact structured data uses its current URL and existing CMS document',async()=>{
  const requested=[]
  const {PageStructuredData}=load('../app/page-structured-data.tsx',{
    '../content/content':{getPage:async slug=>{requested.push(slug);return{title:'Kontakt'}},contentMetadata:async()=>({title:{absolute:'Kontakt | AKRON Logistics'},description:'Kontaktujte nás.'})},
    './site':{getSiteUrl:()=> 'https://akronlogistics.cz'},'./seo-pages':{seoPages},'./public-links':load('../app/public-links.ts'),
  })
  for(const slug of ['kontakt','spoluprace']){
    const element=await PageStructuredData({slug})
    const graph=JSON.parse(element.props.dangerouslySetInnerHTML.__html)['@graph']
    assert.equal(graph[0].url,'https://akronlogistics.cz/kontakt')
    assert.equal(graph.find(item=>item['@type']==='BreadcrumbList').itemListElement[1].item,'https://akronlogistics.cz/kontakt')
  }
  assert.deepEqual(requested,['spoluprace','spoluprace'])
})

test('launch sitemap includes canonical published pages only, while preparing advertises none',async()=>{
  for(const preparing of [true,false]){
    let reads=0
    const {default:sitemap}=load('../app/sitemap.ts',{
      './site':{getSiteUrl:()=> 'https://akronlogistics.cz'},'./preparing':{preparing},'./seo-pages':{reservedSlugs},
      '../content/content':{getPublishedSlugs:async()=>{reads++;return['home','spoluprace','admin','kontakt','nova-stranka','nova-stranka','https://evil.test','drafts.secret']}},
    })
    const result=await sitemap()
    if(preparing){assert.equal(result.length,0);assert.equal(reads,0);continue}
    const urls=result.map(row=>row.url)
    assert.equal(urls.length,7);assert.equal(new Set(urls).size,7)
    assert.ok(urls.includes('https://akronlogistics.cz/kontakt'))
    assert.ok(urls.includes('https://akronlogistics.cz/nova-stranka'))
    assert.ok(!urls.some(url=>/spoluprace|admin|evil|drafts/.test(url)))
    assert.ok(result.every(row=>!row.lastModified),'do not invent modification dates')
  }
})

test('robots allow a launched site but block a closed launch, without blocking assets in production',()=>{
  for(const allowed of [true,false]){
    const {default:robots}=load('../app/robots.ts',{'./site':{getSiteUrl:()=> 'https://akronlogistics.cz',isIndexingAllowed:()=>allowed}})
    const result=robots()
    assert.equal(result.sitemap,'https://akronlogistics.cz/sitemap.xml')
    if(allowed){assert.equal(result.rules.allow,'/');assert.ok(result.rules.disallow.includes('/admin'));assert.ok(!result.rules.disallow.includes('/_next/'))}
    else assert.equal(result.rules.disallow,'/')
  }
})

test('Vercel review and demo hosts remain noindex independently of the launch flag',async()=>{
  const {default:config}=load('../next.config.ts')
  const headers=await config.headers()
  const aliasRule=headers.find(rule=>rule.has?.some(match=>match.type==='host'))
  assert.ok(aliasRule.headers.some(header=>header.key==='X-Robots-Tag'&&header.value.includes('noindex')))
  const hostPattern=new RegExp(`^${aliasRule.has[0].value}$`)
  for(const host of ['akron-logistics-web.vercel.app','akron-admin-demo.vercel.app','deployment-123.vercel.app'])assert.ok(hostPattern.test(host))
  assert.equal(hostPattern.test('akronlogistics.cz'),false)
})

test('a closed launch and Preview cannot accidentally become indexable through environment flags',()=>{
  const old={ALLOW_INDEXING:process.env.ALLOW_INDEXING,VERCEL_ENV:process.env.VERCEL_ENV}
  try{
    for(const [preparing,environment,flag,expected] of [[true,'production','true',false],[false,'preview','true',false],[false,'production','false',false],[false,'production','true',true]]){
      process.env.ALLOW_INDEXING=flag;process.env.VERCEL_ENV=environment
      assert.equal(load('../app/site.ts',{'./preparing':{preparing}}).isIndexingAllowed(),expected)
    }
  }finally{for(const [key,value]of Object.entries(old)){if(value===undefined)delete process.env[key];else process.env[key]=value}}
})

test('unsupported social image formats fall back to the page PNG while approved CMS metadata is preserved',async()=>{
  for(const extension of ['svg','pdf','png']){
    const shared=`/images/share.${extension}`
    const {contentMetadata}=load('../content/content.ts',{
      'server-only':{},react:{cache:fn=>fn},'next/headers':{draftMode:async()=>({isEnabled:false})},
      './client':{imageUrl:image=>image?.url},'../app/site':{company:{}},'../app/seo':{pageMetadata},'../app/seo-pages':{seoPages},
      '../supabase/content':{readDocument:async()=>({seoTitle:'Schválený titulek',seoDescription:'Schválený popis',shareImage:{url:shared,alt:'Logo'}}),publishedSlugs:async()=>[]},
      '../supabase/inquiry-settings':{publicContactEmail:async()=>''},
    })
    const metadata=await contentMetadata('spoluprace','Kontakt','Popis','/kontakt')
    assert.equal(metadata.title.absolute,'Schválený titulek | AKRON Logistics')
    assert.equal(metadata.description,'Schválený popis')
    assert.equal(metadata.openGraph.images[0].url,extension==='png'?shared:'/og/kontakt')
  }
})

test('public OG endpoints never read authenticated drafts and reject unpublished or reserved pages',async()=>{
  const reads=[]
  const {GET}=load('../app/og/[slug]/route.ts',{
    '../../seo-pages':{seoPages,reservedSlugs},'../../sharing-image':{sharingImage:async()=>new Response('png')},
    '../../../supabase/content':{readDocument:async(...args)=>{reads.push(args);return args[1]==='published-page'?{title:'Published'}:null}},
  })
  const get=slug=>GET(new Request('https://akronlogistics.cz/og/'+slug),{params:Promise.resolve({slug})})
  assert.equal((await get('published-page')).status,200)
  assert.equal((await get('draft-only')).status,404)
  assert.equal((await get('admin')).status,404)
  assert.deepEqual(reads,[['page','published-page',false],['page','draft-only',false]])
})
