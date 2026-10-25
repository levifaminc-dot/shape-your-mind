# Content import and website connection

Source: the current public HTML website and `clean_posts_export.json` in this repository. No private submissions, appointment records, unpublished content, or historical revisions are imported.

Target: Sanity project `tfafyubm`, public `production` dataset.

Mapping:
- Existing blog export → posts with author references, publication dates, Portable Text bodies, featured images and galleries.
- Homepage team profiles → reusable people; collective bylines become authors without public team profiles.
- Detailed service page → service descriptions/features; homepage cards provide summaries.
- Homepage FAQ → ordered questions and answers.
- Existing page introductions → seven page documents.
- Shared contact details and homepage hero → singletons.

The script snapshots source files under `migration/extracted/`, checks source image files and references, and reports a dry-run inventory before writing. Images are uploaded into Sanity. Existing source-backed records use stable import IDs and `createIfNotExists`, so rerunning preserves editorial changes. The small source collection is imported sequentially after uploading each document's assets. Referenced people are created before posts.

Run `node import-content.mjs` in `studio/` for a dry run. After reviewing the inventory, use the authenticated Sanity CLI with `sanity exec import-content.mjs --with-user-token -- --import` to import. Credentials come from the CLI and are never saved in the repository.

There are no route changes. Existing `.html` and article hash links stay valid. The public website queries published records and keeps saved HTML as a fallback when the dataset is empty or unavailable. Drafts are not queried. After import, check the homepage, blog reader, gallery, filters, team, services, FAQs, and mobile layout before deploying the frontend connection.

Validation: compare imported document counts with the dry-run inventory; check post bodies, image references and authors; then run Sanity document validation and verify representative pages in the browser. Generated snapshots and reports are ignored by Git.
