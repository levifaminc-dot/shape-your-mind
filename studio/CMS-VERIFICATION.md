# CMS verification — 1 November 2026

## Scope and fixes

Reviewed commit `61700ac870bbc4c765bb60a342a0e51573d9b045`, the Sanity schemas,
website query and rendering code, saved HTML, and existing blog tests.

- Added coverage for settings, homepage, profiles, services, FAQs and page introductions.
- Replaced positional homepage service matching with explicit service slugs.
  A partial or reordered collection can no longer overwrite unrelated cards.
- Connected published service titles, descriptions and features to the homepage
  service reader as well as the service page. Reader text is escaped and its
  booking action uses an event listener, so quotes or markup in titles are safe.
- Unknown social platforms no longer overwrite Instagram. Social destinations
  must use HTTPS, matching the Studio schema.

## Automated verification

- `npm test`: 18 tests passed. Includes the original blog coverage and failure
  cases across all 11 HTML files, including the three saved alias pages.
- Failure modes: empty collections, missing result fields, null result, rejected
  fetch, non-success HTTP status, invalid JSON and an aborted request.
- Partial singleton documents retain omitted/null fields and saved headline
  emphasis. WhatsApp updates retain the prefilled message query string.
- `npm run test:browser`: 48 Chromium cases passed: eight pages, three viewport
  widths (375, 768, 1440 pixels), with published content and a CMS outage.
- Browser checks include FAQ toggling, menu opening and Escape dismissal,
  rendered content, injection checks, uncaught errors and horizontal overflow.
- `npm run check` and `npm run build`: passed.

The DOM tests evaluate local HTML/scripts with stubbed responses. The browser
suite uses a real local HTTP server, real application scripts and CSS, and
intercepted external responses. Browser results establish the tested viewport
and fixture behavior; they do not cover every screen size or mobile engine.

## Read-only production observations

Checked `https://www.shapeurmind.org` using HTTP requests, the public Sanity API
and Chromium with the environment's network proxy. No editorial content was
changed, no forms were submitted and no Studio authentication was attempted.

- The public website returned HTTP 200.
- The published-content API returned HTTP 200 with site settings, homepage
  content, four visible team profiles, six services, five FAQs, seven page
  introductions and eight posts.
- The homepage initially reached the existing eight-second timeout and retained
  its saved HTML. A subsequent check successfully applied Sanity content;
  the headline, introduction and organization name matched the published API
  values. It displayed four team profiles, five FAQs and three article cards.
- About, services, contact, appointment, assessment, corporate and blog pages
  successfully set `data-content-source="sanity"`. About displayed four profiles
  and five FAQs, services displayed all six matching service headings, and blog
  displayed eight article cards. All eight pages had no horizontal overflow at
  375 pixels in this check.
- `/studio` and `https://shapeurmind.sanity.studio` both resolved through to
  Sanity's authentication flow with HTTP 200. This verifies public routing to
  sign-in, not authenticated editing or publishing.

The first timeout alone does not establish a production defect: network timing
in this environment is variable. Production image completion, authenticated
Studio workflows and actual publishing/unpublishing were not verified. All
production observations concern the existing deployment, before these fixes
are merged or deployed.
