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
