import { defineType, defineField } from 'sanity'

export const inquirySchema = defineType({
  name: 'inquiry', title: 'Poptávka přepravy', type: 'document',
  fields: [
    defineField({ name: 'status', title: 'Stav vyřízení', type: 'string', initialValue: 'new', options: { list: [
      { title: 'Nová', value: 'new' }, { title: 'Řeší se', value: 'working' }, { title: 'Hotová', value: 'done' },
    ] } }),
    ...[['pickup', 'Nakládka'], ['delivery', 'Vykládka'], ['date', 'Termín'], ['frequency', 'Četnost'],
      ['name', 'Jméno a firma'], ['email', 'E-mail'], ['phone', 'Telefon'], ['createdAt', 'Přijato'],
      ['emailDelivery', 'Doručení e-mailového upozornění'],
    ].map(([name, title]) => defineField({ name, title, type: name === 'createdAt' ? 'datetime' : 'string', readOnly: true })),
    defineField({ name: 'cargo', title: 'Popis nákladu', type: 'text', readOnly: true }),
    defineField({ name: 'notes', title: 'Interní poznámky', type: 'text' }),
  ],
  orderings: [{ title: 'Nejnovější nahoře', name: 'newest', by: [{ field: 'createdAt', direction: 'desc' }] }],
  preview: { select: { title: 'name', pickup: 'pickup', delivery: 'delivery', status: 'status' }, prepare: ({ title, pickup, delivery, status }) => ({ title, subtitle: `${pickup} → ${delivery} · ${status}` }) },
})
