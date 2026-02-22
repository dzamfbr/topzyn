# TopZyn Next.js

TopZyn home page built with Next.js App Router + Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## TiDB Cloud setup

1. Create a TiDB Cloud cluster and create a database (example: `topzyn`).
2. Create a SQL user and whitelist your IP in TiDB Cloud.
3. Copy `.env.example` to `.env.local` and fill your TiDB credentials.
4. Run SQL in `database/schema.sql` to create the `products` table and seed data.
5. Restart `npm run dev`.

The home page reads products from `GET /api/products`.
If TiDB is not configured, the app automatically uses local fallback products.

## Key files

- `app/page.tsx`: Home UI and product rendering
- `app/api/products/route.ts`: Product API route
- `lib/tidb.ts`: TiDB MySQL connection pool
- `lib/home-products.ts`: shared product types + fallback products
- `database/schema.sql`: base schema + sample seed
