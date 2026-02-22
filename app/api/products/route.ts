import { NextResponse } from "next/server";
import {
  DEFAULT_PRODUCTS,
  normalizeCategories,
  normalizeImagePath,
  normalizeLink,
  type Product,
} from "@/lib/home-products";
import { isTiDbConfigured, queryRows } from "@/lib/tidb";

type ProductRow = {
  name?: string | null;
  publisher?: string | null;
  image?: string | null;
  popularImage?: string | null;
  link?: string | null;
  slug?: string | null;
  category?: string | null;
  isPopular?: number | boolean | null;
};

function mapRowToProduct(row: ProductRow): Product {
  return {
    name: row.name?.trim() || "Product",
    publisher: row.publisher?.trim() || "Develop",
    image: normalizeImagePath(row.image),
    popularImage: row.popularImage ? normalizeImagePath(row.popularImage) : undefined,
    link: normalizeLink(row.link, row.slug),
    category: normalizeCategories(row.category),
    isPopular: Boolean(row.isPopular),
  };
}

export async function GET() {
  if (!isTiDbConfigured()) {
    return NextResponse.json({
      products: DEFAULT_PRODUCTS,
      source: "fallback",
      reason: "tidb_not_configured",
    });
  }

  try {
    const rows = await queryRows<ProductRow[]>(
      `
        SELECT
          name,
          publisher,
          image,
          popular_image AS popularImage,
          link,
          slug,
          category,
          is_popular AS isPopular
        FROM products
        WHERE (is_active = 1 OR is_active IS NULL)
        ORDER BY COALESCE(sort_order, 999999) ASC, id DESC
        LIMIT 100
      `,
    );

    const mappedProducts = rows.map(mapRowToProduct);
    const products = mappedProducts.length > 0 ? mappedProducts : DEFAULT_PRODUCTS;

    return NextResponse.json({
      products,
      source: mappedProducts.length > 0 ? "tidb" : "fallback",
    });
  } catch (error) {
    console.error("Failed loading products from TiDB Cloud.", error);
    return NextResponse.json({
      products: DEFAULT_PRODUCTS,
      source: "fallback",
      reason: "query_failed",
    });
  }
}
