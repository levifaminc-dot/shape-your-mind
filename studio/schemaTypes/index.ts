import {defineType, defineField, defineArrayMember} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'
import {HomeIcon} from '@sanity/icons/Home'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {UserIcon} from '@sanity/icons/User'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {DocumentIcon} from '@sanity/icons/Document'
import {HeartIcon} from '@sanity/icons/Heart'
import {ImageIcon} from '@sanity/icons/Image'

const image = (name: string, title: string) => defineField({
  name, title, type: 'image', options: {hotspot: true},
  fields: [defineField({name: 'alt', title: 'Image description', type: 'string', validation: (r) => r.required()})],
})
const order = defineField({name: 'order', title: 'Display order', type: 'number', initialValue: 0})
const body = defineField({name: 'body', title: 'Article content', type: 'array', of: [
  defineArrayMember({type: 'block', styles: [
    {title: 'Paragraph', value: 'normal'}, {title: 'Heading', value: 'h2'},
    {title: 'Subheading', value: 'h3'}, {title: 'Small heading', value: 'h4'},
    {title: 'Quote', value: 'blockquote'},
  ], marks: {decorators: [{title: 'Bold', value: 'strong'}, {title: 'Italic', value: 'em'}], annotations: [
    {name: 'link', type: 'object', title: 'Link', fields: [
      defineField({name: 'href', type: 'url', validation: (r) => r.uri({scheme: ['https', 'http', 'mailto', 'tel']})}),
    ]},
  ]}}),
  defineArrayMember({type: 'image', icon: ImageIcon, options: {hotspot: true}, fields: [
    defineField({name: 'alt', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'caption', type: 'string'}),
  ]}),
], validation: (r) => r.required()})

export const siteSettings = defineType({
  name: 'siteSettings', title: 'Site settings', type: 'document', icon: CogIcon,
  fields: [
    defineField({name: 'name', title: 'Organization name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'description', title: 'Footer description', type: 'text', rows: 4}),
    defineField({name: 'phone', title: 'Phone number', type: 'string', description: 'Include the country code, e.g. +234 806 002 8943.'}),
    defineField({name: 'email', title: 'Contact email', type: 'string', validation: (r) => r.email()}),
    defineField({name: 'whatsapp', title: 'WhatsApp number', type: 'string', description: 'Digits only, including country code.'}),
    image('logo', 'Organization logo'),
    defineField({name: 'socialLinks', type: 'array', of: [defineArrayMember({type: 'object', fields: [
      defineField({name: 'platform', type: 'string', options: {list: ['LinkedIn', 'Instagram', 'Twitter']}, validation: (r) => r.required()}),
      defineField({name: 'url', type: 'url', validation: (r) => r.required().uri({scheme: ['https']})}),
    ]})]}),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})

export const homePage = defineType({
  name: 'homePage', title: 'Homepage', type: 'document', icon: HomeIcon,
  fields: [
    defineField({name: 'headline', title: 'Main headline', type: 'text', rows: 3, description: 'Use a new line for each phrase.', validation: (r) => r.required()}),
    defineField({name: 'introduction', title: 'Introduction', type: 'text', rows: 4}),
    defineField({name: 'badge', title: 'Introductory badge', type: 'string'}),
    image('heroImage', 'Main homepage photograph'),
  ],
  preview: {prepare: () => ({title: 'Homepage'})},
})

export const person = defineType({
  name: 'person', title: 'Team member or author', type: 'document', icon: UserIcon,
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'role', type: 'string'}),
    defineField({name: 'biography', type: 'text', rows: 4}),
    image('photo', 'Portrait'),
    defineField({name: 'profile', title: 'Show on team pages', type: 'boolean', initialValue: true}),
    order,
  ],
  orderings: [{title: 'Display order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'name', subtitle: 'role', media: 'photo'}},
})

export const post = defineType({
  name: 'post', title: 'Blog post', type: 'document', icon: DocumentTextIcon,
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: (r) => r.required()}),
    defineField({name: 'author', type: 'reference', to: [{type: 'person'}]}),
    defineField({name: 'publishedAt', title: 'Publication date', type: 'datetime', initialValue: () => new Date().toISOString(), validation: (r) => r.required()}),
    defineField({name: 'category', type: 'string', options: {list: ['Clinical Training', 'Humanitarian & Training', 'Workplace Wellness', 'Workshops & Community', 'Life Hacks', 'Mindfulness', 'Advocacy', 'Youth & Education']}}),
    defineField({name: 'excerpt', title: 'Short introduction', type: 'text', rows: 3, validation: (r) => r.required().max(400)}),
    defineField({name: 'readTime', title: 'Reading time', type: 'string', initialValue: '4 min read'}),
    image('mainImage', 'Featured image'),
    body,
    defineField({name: 'gallery', title: 'Photo gallery', type: 'array', of: [defineArrayMember({type: 'image', options: {hotspot: true}, fields: [defineField({name: 'alt', type: 'string', validation: (r) => r.required()})]})]}),
  ],
  orderings: [{title: 'Newest first', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'category', media: 'mainImage'}},
})

export const service = defineType({
  name: 'service', title: 'Service', type: 'document', icon: HeartIcon,
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}, validation: (r) => r.required()}),
    defineField({name: 'summary', type: 'text', rows: 3}),
    defineField({name: 'description', type: 'text', rows: 5}),
    defineField({name: 'features', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    image('image', 'Service photograph'), order,
  ],
  preview: {select: {title: 'title', media: 'image'}},
})

export const faq = defineType({
  name: 'faq', title: 'Frequently asked question', type: 'document', icon: HelpCircleIcon,
  fields: [
    defineField({name: 'question', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'answer', type: 'text', rows: 5, validation: (r) => r.required()}), order,
  ],
  preview: {select: {title: 'question'}},
})

export const page = defineType({
  name: 'page', title: 'Page introduction', type: 'document', icon: DocumentIcon,
  fields: [
    defineField({name: 'path', title: 'Website page', type: 'string', options: {list: [
      {title: 'About us', value: 'about'}, {title: 'Services', value: 'services'},
      {title: 'Appointments', value: 'appointment'}, {title: 'Contact', value: 'contact'},
      {title: 'Blog', value: 'blog'}, {title: 'Self-assessment', value: 'assessment'},
      {title: 'Corporate solutions', value: 'corporate'},
    ]}, validation: (r) => r.required()}),
    defineField({name: 'title', title: 'Page headline', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'introduction', type: 'text', rows: 4}),
  ],
  preview: {select: {title: 'title', subtitle: 'path'}},
})

export const schemaTypes = [siteSettings, homePage, person, post, service, faq, page]
