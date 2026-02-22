export type ProductCategory = "topup" | "ml" | "ff";

export type Product = {
  name: string;
  publisher: string;
  image: string;
  popularImage?: string;
  link: string;
  category: ProductCategory[];
  isPopular?: boolean;
};

export const DEFAULT_PRODUCTS: Product[] = [
  {
    name: "Mobile Legends",
    publisher: "Moonton",
    image: "/images/product_mobile_legends_top_up_raypoint.png",
    popularImage:
      "/images/product_horizontal_mobile_legends_top_up_raypoint.png",
    link: "/produk/mobile-legends",
    category: ["topup", "ml"],
    isPopular: true,
  },
  {
    name: "Free Fire",
    publisher: "Garena",
    image: "/images/product_free_fire_top_up_raypoint.png",
    popularImage: "/images/product_horizontal_free_fire_top_up_raypoint.png",
    link: "/produk/free-fire",
    category: ["topup", "ff"],
    isPopular: true,
  },
  {
    name: "Magic Chess",
    publisher: "Moonton",
    image: "/images/product_magic_chess_top_up_raypoint.png",
    popularImage: "/images/1780x1000.jpg",
    link: "/produk/magic-chess",
    category: ["topup", "ml"],
    isPopular: true,
  },
  {
    name: "Free Fire MAX",
    publisher: "Garena",
    image: "/images/product_free_fire_max_top_up_raypoint.png",
    popularImage: "/images/1780x1000.jpg",
    link: "/produk/free-fire-max",
    category: ["topup", "ff"],
    isPopular: true,
  },
  {
    name: "Product",
    publisher: "Develop",
    image: "/images/1000x1000.jpg",
    link: "#",
    category: ["topup"],
    isPopular: false,
  },
  {
    name: "Product",
    publisher: "Develop",
    image: "/images/1000x1000.jpg",
    link: "#",
    category: ["topup"],
    isPopular: false,
  },
  {
    name: "Product",
    publisher: "Develop",
    image: "/images/1000x1000.jpg",
    link: "#",
    category: ["topup"],
    isPopular: false,
  },
  {
    name: "Product",
    publisher: "Develop",
    image: "/images/1000x1000.jpg",
    link: "#",
    category: ["topup"],
    isPopular: false,
  },
  {
    name: "Product",
    publisher: "Develop",
    image: "/images/1000x1000.jpg",
    link: "#",
    category: ["topup"],
    isPopular: false,
  },
  {
    name: "Product",
    publisher: "Develop",
    image: "/images/1000x1000.jpg",
    link: "#",
    category: ["topup"],
    isPopular: false,
  },
];

export function normalizeCategories(value: unknown): ProductCategory[] {
  const splitCategory = (text: string): string[] =>
    text
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);

  let categories: string[] = [];

  if (Array.isArray(value)) {
    categories = value
      .map((part) => String(part).trim().toLowerCase())
      .filter(Boolean);
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          categories = parsed
            .map((part) => String(part).trim().toLowerCase())
            .filter(Boolean);
        } else {
          categories = splitCategory(trimmed);
        }
      } catch {
        categories = splitCategory(trimmed);
      }
    } else {
      categories = splitCategory(trimmed);
    }
  }

  if (categories.length === 0) {
    categories = ["topup"];
  }

  if (!categories.includes("topup")) {
    categories.unshift("topup");
  }

  const valid = new Set<ProductCategory>(["topup", "ml", "ff"]);
  const cleaned = Array.from(new Set(categories)).filter((category) =>
    valid.has(category as ProductCategory),
  ) as ProductCategory[];

  if (cleaned.length === 0) {
    return ["topup"];
  }

  return cleaned;
}

export function normalizeImagePath(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    return "/images/1000x1000.jpg";
  }

  const image = value.trim();
  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("/")
  ) {
    return image;
  }

  return `/images/${image}`;
}

export function normalizeLink(link: unknown, slug: unknown): string {
  if (typeof link === "string" && link.trim() !== "") {
    return link.trim();
  }

  if (typeof slug === "string" && slug.trim() !== "") {
    return `/produk/${slug.trim()}`;
  }

  return "#";
}
