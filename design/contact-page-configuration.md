# Contact page configuration

The public `/contact` form saves messages in `ContactInquiry`. Administrators and assistant administrators can read them at `/dashboard/contact`. No email service is required, and submitting the form does not send an email. The table and index are created automatically on the first submission or inbox visit. For environments without schema creation permissions, apply `scripts/add-contact-inquiries.sql` first.

WhatsApp and social links come from the existing homepage settings. Optional server environment variables supply public business details:

- `CONTACT_EMAIL`: public contact email; otherwise the email card links to the inquiry form.
- `CONTACT_PHONE`: public contact number; otherwise the phone card links to the inquiry form.
- `CONTACT_ADDRESS`, `CONTACT_ADDRESS_AR`, `CONTACT_ADDRESS_EN`: address, with localized overrides.
- `CONTACT_HOURS`, `CONTACT_HOURS_AR`, `CONTACT_HOURS_EN`: business hours, with localized overrides.
- `CONTACT_MAP_URL`: HTTP(S) map link; otherwise the location card links to the form.

No business details are inferred from the reference image. Inquiries require a name, valid email, interest and message of 10–5,000 characters. Phone is optional. Server validation, a hidden bot field, a request size limit, same-origin validation and a database-backed one-message-per-minute limit per email protect the endpoint. The limit follows an email across server instances; it is not a substitute for infrastructure-level bot protection if needed at higher traffic.
