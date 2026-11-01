import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const root = new URL('../', import.meta.url);
const app=await fs.readFile(new URL('js/app.js',root),'utf8');
const cms=await fs.readFile(new URL('js/cms.js',root),'utf8');
const files = ['index.html','about.html','about-us.html','services.html','appointment.html','book.html','contact.html','contact-us.html','blog.html','assessment.html','corporate.html'];
const attack = `<img src=x onerror="alert(1)"><script>alert(1)</script> 'quoted' & "double"`;
const image = (alt = attack) => ({url:'https://cdn.sanity.io/images/tfafyubm/production/test-1200x800.jpg',alt});
async function page(result, offline = false, file = 'blog.html', mode = '', route = file) {
  const errors = [], requests = [], media = [];
  const dom = new JSDOM(await fs.readFile(new URL(file,root),'utf8'), {
    url: 'https://www.shapeurmind.org/' + route, runScripts: 'dangerously',
    beforeParse(window) { window.addEventListener('error', event => errors.push(event.error)); }
  });
  const {window} = dom;
  window.matchMedia = query => ({addEventListener(type, callback) { media.push({query,callback}); }});
  window.console.info = () => {};
  let expire;
  const originalTimer = window.setTimeout.bind(window);
  window.setTimeout = (callback, delay, ...args) => delay === 8000 ? (expire = callback, -1) : originalTimer(callback, delay, ...args);
  window.fetch = async (url, options) => {
    requests.push({url, options});
    if (offline) throw new Error('offline');
    if (mode === 'timeout') return new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new window.DOMException('Aborted','AbortError')));
      queueMicrotask(expire);
    });
    return {ok: mode !== 'http-error', json: async () => {
      if (mode === 'invalid-json') throw new SyntaxError('Invalid JSON');
      return {result};
    }};
  };
  for (const source of [app,cms]) {
    const script = window.document.createElement('script');
    script.textContent = source; window.document.body.append(script);
  }
  if (window.document.readyState === 'loading') await new Promise(resolve => window.document.addEventListener('DOMContentLoaded', resolve, {once:true}));
  // Drain the fetch/json microtasks without a timing-dependent sleep.
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(errors, [], 'website scripts must not throw');
  assert.equal(requests.length, 1, 'one published-content request per page');
  return {dom, request: requests[0].url, requests, media};
}
function safe(doc, selector) {
  assert.equal(doc.querySelectorAll(`${selector} script, ${selector} [onerror], ${selector} [onload], ${selector} a[href^="javascript:"]`).length,0);
}
test('published posts render safely, open in the reader, and retain working category filters',async()=>{
  const title='<img src=x onerror="alert(1)">';
  const {dom,request}=await page({posts:[{slug:'new-post',title,author:'A <script>author</script>',category:'Clinical Training',publishedAt:'2026-10-25T12:00:00Z',excerpt:'New article',readTime:'3 min read',gallery:[],body:[{_type:'block',style:'normal',markDefs:[{_key:'bad',_type:'link',href:'javascript:alert(1)'}],children:[{_type:'span',text:'Safe body',marks:['bad']}]}]},{slug:'second-post',title:'Second article',author:'Team',category:'Workplace Wellness',publishedAt:'2026-10-24T12:00:00Z',excerpt:'Another article',body:[],gallery:[]}]});
  const doc=dom.window.document;
  assert.match(request,/perspective=published/);
  assert.equal(doc.querySelectorAll('.blog-grid .blog-card').length,2);
  assert.equal(doc.querySelector('.blog-title').textContent,title);
  doc.querySelector('[data-post-slug]').click();
  assert.equal(doc.querySelector('#blogModalContent h2').textContent,title);
  assert.equal(doc.querySelectorAll('#blogModalContent script, #blogModalContent [onerror], #blogModalContent a[href^="javascript:"]').length,0);
  assert.ok(doc.querySelector('#blogModalContent').textContent.includes('Safe body'));
  const mismatch=[...doc.querySelectorAll('.blog-filter-btn')].find(e=>e.dataset.filter!=='all'&&!'clinical training'.includes(e.dataset.filter.toLowerCase()));
  mismatch.click();assert.equal(doc.querySelector('.blog-card').style.display,'none');
  doc.querySelector('.blog-filter-btn[data-filter="all"]').click();assert.equal(doc.querySelector('.blog-card').style.display,'flex');
  dom.window.close();
});
test('empty or unavailable CMS preserves saved website content',async()=>{
  for (const offline of [false,true]) {
    const {dom}=await page({posts:[]},offline);
    assert.equal(dom.window.document.querySelectorAll('.blog-grid .blog-card').length,8);
    assert.ok(dom.window.document.querySelector('.featured-article h2').textContent.includes('Problem Management Plus'));
    dom.window.close();
  }
});

