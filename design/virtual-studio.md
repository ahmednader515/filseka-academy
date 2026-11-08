# Virtual studio

- Student page: `/dashboard/studio`
- Student recording library: `/dashboard/studio/recordings` (search, feedback, metadata edits, audio replacement and confirmed deletion).
- Admin page: `/dashboard/studio/manage`
- Reference: `public/vitrual-studio.jpeg`; hero artwork: `public/background.png`.
- Students can record, pause, resume, preview and submit audio, or upload audio files up to 100 MiB. Audio enhancement opens MyEdit in a new tab.
- Admins create/edit/hide exercises and provide written feedback plus an optional 0–100 score. Hidden exercises retain their existing submissions. Students see only their own ready submissions and reviews. Feedback refreshes automatically every 30 seconds while the page is visible and on manual refresh.
- Editing a recording title/exercise preserves its review. Audio replacement uploads and verifies a new pending submission before atomically removing the original submission and making the new one ready for a fresh review. The previous audio object is then cleaned up. A failed upload leaves the original intact. Deletion removes the stored audio and its owner-scoped submission/review after an inline confirmation.
- Removing a local take discards it before submission. Uploaded audio is private: playback requires an authenticated owner/admin and receives an expiring signed storage URL.

## Storage and database

The studio uses the existing PostgreSQL and Cloudflare R2 environment variables. `scripts/add-virtual-studio.sql` creates the tables and index; runtime initialization also creates missing tables. Prisma models include the same tables. No existing courses, lessons or enrollments are changed.

The browser uploads directly to R2 with a 15-minute signed PUT URL, keeping 100 MiB uploads outside the web host's request body limit. Completion verifies the stored object's size and MIME type before making it available for review. Failed or abandoned uploads remain pending and are never shown as submissions.

The bucket must allow PUT CORS requests for the application origins, with `content-type`, `content-length` and `x-amz-*` request headers. Existing GET/HEAD CORS rules should be preserved. Localhost and the academy production domains have been configured on the current bucket. Add preview/staging origins when using other domains. A storage lifecycle rule may expire abandoned pending objects if needed; do not expire all studio objects, since they include submitted recordings.

Microphone recording requires HTTPS in production (localhost also works) and the student's microphone permission. Uploaded audio formats must be playable by the student's/admin's browser; unsupported native codecs can still be stored but may require conversion before playback.

## Checks

`node scripts/test-virtual-studio.mjs` runs isolated API checks without database/storage writes. Also run TypeScript and ESLint for the changed files. Browser verification covered recording/pause/resume, local playback, mocked submission, admin exercise/review forms, and desktop/mobile layout. A temporary audio object was successfully uploaded and fetched using signed URLs in Chrome and removed after the storage check.
