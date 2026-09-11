// Convertit un lien YouTube/Vimeo "normal" en URL embarquable (iframe).
// Aucune vidéo n'est jamais hébergée par BYA Flow — uniquement un lien
// vers une vidéo hébergée ailleurs par le marchand. Un lien non reconnu
// reste utilisable via un simple lien externe (jamais d'iframe risquée
// sur un domaine arbitraire).
export function toEmbedUrl(videoUrl: string): string | null {
  try {
    const url = new URL(videoUrl);

    if (url.hostname.includes("youtube.com") && url.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${url.searchParams.get("v")}`;
    }
    if (url.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${url.pathname}`;
    }
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}
