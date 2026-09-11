// Architecture en blocs réutilisables (directive Section 13) : une page
// est un tableau ordonné de blocs {id, type, props}, jamais une table
// par type de bloc — un nouveau type de bloc s'ajoute plus tard sans
// migration, juste une nouvelle entrée dans BLOCK_DEFS et un nouveau
// cas dans BlockRenderer.

export type BlockType =
  | "hero"
  | "heading"
  | "text"
  | "image"
  | "video"
  | "button"
  | "form"
  | "product"
  | "price"
  | "testimonial"
  | "faq"
  | "benefits"
  | "countdown"
  | "cta"
  | "footer";

export interface Block {
  id: string;
  type: BlockType;
  props: Record<string, string>;
}

export interface BlockFieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "datetime" | "product" | "list" | "faqlist";
  placeholder?: string;
}

export interface BlockDef {
  type: BlockType;
  label: string;
  fields: BlockFieldDef[];
  defaultProps: Record<string, string>;
}

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  hero: {
    type: "hero",
    label: "Hero",
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "subtitle", label: "Sous-titre", type: "textarea" },
      { key: "imageUrl", label: "Image de fond (URL)", type: "url" },
      { key: "ctaLabel", label: "Texte du bouton", type: "text" },
      { key: "ctaUrl", label: "Lien du bouton", type: "url" },
    ],
    defaultProps: { title: "Votre titre percutant", subtitle: "", imageUrl: "", ctaLabel: "", ctaUrl: "" },
  },
  heading: {
    type: "heading",
    label: "Titre de section",
    fields: [{ key: "text", label: "Texte", type: "text" }],
    defaultProps: { text: "Titre de section" },
  },
  text: {
    type: "text",
    label: "Texte",
    fields: [{ key: "content", label: "Contenu", type: "textarea" }],
    defaultProps: { content: "" },
  },
  image: {
    type: "image",
    label: "Image",
    fields: [
      { key: "url", label: "URL de l'image", type: "url" },
      { key: "alt", label: "Texte alternatif", type: "text" },
    ],
    defaultProps: { url: "", alt: "" },
  },
  video: {
    type: "video",
    label: "Vidéo",
    fields: [{ key: "videoUrl", label: "Lien vidéo (YouTube, Vimeo...)", type: "url" }],
    defaultProps: { videoUrl: "" },
  },
  button: {
    type: "button",
    label: "Bouton",
    fields: [
      { key: "label", label: "Texte du bouton", type: "text" },
      { key: "url", label: "Lien", type: "url" },
    ],
    defaultProps: { label: "En savoir plus", url: "" },
  },
  form: {
    type: "form",
    label: "Formulaire (capture email)",
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "submitLabel", label: "Texte du bouton", type: "text" },
    ],
    defaultProps: { title: "Restez informé", description: "", submitLabel: "S'inscrire" },
  },
  product: {
    type: "product",
    label: "Produit",
    fields: [{ key: "productId", label: "Produit", type: "product" }],
    defaultProps: { productId: "" },
  },
  price: {
    type: "price",
    label: "Bloc de prix",
    fields: [
      { key: "title", label: "Nom de l'offre", type: "text" },
      { key: "price", label: "Prix", type: "text" },
      { key: "features", label: "Avantages inclus (un par ligne)", type: "list" },
      { key: "ctaLabel", label: "Texte du bouton", type: "text" },
      { key: "ctaUrl", label: "Lien du bouton", type: "url" },
    ],
    defaultProps: { title: "Offre", price: "", features: "", ctaLabel: "Commander", ctaUrl: "" },
  },
  testimonial: {
    type: "testimonial",
    label: "Témoignage",
    fields: [
      { key: "quote", label: "Citation", type: "textarea" },
      { key: "authorName", label: "Nom de l'auteur", type: "text" },
    ],
    defaultProps: { quote: "", authorName: "" },
  },
  faq: {
    type: "faq",
    label: "FAQ",
    fields: [{ key: "items", label: "Questions/réponses (Question | Réponse, une paire par ligne)", type: "faqlist" }],
    defaultProps: { items: "" },
  },
  benefits: {
    type: "benefits",
    label: "Avantages",
    fields: [
      { key: "title", label: "Titre de section", type: "text" },
      { key: "items", label: "Avantages (un par ligne)", type: "list" },
    ],
    defaultProps: { title: "Pourquoi nous choisir", items: "" },
  },
  countdown: {
    type: "countdown",
    label: "Compte à rebours",
    fields: [
      { key: "label", label: "Texte au-dessus du compteur", type: "text" },
      { key: "targetDate", label: "Date/heure cible", type: "datetime" },
    ],
    defaultProps: { label: "Offre valable jusqu'à", targetDate: "" },
  },
  cta: {
    type: "cta",
    label: "Appel à l'action",
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "buttonLabel", label: "Texte du bouton", type: "text" },
      { key: "buttonUrl", label: "Lien du bouton", type: "url" },
    ],
    defaultProps: { title: "Prêt à commencer ?", buttonLabel: "Commander maintenant", buttonUrl: "" },
  },
  footer: {
    type: "footer",
    label: "Pied de page",
    fields: [{ key: "text", label: "Texte", type: "text" }],
    defaultProps: { text: "" },
  },
};

export const BLOCK_TYPES = Object.keys(BLOCK_DEFS) as BlockType[];
