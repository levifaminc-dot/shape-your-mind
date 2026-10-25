/* Published website content from Sanity. No private tokens are used in the browser. */
(() => {
  'use strict';
  const project = 'tfafyubm';
  const api = `https://${project}.apicdn.sanity.io/v2026-10-25/data/query/production`;
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = (value) => {
    try {
      const url = new URL(value, location.origin);
      return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  };
  const imageUrl = (value) => {
    if (!value?.url) return '';
    try {
      const url = new URL(value.url);
      if (url.protocol !== 'https:' || url.hostname !== 'cdn.sanity.io') return '';
      url.searchParams.set('auto', 'format');
      url.searchParams.set('w', '1200');
      return url.href;
    } catch { return ''; }
  };
  function portableText(blocks) {
    let output = '', list = '', level = 0;
    for (const block of blocks || []) {
      if (block._type === 'image') {
        if (list) { output += `</${list}>`; list = ''; }
        const src = imageUrl(block);
        if (src) output += `<figure><img src="${escape(src)}" alt="${escape(block.alt)}" loading="lazy">${block.caption ? `<figcaption>${escape(block.caption)}</figcaption>` : ''}</figure>`;
        continue;
      }
      if (block._type !== 'block') continue;
      const content = (block.children || []).map((span) => {
        let text = escape(span.text).replace(/\n/g, '<br>');
        for (const mark of span.marks || []) {
          if (mark === 'strong') text = `<strong>${text}</strong>`;
          else if (mark === 'em') text = `<em>${text}</em>`;
          else {
            const link = (block.markDefs || []).find((def) => def._key === mark && def._type === 'link');
            const href = link && safeUrl(link.href);
            if (href) text = `<a href="${escape(href)}" rel="noopener noreferrer">${text}</a>`;
          }
        }
        return text;
      }).join('');
      const nextList = block.listItem === 'bullet' ? 'ul' : block.listItem === 'number' ? 'ol' : '';
      // Keep the source sequence while making list boundaries explicit.
      if (list && (list !== nextList || level !== (block.level || 1))) { output += `</${list}>`; list = ''; }
      if (nextList) {
        if (!list) { list = nextList; level = block.level || 1; output += `<${list}>`; }
        output += `<li>${content}</li>`;
      } else {
        const tag = ['h2','h3','h4','blockquote'].includes(block.style) ? block.style : 'p';
        output += `<${tag}>${content}</${tag}>`;
      }
    }
    return output + (list ? `</${list}>` : '');
  }
  function setText(selector, value) {
    if (value !== undefined && value !== null) document.querySelectorAll(selector).forEach((el) => { el.textContent = value; });
  }
  function setImage(selector, value) {
    const src = imageUrl(value);
    if (src) document.querySelectorAll(selector).forEach((el) => { el.src = src; el.alt = value.alt || ''; });
  }
  function applySettings(settings) {
    if (!settings) return;
    setText('.brand-subtitle', settings.name);
    setText('.footer-brand p', settings.description);
    setImage('.brand-img', settings.logo);
    if (settings.phone) document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      link.href = 'tel:' + settings.phone.replace(/[^+\d]/g, '');
      const label = link.querySelector('span');
      if (link.classList.contains('topbar-link') && label) label.textContent = settings.phone;
      else if (/^\+?[\d\s()-]+$/.test(link.textContent.trim())) link.textContent = settings.phone;
    });
    if (settings.email) document.querySelectorAll('a[href^="mailto:info@shapeurmind.org"]').forEach((link) => {
      link.href = 'mailto:' + settings.email; link.textContent = settings.email;
    });
    if (settings.whatsapp) document.querySelectorAll('a[href^="https://wa.me/"]').forEach((link) => {
      const current = new URL(link.href);
      current.pathname = '/' + settings.whatsapp.replace(/\D/g, ''); link.href = current.href;
    });
    for (const social of settings.socialLinks || []) {
      const url = safeUrl(social.url);
      if (url) document.querySelectorAll(`.social-icon-btn[aria-label="${social.platform === 'Twitter' ? 'Twitter' : social.platform === 'LinkedIn' ? 'LinkedIn' : 'Instagram'}"]`).forEach((link) => { link.href = url; });
    }
  }
  function applyHome(home) {
    if (!home) return;
    const title = document.querySelector('.hero-title');
    if (title && home.headline && title.textContent.replace(/\s+/g, ' ').trim() !== home.headline.replace(/\s+/g, ' ').trim()) {
      title.replaceChildren();
      home.headline.split('\n').forEach((line, index) => {
        if (index) title.append(document.createElement('br'));
        title.append(document.createTextNode(line));
      });
    }
    setText('.hero-description', home.introduction);
    setText('.hero-badge span', home.badge);
    setImage('.hero-image', home.heroImage);
  }
  function applyPeople(people) {
    if (!people?.length) return;
    const html = people.map((person) => `<div class="team-card">${imageUrl(person.photo) ? `<img class="team-photo" src="${escape(imageUrl(person.photo))}" alt="${escape(person.photo.alt || person.name)}" loading="lazy">` : ''}<div class="team-info"><h4 class="team-name">${escape(person.name)}</h4><p class="team-role">${escape(person.role)}</p><p class="team-bio">${escape(person.biography)}</p></div></div>`).join('');
    document.querySelectorAll('.team-grid').forEach((grid) => { grid.innerHTML = html; });
  }
  function applyFaqs(faqs) {
    if (!faqs?.length) return;
    document.querySelectorAll('.faq-list').forEach((list) => {
      list.innerHTML = faqs.map((faq) => `<div class="faq-item"><button class="faq-question" aria-expanded="false"><span>${escape(faq.question)}</span><i data-lucide="chevron-down"></i></button><div class="faq-answer"><p>${escape(faq.answer)}</p></div></div>`).join('');
    });
    if (typeof initFaqAccordion === 'function') initFaqAccordion();
  }
  function applyServices(services) {
    if (!services?.length) return;
    const cards = document.querySelectorAll('.services-grid .service-card');
    services.forEach((service, index) => {
      const card = cards[index];
      if (card) {
        if (service.title) card.querySelector('.service-title').textContent = service.title;
        if (service.summary) card.querySelector('.service-description').textContent = service.summary;
      }
      const detail = [...document.querySelectorAll('.service-full-card')].find((el) => el.id === service.slug);
      if (detail) {
        if (service.title) detail.querySelector('h2').textContent = service.title;
        if (service.description) detail.querySelector('.service-full-content > p').textContent = service.description;
        if (service.features?.length) detail.querySelector('.service-features-list').innerHTML = service.features.map((text) => `<li><i data-lucide="check"></i><span>${escape(text)}</span></li>`).join('');
        const src = imageUrl(service.image);
        if (src) { detail.querySelector('img').src = src; detail.querySelector('img').alt = service.image.alt || service.title; }
      }
    });
  }
  function applyPosts(posts) {
    if (!posts?.length || typeof blogPosts === 'undefined') return;
    const normalized = posts.map((post) => ({...post, date: new Date(post.publishedAt).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'}), featuredImage: imageUrl(post.mainImage), content: portableText(post.body), gallery: (post.gallery || []).map(imageUrl).filter(Boolean)}));
    // Replace the article lookup only once the published collection is available.
    Object.keys(blogPosts).forEach((key) => { delete blogPosts[key]; });
    normalized.forEach((post) => { blogPosts[post.slug] = {...post, title: escape(post.title), author: escape(post.author), category: escape(post.category), readTime: escape(post.readTime)}; });
    document.querySelectorAll('.blog-grid').forEach((grid) => {
      const isHome = !document.querySelector('.featured-article');
      grid.innerHTML = (isHome ? normalized.slice(0,3) : normalized).map((post) => `<article class="blog-card" data-category="${escape(post.category)}">${post.featuredImage ? `<div class="blog-thumb-wrap"><img class="blog-thumb" src="${escape(post.featuredImage)}" alt="${escape(post.mainImage?.alt || post.title)}" loading="lazy"><span class="blog-category-tag">${escape(post.category)}</span></div>` : ''}<div class="blog-content"><div class="blog-meta"><span>${escape(post.author)}</span><span>•</span><span>${escape(post.date)}</span></div><h3 class="blog-title">${escape(post.title)}</h3><p class="blog-excerpt">${escape(post.excerpt)}</p><button class="blog-read-link" type="button" data-post-slug="${escape(post.slug)}">Read full article <i data-lucide="arrow-right"></i></button></div></article>`).join('');
    });
    document.querySelectorAll('[data-post-slug]').forEach((button) => button.addEventListener('click', () => window.openArticle(button.dataset.postSlug)));
    const filters = document.querySelector('.blog-filters');
    if (filters) {
      const counts = new Map();
      normalized.forEach((post) => counts.set(post.category || 'Insights', (counts.get(post.category || 'Insights') || 0) + 1));
      filters.innerHTML = '<span>Filter topics:</span>';
      for (const [category, count] of [['all', normalized.length], ...counts]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-soft blog-filter-btn' + (category === 'all' ? ' active' : '');
        button.dataset.filter = category;
        button.textContent = (category === 'all' ? 'All' : category) + ' (' + count + ')';
        button.addEventListener('click', () => {
          filters.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
          document.querySelectorAll('.blog-grid .blog-card').forEach((card) => { card.style.display = category === 'all' || card.dataset.category === category ? 'flex' : 'none'; });
        });
        filters.append(button);
      }
      setText('#blogCollectionTitle', 'Explore all ' + normalized.length + ' articles & field updates');
    }
    const explore = document.querySelector('a[data-blog-collection-link]');
    if (explore) explore.textContent = 'Explore all ' + normalized.length + ' articles & field galleries';
    const featured = document.querySelector('.featured-article');
    if (featured) {
      const post = normalized[0];
      const src = post.featuredImage;
      if (src) { featured.querySelector('img').src = src; featured.querySelector('img').alt = post.mainImage?.alt || post.title; }
      featured.querySelector('h2').textContent = post.title;
      featured.querySelector('.featured-article-content > p').textContent = post.excerpt || '';
      featured.querySelector('.blog-meta').textContent = `${post.author} · ${post.date} · ${post.readTime || ''}`;
      featured.querySelectorAll('.featured-article-image .topbar-badge').forEach((badge) => { badge.hidden = true; });
      const button = featured.querySelector('button');
      button.removeAttribute('onclick'); button.onclick = () => window.openArticle(post.slug);
      button.textContent = 'Read full article';
      const category = featured.querySelector('.featured-article-content > div:last-child > span');
      if (category) category.textContent = 'Category: ' + (post.category || 'Insights');
    }
    const slug = decodeURIComponent(location.hash.slice(1));
    if (slug && blogPosts[slug] && window.openArticle) window.openArticle(slug);
  }
  async function load() {
    const query = `{
      "settings": *[_id == "siteSettings"][0]{name,description,phone,email,whatsapp,logo{alt,"url":asset->url},socialLinks},
      "home": *[_id == "homePage"][0]{headline,introduction,badge,heroImage{alt,"url":asset->url}},
      "people": *[_type == "person" && profile == true] | order(order asc, name asc){name,role,biography,photo{alt,"url":asset->url}},
      "services": *[_type == "service"] | order(order asc){title,"slug":slug.current,summary,description,features,image{alt,"url":asset->url}},
      "faqs": *[_type == "faq"] | order(order asc){question,answer},
      "pages": *[_type == "page"]{path,title,introduction},
      "posts": *[_type == "post" && defined(slug.current)] | order(publishedAt desc){title,"slug":slug.current,"author":author->name,publishedAt,category,excerpt,readTime,mainImage{alt,"url":asset->url},body[]{..., _type == "image" => {"url":asset->url}},gallery[]{alt,"url":asset->url}}
    }`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${api}?query=${encodeURIComponent(query)}&perspective=published`, {signal:controller.signal});
      if (!response.ok) throw new Error('Content request failed');
      const {result} = await response.json();
      if (!result) return;
      applySettings(result.settings); applyHome(result.home); applyPeople(result.people);
      applyFaqs(result.faqs); applyServices(result.services); applyPosts(result.posts);
      const aliases = {'about-us':'about','contact-us':'contact','book':'appointment'};
      const path = location.pathname.split('/').pop().replace(/\.html$/, '');
      const page = result.pages?.find((page) => page.path === (aliases[path] || path));
      if (page) { setText('.page-banner-title', page.title); setText('.page-banner-subtitle', page.introduction); }
      document.documentElement.dataset.contentSource = 'sanity';
      if (window.lucide) window.lucide.createIcons();
    } catch (error) { console.info('Using the saved website content while the content service is unavailable.'); }
    finally { clearTimeout(timer); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
