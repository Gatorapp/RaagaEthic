# Raaga Ethnic Couture — Next.js Setup

## Requirements

- Node.js 22.5 or newer
- pnpm (`npm install -g pnpm` if it is not installed)

## Run the store

1. Open a terminal in this project folder.
2. Install the packages:

   ```text
   pnpm install
   ```

3. Start the development server:

   ```text
   pnpm dev
   ```

4. Open `http://localhost:3000`.

The included `data.db` already contains the 18-product catalog.

## Stripe payments

1. Copy `.env.example` to a new file named `.env.local`.
2. Add your Stripe secret key:

   ```text
   STRIPE_SECRET_KEY=sk_test_your_key_here
   ADMIN_PASSWORD=choose-a-private-admin-password
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

3. Restart the store after saving `.env.local`.

For Vercel, connect a Neon database from the Vercel Marketplace. Neon adds
`DATABASE_URL` automatically. The first database connection creates the tables
and imports the included 18-product inventory.

Use a Stripe test key beginning with `sk_test_` until you are ready for real
payments. Never add `.env.local` to source control or share your secret key.

## Admin panel

Open `http://localhost:3000/admin/login`.

The temporary default password is `raaga2026`. Set `ADMIN_PASSWORD` in
`.env.local` before publishing the store.

## Production

```text
pnpm build
pnpm start
```

The production store runs at `http://localhost:3000` by default.
