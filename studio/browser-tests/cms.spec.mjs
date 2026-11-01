import {test,expect} from '@playwright/test';

const text = 'Published content <img src=x onerror="window.cmsInjected=true">';
const image = {url:'https://cdn.sanity.io/images/tfafyubm/production/test-600x400.jpg',alt:'CMS portrait'};
const paths = ['about','services','appointment','contact','blog','assessment','corporate'];
const content = {
  settings:{name:'CMS organization',description:text,email:'cms@example.org',phone:'+234 800 123 4567',logo:image},
  home:{headline:'Published homepage\nBuilding resilience',introduction:text,badge:'Published badge',heroImage:image},
  people:[{name:'Published team member',role:'Clinical psychologist',biography:text,photo:image}],
  services:[{slug:'capacity',title:'Published training',summary:text,description:text,features:[text],image}],
  faqs:[{question:'Published question',answer:text},{question:'Second question',answer:'Second answer'}],
  pages:paths.map(path=>({path,title:'Published '+path,introduction:text})),
};

for (const offline of [false,true]) for (const file of ['index',...paths]) {
  test(`${file}: ${offline?'CMS outage':'published content'}`,async({page})=>{
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    // Keep layout tests deterministic and independent of third-party CDNs.
    await page.route('**/*',async route=>{
      const url = new URL(route.request().url());
      if(url.hostname==='127.0.0.1') return route.continue();
      if(url.hostname==='tfafyubm.apicdn.sanity.io') {
        expect(url.searchParams.get('perspective')).toBe('published');
        return offline ? route.abort('failed') : route.fulfill({json:{result:content},headers:{'access-control-allow-origin':'*'}});
      }
      if(url.hostname==='cdn.sanity.io') return route.fulfill({path:new URL('../../images/test_small.png',import.meta.url).pathname,contentType:'image/png',headers:{'access-control-allow-origin':'*'}});
      return route.fulfill({body:'',contentType:route.request().resourceType()==='script'?'application/javascript':'text/css'});
    });
    const response = await page.goto('/'+file+'.html');
    expect(response.status()).toBe(200);
    if(!offline) {
      await expect(page.locator('html')).toHaveAttribute('data-content-source','sanity');
      await expect(page.locator('.brand-subtitle').first()).toHaveText(content.settings.name);
      if(file==='index') {
        await expect(page.locator('.hero-title')).toHaveText('Published homepageBuilding resilience');
        await expect(page.locator('[data-service-slug="capacity"] .service-title')).toHaveText('Published training');
        await expect(page.locator('[data-service-slug="individual"] .service-title')).toContainText('Individual');
      } else await expect(page.locator('.page-banner-title')).toHaveText('Published '+file);
      if(file==='index'||file==='about') {
        await expect(page.locator('.team-name')).toHaveText('Published team member');
        await expect(page.locator('.faq-question').first()).toContainText('Published question');
      }
      if(file==='index') {
        await page.locator('[data-service-slug="capacity"] .service-link').click();
        await expect(page.locator('#serviceModalContent h3')).toHaveText('Published training');
        await expect(page.locator('#serviceModalContent > p')).toHaveText(text);
        await expect(page.locator('#serviceModalContent [onerror]')).toHaveCount(0);
        await page.locator('[data-service-booking]').click();
        await expect(page.locator('#serviceModal')).not.toHaveClass(/active/);
        await expect(page.locator('#bookingModal')).toHaveClass(/active/);
        await page.locator('#bookingModal .modal-close-btn').click();
      }
      if(file==='services') await expect(page.locator('#capacity h2')).toHaveText('Published training');
    } else {
      await expect(page.locator('.brand-subtitle').first()).toHaveText('Shape Your Mind Consult');
      await expect(page.locator('html')).not.toHaveAttribute('data-content-source','sanity');
      await expect(page.locator(file==='index'?'.hero-title':'.page-banner-title')).not.toBeEmpty();
    }
    expect(await page.evaluate(()=>window.cmsInjected)).toBeUndefined();
    await expect(page.locator('.team-grid [onerror], .faq-list [onerror], .services-grid [onerror], .page-banner [onerror]')).toHaveCount(0);
    if(file==='index'||file==='about') {
      const question=page.locator('.faq-question').first();
      await question.click(); await expect(question).toHaveAttribute('aria-expanded','true');
      await expect(page.locator('.faq-item.open .faq-answer')).toBeVisible();
      await question.click(); await expect(question).toHaveAttribute('aria-expanded','false');
    }
    if(page.viewportSize().width<=1024) {
      const toggle = page.locator('#mobileToggle');
      await toggle.click(); await expect(toggle).toHaveAttribute('aria-expanded','true');
      await expect(page.locator('#navMenu')).toBeVisible();
      await page.keyboard.press('Escape'); await expect(toggle).toHaveAttribute('aria-expanded','false');
    }
    const layout = await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    expect(layout.scroll).toBeLessThanOrEqual(layout.width+1);
    const selectors = file==='index'?['.hero-title','.team-card','.service-card']:file==='about'?['.page-banner-title','.team-card']:file==='services'?['.page-banner-title','.service-full-card']:['.page-banner-title'];
    for(const selector of selectors) for(const box of await page.locator(selector).evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right}}))) {
      expect(box.left).toBeGreaterThanOrEqual(-1); expect(box.right).toBeLessThanOrEqual(layout.width+1);
    }
    expect(errors).toEqual([]);
  });
}
