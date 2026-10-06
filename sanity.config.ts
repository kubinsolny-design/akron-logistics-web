'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { presentationTool } from 'sanity/presentation'
import { csCZLocale } from '@sanity/locale-cs-cz'
import { schemaTypes } from './sanity/schema.mjs'
import { inquirySchema } from './sanity/inquiry-schema'
import { SetupTool } from './sanity/setup-tool'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'l802e097'
export default defineConfig([
  {
    name: 'content', title: 'AKRON — Obsah webu', projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production', basePath: '/studio/obsah',
    plugins: [csCZLocale(), structureTool({ name: 'content', title: 'Obsah webu', structure: S => S.list().title('AKRON Logistics').items([
      S.listItem().title('Firma, kontakty a vzhled').id('settings').child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.documentTypeListItem('page').title('Stránky webu'),
    ]) }), presentationTool({ title: 'Náhled webu', previewUrl: { origin: typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin, previewMode: { enable: '/api/draft-mode/enable' } } })],
    schema: { types: schemaTypes },
    tools: previous => [...previous, { name: 'guide', title: 'První spuštění a návod', component: SetupTool }],
    document: { newDocumentOptions: options => options.filter(option => option.templateId !== 'siteSettings'), actions: (actions, context) => context.schemaType === 'siteSettings' ? actions.filter(action => action.action !== 'delete' && action.action !== 'duplicate') : actions },
  },
  {
    name: 'inquiries', title: 'AKRON — Poptávky', projectId, dataset: 'inquiries', basePath: '/studio/poptavky',
    plugins: [csCZLocale(), structureTool({ title: 'Poptávky', structure: S => S.list().title('Poptávky').items([
      ...[['new', 'Nové'], ['working', 'Řeší se'], ['done', 'Hotové']].map(([status, title]) => S.listItem().title(title).id(status).child(S.documentList().title(title).schemaType('inquiry').filter('_type == "inquiry" && status == $status').params({ status }).defaultOrdering([{ field: 'createdAt', direction: 'desc' }]))),
    ]) })],
    schema: { types: [inquirySchema] },
    document: { newDocumentOptions: () => [] },
  },
])