test('homepage publishes multiline text and approved images without interpreting markup', async t => {
  const {dom,request} = await page({home:{headline:attack+'\nA second line',introduction:attack,badge:attack,heroImage:image()}},false,'index.html');
  t.after(() => dom.window.close());
  const doc = dom.window.document;
  assert.equal(doc.querySelector('.hero-title').textContent,attack+'A second line');
  assert.equal(doc.querySelectorAll('.hero-title br').length,1);
  for (const selector of ['.hero-description','.hero-badge span']) assert.equal(doc.querySelector(selector).textContent,attack);
  assert.equal(doc.querySelector('.hero-image').alt,attack);
  assert.match(doc.querySelector('.hero-image').src,/auto=format&w=1200/);
  safe(doc,'.hero');
  const query = new URL(request);
  assert.equal(query.searchParams.get('perspective'),'published');
  for (const type of ['siteSettings','homePage','person','service','faq','page']) assert.ok(query.searchParams.get('query').includes(type));
  assert.ok(query.searchParams.get('query').includes('profile == true'));
});

test('site settings update shared branding and contact links on every page', async t => {
  for (const file of files) {
    const {dom} = await page({settings:{name:attack,description:attack,phone:'+234 (800) 123-4567',email:'editors@example.org',whatsapp:'+234 800 765 4321',logo:image(),socialLinks:[{platform:'LinkedIn',url:'https://example.org/company'},{platform:'Instagram',url:'https://example.org/photos'},{platform:'Twitter',url:'https://example.org/news'}]}},false,file);
    t.after(() => dom.window.close());
    const doc = dom.window.document;
    assert.equal(doc.querySelector('.brand-subtitle').textContent,attack,file);
    assert.equal(doc.querySelector('.footer-brand p').textContent,attack,file);
    assert.equal(doc.querySelector('.brand-img').alt,attack,file);
    for (const link of doc.querySelectorAll('a[href^="tel:"]')) assert.equal(link.getAttribute('href'),'tel:+2348001234567');
    const original = new JSDOM(await fs.readFile(new URL(file,root),'utf8'));
    const emailCount = original.window.document.querySelectorAll('a[href^="mailto:info@shapeurmind.org"]').length;
    original.window.close();
    assert.equal(doc.querySelectorAll('a[href="mailto:editors@example.org"]').length,emailCount,file);
    for (const link of doc.querySelectorAll('a[href^="https://wa.me/"]')) assert.equal(new URL(link.href).pathname,'/2348007654321');
    for (const [platform,path] of [['LinkedIn','company'],['Instagram','photos'],['Twitter','news']]) {
      for (const link of doc.querySelectorAll(`.social-icon-btn[aria-label="${platform}"]`)) assert.equal(link.href,'https://example.org/'+path);
    }
    safe(doc,'.footer'); safe(doc,'.navbar');
  }
});

test('team profiles replace saved cards safely on home and both about URLs', async t => {
  for (const file of ['index.html','about.html','about-us.html']) {
    const {dom} = await page({people:[{name:attack,role:attack,biography:attack,photo:image()},{name:'No portrait',role:'Counsellor',photo:{url:'https://evil.example/image.jpg'}}]},false,file);
    t.after(() => dom.window.close());
    const doc = dom.window.document;
    assert.equal(doc.querySelectorAll('.team-card').length,2);
    for (const selector of ['.team-name','.team-role','.team-bio']) assert.equal(doc.querySelector(selector).textContent,attack);
    assert.equal(doc.querySelectorAll('.team-photo').length,1);
    assert.equal(doc.querySelector('.team-photo').getAttribute('loading'),'lazy');
    safe(doc,'.team-grid');
  }
});

