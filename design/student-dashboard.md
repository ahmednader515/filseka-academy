# Student dashboard theme

The student dashboard uses `public/dashboard.jpeg` as its visual reference. It renders the signed-in student's accessible courses, unlocked lessons in the first listed course, future sessions for that course, balance, subscription state and library purchases. It does not invent completion percentages, certificates or badges.

Student navigation has one learning section. The only retained academy links are the media library, blog and technical support. Guest and staff navigation retain their existing behavior.

`StudentDashboardShell` provides the shared black and red theme for the dashboard, profile, messages and balance pages. Students use the sidebar instead of the duplicate dashboard tab row. Existing activation, payment, account editing, messaging and subscription actions are retained.

Run `node scripts/check-student-dashboard.mjs` for menu, access-boundary and empty-state checks. The optional `--preview` flag writes a standalone HTML fixture to the operating system temporary directory. It uses test data and does not authenticate a user, publish a route or modify the database.
