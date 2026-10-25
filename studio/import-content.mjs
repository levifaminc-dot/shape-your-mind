import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {htmlToBlocks} from '@portabletext/block-tools';
import {Schema} from '@sanity/schema';
import {getCliClient} from 'sanity/cli';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const live = process.argv.includes('--import');
const reportDir = path.join(root, 'migration/reports');
const snapshotDir = path.join(root, 'migration/extracted');
await fs.mkdir(reportDir, {recursive:true});
await fs.mkdir(snapshotDir, {recursive:true});
const readPage = async (name) => {
  const html = await fs.readFile(path.join(root, name + '.html'), 'utf8');
  await fs.writeFile(path.join(snapshotDir,name+'.html'), html);
  return new JSDOM(html).window.document;
};
const home = await readPage('index');
const servicePage = await readPage('services');
const text = (el) => el?.textContent.replace(/\s+/g,' ').trim() || '';
const id = (type,key) => 'website-' + type + '-' + createHash('sha256').update(key).digest('hex').slice(0,24);
const photo = (el) => el ? {_type:'image', alt:el.alt || '', _sourceImage:el.getAttribute('src').split('?')[0]} : undefined;
const schema = Schema.compile({name:'import',types:[{name:'article',type:'object',fields:[{name:'body',type:'array',of:[{type:'block',styles:[{title:'Paragraph',value:'normal'},{title:'Heading',value:'h2'},{title:'Subheading',value:'h3'},{title:'Small heading',value:'h4'},{title:'Quote',value:'blockquote'}]}]}]}]});
const bodyType = schema.get('article').fields[0].type;
const docs=[];
const add=(type,key,fields)=>{const doc={_id:id(type,key),_type:type,...fields};docs.push(doc);return doc;};
const people = new Map();
for (const [index,card] of [...home.querySelectorAll('.team-card')].entries()) {
  const name=text(card.querySelector('.team-name'));
  const doc=add('person',name,{name,role:text(card.querySelector('.team-role')),biography:text(card.querySelector('.team-bio')),photo:photo(card.querySelector('img')),profile:true,order:index});
  people.set(name,doc);
}
docs.push({_id:'siteSettings',_type:'siteSettings',name:'Shape Your Mind Consult',description:text(home.querySelector('.footer-brand p')),phone:'+234 806 002 8943',email:'info@shapeurmind.org',whatsapp:'2348060028943',logo:photo(home.querySelector('.brand-img'))});
docs.push({_id:'homePage',_type:'homePage',headline:'Nurturing Minds.\nBuilding Resilience.\nTransforming Lives.',introduction:text(home.querySelector('.hero-description')),badge:text(home.querySelector('.hero-badge span')),heroImage:photo(home.querySelector('.hero-image'))});
for (const [index,card] of [...servicePage.querySelectorAll('.service-full-card')].entries()) {
  const summaryCard=home.querySelectorAll('.services-grid .service-card')[index];
  add('service',card.id,{title:text(card.querySelector('h2')),slug:{_type:'slug',current:card.id},summary:text(summaryCard?.querySelector('.service-description')),description:text(card.querySelector('.service-full-content > p')),features:[...card.querySelectorAll('.service-features-list li')].map(text),image:photo(card.querySelector('img')),order:index});
}
for (const [index,item] of [...home.querySelectorAll('.faq-item')].entries()) add('faq',String(index),{question:text(item.querySelector('.faq-question')),answer:text(item.querySelector('.faq-answer')),order:index});
for (const page of ['about','services','appointment','contact','blog','assessment','corporate']) {
  const dom=await readPage(page);
  add('page',page,{path:page,title:text(dom.querySelector('.page-banner-title')),introduction:text(dom.querySelector('.page-banner-subtitle'))});
}
const raw=await fs.readFile(path.join(root,'clean_posts_export.json'),'utf8');
await fs.writeFile(path.join(snapshotDir,'posts.json'),raw);
const posts=JSON.parse(raw);
for (const post of posts) {
  let person=[...people.values()].find((person)=>post.author.startsWith(person.name));
  if (!person || post.author.includes('&')) {
    person=people.get(post.author);
    if (!person) {person=add('person',post.author,{name:post.author,profile:false,order:100});people.set(post.author,person);}
  }
  let key=0;
  const blocks=htmlToBlocks(post.content,bodyType,{parseHtml:(html)=>new JSDOM(html).window.document,keyGenerator:()=>`text${key++}`});
  if (!blocks.length) throw new Error('Empty article body: '+post.slug);
  add('post',post.slug,{title:post.title,slug:{_type:'slug',current:post.slug},author:{_type:'reference',_ref:person._id},publishedAt:new Date(post.isoDate+'T12:00:00Z').toISOString(),category:post.category,excerpt:post.excerpt,readTime:post.readTime,body:blocks,mainImage:{_type:'image',alt:post.title,_sourceImage:post.featuredImage},gallery:(post.gallery||[]).map((image,index)=>({_type:'image',_key:'gallery'+index,alt:post.title+' — photo '+(index+1),_sourceImage:image}))});
}
const assets = new Set();
async function visit(value, fn) {
  if (!value || typeof value!=='object') return;
  if (value._sourceImage) await fn(value);
  for (const child of Object.values(value)) if (typeof child==='object') {
    if (Array.isArray(child)) {for (const item of child) await visit(item,fn);} else await visit(child,fn);
  }
}
for (const doc of docs) await visit(doc, async (image)=>{
  const assetPath=path.resolve(root,image._sourceImage);
  if (!assetPath.startsWith(root+path.sep)) throw new Error('Invalid image path');
  await fs.access(assetPath); assets.add(image._sourceImage);
});
const knownIds=new Set(docs.map(doc=>doc._id));
for (const doc of docs) {
  if (doc._type==='post' && !knownIds.has(doc.author._ref)) throw new Error('Unresolved author');
  if (doc._type==='post' && !doc.excerpt) throw new Error('Missing excerpt: '+doc.title);
}
const counts={};for (const doc of docs) counts[doc._type]=(counts[doc._type]||0)+1;
const report={projectId:'tfafyubm',dataset:'production',counts,uniqueAssets:assets.size,mode:live?'import':'dry-run',issues:[]};
await fs.writeFile(path.join(reportDir,'import-plan.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if (!live) process.exit(0);
const client=getCliClient({apiVersion:'2026-10-25'}).withConfig({projectId:'tfafyubm',dataset:'production',useCdn:false});
if (!client.config().token) throw new Error('Run this through sanity exec --with-user-token.');
const before=await client.fetch('count(*[!(_id in path("drafts.**"))])');
const cache=new Map();
for (const doc of docs) {
  if (await client.getDocument(doc._id)) {console.log('Preserved existing '+doc._type+': '+(doc.title||doc.name||doc._id));continue;}
  await visit(doc,async(image)=>{
    const source=image._sourceImage;
    if (!cache.has(source)) {
      const asset=await client.assets.upload('image',await fs.readFile(path.join(root,source)),{filename:path.basename(source)});
      cache.set(source,asset._id);
    }
    image.asset={_type:'reference',_ref:cache.get(source)};delete image._sourceImage;
  });
  await client.createIfNotExists(doc);
  console.log('Imported '+doc._type+': '+(doc.title||doc.name||doc._id));
}
const imported=await client.fetch('*[_id in $ids]{_id,_type,"hasImage":defined(mainImage.asset),"blocks":count(body)}',{ids:docs.map(doc=>doc._id)});
if (imported.length!==docs.length) throw new Error('Document count mismatch');
for (const doc of imported) if (doc._type==='post' && (!doc.hasImage||!doc.blocks)) throw new Error('Incomplete post '+doc._id);
report.before=before;report.importedDocuments=imported.length;report.completedAt=new Date().toISOString();
await fs.writeFile(path.join(reportDir,'import-result.json'),JSON.stringify(report,null,2));
console.log('Import verified: '+imported.length+' documents.');
