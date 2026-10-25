import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const root = new URL('../', import.meta.url);
const app=await fs.readFile(new URL('js/app.js',root),'utf8');
const cms=await fs.readFile(new URL('js/cms.js',root),'utf8');
async function page(result,offline=false) {
  const dom=new JSDOM(await fs.readFile(new URL('blog.html',root),'utf8'),{url:'https://www.shapeurmind.org/blog.html',runScripts:'dangerously'});
  dom.window.matchMedia=()=>({addEventListener(){}});
  let request;
  dom.window.fetch=async(url)=>{request=url;if(offline)throw new Error('offline');return {ok:true,json:async()=>({result})};};
  for (const source of [app,cms]) { const script=dom.window.document.createElement('script'); script.textContent=source; dom.window.document.body.append(script); }
  await new Promise(resolve=>setTimeout(resolve,30));
  return {dom,request};
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
