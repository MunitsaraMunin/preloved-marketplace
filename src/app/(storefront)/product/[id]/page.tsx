import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import { getProductById, getRelatedProducts } from "@/lib/data/products";
import { CONDITION_LABELS, SITE_NAME } from "@/lib/constants";

const getProduct = cache(getProductById);

export async function generateMetadata(
  props: PageProps<"/product/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const product = await getProduct(id);
  if (!product) return { title: "Product not found" };

  const title = `${product.name}${product.brand ? ` — ${product.brand}` : ""}`;
  const description =
    product.description.slice(0, 155) ||
    `${product.name}, size ${product.size}, ${CONDITION_LABELS[product.condition]} condition.`;
  const image = product.images[0]?.image_url;

  return {
    title,
    description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      title: `${title} — ${SITE_NAME}`,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<"/product/[id]">) {
  const { id } = await props.params;
  const product = await getProduct(id);
  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((image) => image.image_url),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "THB",
      price: product.price,
      availability:
        product.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail initialProduct={product} relatedProducts={relatedProducts} />
    </>
  );
}
