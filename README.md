# TopZyn Next.js

TopZyn storefront built with Next.js App Router + Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Key files

- `app/page.tsx`: Home UI, banner, flash sale, and product cards
- `app/produk/mobile-legends/page.tsx`: MLBB product page
- `app/produk/free-fire/page.tsx`: Free Fire product page
- `app/api/mlbb/catalog/route.ts`: MLBB catalog API
- `app/api/ff/catalog/route.ts`: Free Fire catalog API
- `lib/tidb.ts`: MySQL/TiDB connection pool
