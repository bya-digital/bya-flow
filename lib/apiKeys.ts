import { createHash, randomBytes } from "crypto";

const KEY_PREFIX = "bya_live_";

export interface GeneratedApiKey {
  fullKey: string;
  prefix: string;
  hash: string;
}

// La clé en clair n'est jamais stockée : seul son hash (comparable à
// chaque appel API) l'est. Elle ne peut donc être affichée qu'une seule
// fois, au moment de sa création.
export function generateApiKey(): GeneratedApiKey {
  const raw = randomBytes(24).toString("base64url");
  const fullKey = `${KEY_PREFIX}${raw}`;
  return { fullKey, prefix: fullKey.slice(0, 14), hash: hashApiKey(fullKey) };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
