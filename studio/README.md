# Shape Your Mind Content Studio

This standalone Sanity Studio edits project `tfafyubm`, dataset `production`.

## Work locally

Run `npm ci`, then `npm run dev` from this folder. Sign in with the Sanity account that has access to the Shape Your Mind project.

## Publish Studio changes

Run `npm run check`, `npm run build`, `npm run schema:deploy`, then `npm run deploy`.

## Content sections

- Site settings: organization, contact details, logo, social links.
- Homepage: main headline, introduction, badge, and photograph.
- Blog posts: rich text, authors, publication dates, categories, images, and galleries.
- Team & authors: profiles, roles, biographies, and portraits.
- Services: summaries, descriptions, features, and images.
- Frequently asked questions.
- Page introductions for the site's seven inner pages.

Only published content is displayed by the public website. Patient submissions and appointment records do not belong in this public dataset.

Keep tokens out of this repository and browser code. Studio uses Sanity's sign-in flow; public website queries do not require a token.

## Verify the website integration

Use Node.js 24 (the version used for verification):

```sh
cd studio
npm ci
npm test
npm run check
npm run build
npx playwright install --with-deps chromium
npm run test:browser
```

The browser suite also requires Python 3 for its local static server on port 4173.
The DOM suite exercises the real saved HTML and application scripts, covering all
content sections, clean URLs and aliases, safe rendering, partial documents, and
empty, failed, invalid-JSON and timed-out CMS responses. Its timeout test triggers
the real abort handler without waiting eight seconds.

The Chromium suite checks the homepage and seven inner pages at 375, 768 and
1440 pixels, with published content and a CMS outage. It checks content, FAQ
controls, mobile navigation, script errors, markup injection and horizontal
overflow. Sanity and other external assets are intercepted for repeatability;
these tests do not publish content or prove a production deployment is healthy.

Homepage service cards are matched by `data-service-slug`, rather than CMS
ordering. Keep service slugs aligned with the existing destinations:
`individual`, `diagnostic`, `corporate`, `child`, `crisis`, and `capacity`.
Published titles, descriptions and features also update the homepage service
reader; saved duration and format remain available because the schema does not
provide those fields. Unpublished services retain their saved website content.

See [CMS-VERIFICATION.md](CMS-VERIFICATION.md) for the verification record and
production observations.
