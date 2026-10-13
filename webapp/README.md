This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Passkey domain association (`public/.well-known/`)

redbtn.io is the WebAuthn relying party id (rpID) for every redbtn app, so one
passkey works across all of them. A native app can only use those passkeys if
redbtn.io vouches for it:

- `apple-app-site-association`: add the app's `<TeamID>.<bundle id>` to
  `webcredentials.apps`, and add `webcredentials:redbtn.io` to the app's
  associated domains. Keep `applinks` off this domain (universal links belong
  on the app's own subdomain).
- `assetlinks.json`: add one `delegate_permission/common.get_login_creds`
  statement per Android package, listing the SHA-256 of every certificate that
  signs a build you ship (test key and Play App Signing key). The app's server
  must accept the matching `android:apk-key-hash:<base64url(sha256)>` origin.

Both are served as `application/json` (see `next.config.ts`). After a deploy,
check `https://app-site-association.cdn-apple.com/a/v1/redbtn.io` and
`https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://redbtn.io&relation=delegate_permission/common.get_login_creds`.

Current entries: Become (`io.redbtn.become`, Team Y7X4278T48). Its Android
fingerprint `FA:C6:17:...` is the public React Native debug key used for test
builds; replace it with the Play App Signing key before a public release.