test('published FAQs remain operable and exclusive after replacing saved questions', async t => {
  for (const file of ['index.html','about.html','about-us.html']) {
    const {dom} = await page({faqs:[{question:attack,answer:attack},{question:'Next question',answer:'Next answer'}]},false,file);
    t.after(() => dom.window.close());
    const doc = dom.window.document, buttons = doc.querySelectorAll('.faq-question');
    assert.equal(buttons.length,2);
    assert.equal(buttons[0].querySelector('span').textContent,attack);
    assert.equal(doc.querySelector('.faq-answer p').textContent,attack);
    buttons[0].click(); assert.equal(buttons[0].getAttribute('aria-expanded'),'true');
    buttons[1].click(); assert.equal(buttons[0].getAttribute('aria-expanded'),'false');
    assert.equal(buttons[1].getAttribute('aria-expanded'),'true');
    buttons[1].click(); assert.equal(doc.querySelectorAll('.faq-item.open').length,0);
    safe(doc,'.faq-list');
  }
});

test('services match their stable slug even when publication is partial or reordered', async t => {
  const services = [{slug:'capacity',title:attack,summary:attack,description:attack,features:[attack,'Second feature'],image:image()},{slug:'child',title:'Child support',summary:'Youth summary'},{slug:'unknown',title:'Unmapped service',summary:'Must not overwrite another card'}];
  const {dom} = await page({services},false,'index.html');
  t.after(() => dom.window.close());
  const doc = dom.window.document, cards = doc.querySelectorAll('.services-grid .service-card');
  assert.equal(cards[5].querySelector('.service-title').textContent,attack);
  assert.equal(cards[5].querySelector('.service-description').textContent,attack);
  assert.equal(cards[3].querySelector('.service-title').textContent,'Child support');
  assert.equal(cards[0].querySelector('.service-title').textContent,'Individual Counseling & Psychotherapy');
  safe(doc,'.services-grid');
  dom.window.viewServiceDetails('capacity');
  assert.equal(doc.querySelector('#serviceModalContent h3').textContent,attack);
  assert.equal(doc.querySelector('#serviceModalContent > p').textContent,attack);
  assert.ok(doc.querySelector('#serviceModalContent ul').textContent.includes(attack));
  safe(doc,'#serviceModalContent');
  let booking;
  dom.window.openBookingModal = title => { booking = title; };
  doc.querySelector('[data-service-booking]').click();
  assert.equal(booking,attack);

  const detail = await page({services},false,'services.html');
  t.after(() => detail.dom.window.close());
  const card = detail.dom.window.document.querySelector('#capacity');
  assert.equal(card.querySelector('h2').textContent,attack);
  assert.equal(card.querySelector('.service-full-content > p').textContent,attack);
  assert.equal(card.querySelectorAll('.service-features-list li').length,2);
  assert.equal(card.querySelector('.service-features-list span').textContent,attack);
  assert.equal(card.querySelector('img').alt,attack);
  safe(detail.dom.window.document,'.service-full-card');
});

test('page introductions match canonical, clean and alias URLs without touching other pages', async t => {
  const routes = {'about':'about','about-us':'about','contact':'contact','contact-us':'contact','book':'appointment','appointment':'appointment','services':'services','blog':'blog','assessment':'assessment','corporate':'corporate'};
  for (const [route,path] of Object.entries(routes)) for (const suffix of ['.html','']) {
    const file = route+'.html';
    // Use the actual saved HTML while testing the deployed clean URL as well.
    const {dom} = await page({pages:[{path:'unrelated',title:'Wrong page'},{path,title:attack,introduction:attack}]},false,file,'',route+suffix);
    t.after(() => dom.window.close());
    assert.equal(dom.window.document.querySelector('.page-banner-title').textContent,attack);
    assert.equal(dom.window.document.querySelector('.page-banner-subtitle').textContent,attack);
    safe(dom.window.document,'.page-banner');
  }
});

