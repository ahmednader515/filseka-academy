# Add balance page

`/dashboard/add-balance` uses `public/balance.jpeg` as its design reference. `/add-balance` redirects to that authenticated student page.

The design reflects the existing manual transfer workflow: choose a configured method, copy its exact destination, transfer with the student's own payment app, send the receipt using the existing WhatsApp contact, and wait for staff review. It does not add payment providers, perform transfers, promise instant credit or claim automated email receipts.

Method titles, instructions, destinations, confirmation copy and WhatsApp number continue to use the existing homepage settings and their existing fallbacks. The balance card reads the signed-in student's actual account balance.

Run `node scripts/check-balance.mjs` for selection, missing-method and clipboard-feedback checks. `--preview` also creates an isolated HTML fixture in the operating system temporary directory. These checks do not access a real clipboard, send WhatsApp messages or initiate transfers.
