// src/lib/seo/jsonld.js — générateurs JSON-LD réutilisables (guides).
const ORG = { "@type": "Organization", name: "Amaryllis Locations", url: "https://villamaryllis.com" };

export function articleLd({ headline, description, url, image, datePublished, dateModified }) {
  return { "@context": "https://schema.org", "@type": "Article",
    headline, description, image: image ? [image] : undefined,
    author: ORG, publisher: ORG, mainEntityOfPage: url,
    datePublished, dateModified: dateModified || datePublished };
}
export function faqLd(items) {
  return { "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q,
      acceptedAnswer: { "@type": "Answer", text: a } })) };
}
export function breadcrumbLd(crumbs) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem",
      position: i + 1, name: c.name, item: c.url })) };
}
