import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {CogIcon} from '@sanity/icons/Cog'
import {HomeIcon} from '@sanity/icons/Home'
import {schemaTypes} from './schemaTypes'

const singletons = new Set(['siteSettings', 'homePage'])
export default defineConfig({
  name: 'shapeurmind',
  title: 'Shape Your Mind · Content Studio',
  projectId: 'tfafyubm',
  dataset: 'production',
  plugins: [structureTool({
    structure: (S) => S.list().title('Website content').items([
      S.listItem().title('Site settings').icon(CogIcon).child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.listItem().title('Homepage').icon(HomeIcon).child(S.document().schemaType('homePage').documentId('homePage')),
      S.divider(),
      S.documentTypeListItem('post').title('Blog posts'),
      S.documentTypeListItem('person').title('Team & authors'),
      S.documentTypeListItem('service').title('Services'),
      S.documentTypeListItem('faq').title('Frequently asked questions'),
      S.documentTypeListItem('page').title('Page introductions'),
    ]),
  })],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter((template) => !singletons.has(template.schemaType)),
  },
  document: {
    actions: (actions, context) => singletons.has(context.schemaType)
      ? actions.filter(({action}) => action !== 'delete' && action !== 'duplicate' && action !== 'unpublish')
      : actions,
  },
})
