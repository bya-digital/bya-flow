// Envoie chaque événement e-commerce standard aux trois plateformes en
// parallèle (GTM dataLayer, Meta Pixel, GA4) — chacune n'agit que si
// son script correspondant a réellement été chargé par
// <TrackingScripts> (donc seulement si la boutique a configuré cet
// ID), jamais un faux événement envoyé à une plateforme non connectée.
declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export interface TrackItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

function pushDataLayer(event: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push({ event, ...payload });
}

function fbTrack(event: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, payload);
}

function gaEvent(event: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, payload);
}

export function trackViewContent(item: TrackItem, currency: string) {
  pushDataLayer("view_item", { ecommerce: { currency, value: item.price, items: [item] } });
  fbTrack("ViewContent", {
    content_ids: [item.id],
    content_name: item.name,
    value: item.price,
    currency,
  });
  gaEvent("view_item", {
    currency,
    value: item.price,
    items: [{ item_id: item.id, item_name: item.name, price: item.price }],
  });
}

export function trackAddToCart(item: TrackItem, currency: string) {
  const quantity = item.quantity ?? 1;
  const value = item.price * quantity;
  pushDataLayer("add_to_cart", { ecommerce: { currency, value, items: [item] } });
  fbTrack("AddToCart", {
    content_ids: [item.id],
    content_name: item.name,
    value,
    currency,
  });
  gaEvent("add_to_cart", {
    currency,
    value,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity }],
  });
}

export function trackInitiateCheckout(items: TrackItem[], value: number, currency: string) {
  pushDataLayer("begin_checkout", { ecommerce: { currency, value, items } });
  fbTrack("InitiateCheckout", {
    content_ids: items.map((i) => i.id),
    value,
    currency,
    num_items: items.length,
  });
  gaEvent("begin_checkout", {
    currency,
    value,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price })),
  });
}

export function trackPurchase(
  orderId: string,
  items: TrackItem[],
  value: number,
  currency: string
) {
  pushDataLayer("purchase", { ecommerce: { transaction_id: orderId, currency, value, items } });
  fbTrack("Purchase", {
    content_ids: items.map((i) => i.id),
    value,
    currency,
  });
  gaEvent("purchase", {
    transaction_id: orderId,
    currency,
    value,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price })),
  });
}
