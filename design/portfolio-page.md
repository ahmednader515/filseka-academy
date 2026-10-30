# Academy portfolio

- `/portfolio` displays published works with category filters, search and a video preview dialog.
- `/dashboard/portfolio` lets administrators and assistant administrators add and edit works, save drafts, publish and unpublish them. Students and teachers cannot publish.
- Published videos support YouTube, YouTube Shorts, and direct HTTP(S) MP4/WebM links. The player never autoplays. YouTube embeds use the privacy-enhanced `youtube-nocookie.com` domain. Thumbnail URLs can be public-root paths or HTTP(S) URLs.
- The `PortfolioWork` table is created automatically on first use. For deployments without schema creation permissions, run `scripts/add-portfolio-works.sql` before visiting the page.
- When no real work is published, eight clearly labeled demo cards use the existing academy category artwork. Demos contain no invented production statistics, durations or video links. Clicking one opens an illustrative preview. Publishing a real work replaces the demo collection.
- The public gallery only reads the dedicated published portfolio collection. Existing private messages, homework and student uploads are never used as public portfolio content.
