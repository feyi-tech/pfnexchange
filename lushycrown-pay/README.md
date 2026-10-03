# Lushycrown Pay

Static Next.js customer-payment site for `pay.lushycrown.com`, deployed on Cloudflare Pages.

- With a `u` parameter, it validates and immediately redirects to the URL-decoded Flutterwave hosted checkout link.
- Without `u`, it displays Lushycrown's direct Flutterwave payment form.

Run locally with `npm install && npm run dev`. Build with `npm run build`; the static deployment output is `out/`. Deploy with `npm run deploy`.
