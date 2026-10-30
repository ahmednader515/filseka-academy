# Academy blog

- `/blog`: featured post, categories, search, pagination and article recommendations.
- `/blog/[slug]`: full article with cover, author, publication date, calculated reading time and related posts.
- `/dashboard/blog`: administrators and assistant administrators can create, edit, preview, publish and unpublish articles. Arabic content is required for publication; English translations are optional.
- Cover images can use a public-root path or HTTP(S) URL. Uploads use the existing `/api/upload/image` endpoint and its R2 configuration. Leaving the image blank uses category artwork.
- Drafts are excluded from public listing and article lookups. Unchecking publication and saving hides a post. The first publication timestamp is preserved across edits and later republication.
- Slugs support Arabic and Latin letters, numbers and hyphens. A unique database constraint prevents duplicates. The `demo-` prefix is reserved for illustrative articles. Changing an already published slug invalidates its old URL.
- Body formatting supports `##` and `###` headings, paragraphs, bullet and numbered lists, `**bold**` and `[label](https://example.com)` links. Raw HTML is rendered as text; unsafe link protocols are not made clickable.
- Six explicitly labeled example articles appear until the first real post is published. Example article pages have `noindex` metadata. No fake views, subscriber form or publication dates are displayed.
- `BlogPost` and its index are created automatically on first use. In deployments without schema creation permissions, apply `scripts/add-blog-posts.sql` first.

Run `node scripts/check-blog.mjs` for validation and safe-formatting checks. Add `--database` to check draft creation, editing, slug uniqueness and public draft isolation against the configured database. This mode creates one private fixture and removes it in a `finally` block without publishing it.