const contentSelectors = ['.brand-subtitle','.footer-brand p','.brand-img','.hero-title','.hero-description','.hero-badge','.hero-image','.team-grid','.services-grid','.service-full-card','.faq-list','.page-banner-title','.page-banner-subtitle','.blog-grid','.featured-article'];
function snapshot(doc) { return contentSelectors.flatMap(selector => [...doc.querySelectorAll(selector)].map(el => el.outerHTML)); }
for (const mode of ['empty','missing','null','offline','http-error','invalid-json','timeout']) {
  test(`${mode} CMS preserves saved content and usable navigation across all pages`, async t => {
    for (const file of files) {
      const saved = new JSDOM(await fs.readFile(new URL(file,root),'utf8'));
      const baseline = snapshot(saved.window.document); saved.window.close();
      const result = mode === 'null' ? null : mode === 'missing' ? {} : {settings:null,home:null,people:[],services:[],faqs:[],pages:[],posts:[]};
      const {dom,requests,media} = await page(result,mode === 'offline',file,mode);
      t.after(() => dom.window.close());
      const doc = dom.window.document;
      assert.deepEqual(snapshot(doc),baseline,file);
      if (mode === 'timeout') assert.equal(requests[0].options.signal.aborted,true);
      const toggle = doc.querySelector('#mobileToggle');
      toggle.click(); assert.equal(toggle.getAttribute('aria-expanded'),'true');
      media.find(item => item.query === '(max-width: 1024px)').callback();
      assert.equal(toggle.getAttribute('aria-expanded'),'false');
      toggle.click(); doc.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape'}));
      assert.equal(toggle.getAttribute('aria-expanded'),'false');
      const faq = doc.querySelector('.faq-question');
      if (faq) { faq.click(); assert.equal(faq.getAttribute('aria-expanded'),'true'); }
    }
  });
}

test('invalid image origins and unsafe or unknown social links preserve saved values', async t => {
  const saved = new JSDOM(await fs.readFile(new URL('index.html',root),'utf8'));
  const original = selector => saved.window.document.querySelector(selector).getAttribute('src');
  t.after(() => saved.window.close());
  for (const url of ['javascript:alert(1)','data:image/svg+xml,bad','http://cdn.sanity.io/x','https://cdn.sanity.io.evil.example/x','https://evil.example/x']) {
    const {dom} = await page({home:{heroImage:{url}},settings:{logo:{url},socialLinks:[{platform:'Instagram',url:'javascript:alert(1)'},{platform:'Unknown',url:'https://evil.example/'}]}},false,'index.html');
    t.after(() => dom.window.close());
    for (const selector of ['.hero-image','.brand-img']) assert.equal(dom.window.document.querySelector(selector).getAttribute('src'),original(selector));
    for (const link of dom.window.document.querySelectorAll('.social-icon-btn')) assert.notEqual(link.href,'https://evil.example/');
  }
});

test('partial singleton documents preserve omitted fields, styled headlines and WhatsApp messages', async t => {
  const saved = new JSDOM(await fs.readFile(new URL('index.html',root),'utf8'));
  t.after(() => saved.window.close());
  const original = saved.window.document;
  const headline = original.querySelector('.hero-title').textContent.replace(/\s+/g,' ').trim();
  const {dom} = await page({settings:{name:null,description:null,phone:null,email:null,whatsapp:'2348000000000',logo:null,socialLinks:null},home:{headline,introduction:null,badge:null,heroImage:null},services:[{slug:'individual',title:null,summary:null,description:null,features:[],image:null}],people:[],faqs:[],pages:[]},false,'index.html');
  t.after(() => dom.window.close());
  const doc = dom.window.document;
  assert.deepEqual(snapshot(doc),snapshot(original));
  const before = original.querySelector('.floating-support-btn'), after = doc.querySelector('.floating-support-btn');
  assert.equal(new URL(after.href).search,new URL(before.href).search);
  assert.equal(new URL(after.href).pathname,'/2348000000000');
  assert.equal(doc.querySelector('.hero-title').innerHTML,original.querySelector('.hero-title').innerHTML);
});

test('unmatched page documents leave introductions intact and null optional fields retain saved text',async t=>{
  const saved = new JSDOM(await fs.readFile(new URL('contact.html',root),'utf8'));
  t.after(() => saved.window.close());
  for (const pages of [[{path:'about',title:'Wrong page',introduction:'Wrong introduction'}],[{path:'contact',title:null,introduction:null}]]) {
    const {dom} = await page({pages},false,'contact.html');
    t.after(() => dom.window.close());
    for(const selector of ['.page-banner-title','.page-banner-subtitle']) assert.equal(dom.window.document.querySelector(selector).innerHTML,saved.window.document.querySelector(selector).innerHTML);
  }
});
