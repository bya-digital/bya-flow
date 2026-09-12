import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStore, type CurrentStore } from "./store";

const mockCookies = vi.mocked(cookies);
const mockCreateClient = vi.mocked(createClient);

function makeStore(overrides: Partial<CurrentStore> & { id: string; organization_id: string }): CurrentStore {
  return {
    name: "Boutique",
    description: null,
    logo_url: null,
    slug: "boutique",
    currency: "XOF",
    country: null,
    is_active: true,
    hero_title: null,
    hero_subtitle: null,
    hero_image_url: null,
    hero_cta_label: null,
    accent_color: null,
    social_facebook: null,
    social_instagram: null,
    social_tiktok: null,
    social_whatsapp: null,
    footer_text: null,
    loyalty_enabled: false,
    loyalty_earn_rate: 0,
    loyalty_redeem_value: 0,
    referral_enabled: false,
    referral_bonus_points: 0,
    referral_welcome_points: 0,
    custom_domain: null,
    custom_domain_verified_at: null,
    meta_pixel_id: null,
    ga4_measurement_id: null,
    gtm_container_id: null,
    ...overrides,
  };
}

/**
 * Builds a chainable Supabase query mock. `stores` is queried twice in
 * getCurrentStore() with different .eq() chains (cookie-selected store vs.
 * first-created fallback) — the presence of an `.eq("id", ...)` call on a
 * given builder instance is what distinguishes the two, exactly like the
 * real PostgREST query shape does.
 */
function createSupabaseMock(options: {
  user: { id: string } | null;
  membership: { organization_id: string } | null;
  selectedStore?: CurrentStore | null;
  fallbackStore?: CurrentStore | null;
}) {
  const from = vi.fn((table: string) => {
    const eqCalls: unknown[][] = [];
    const builder: any = {
      select: vi.fn(() => builder),
      eq: vi.fn((...args: unknown[]) => {
        eqCalls.push(args);
        return builder;
      }),
      limit: vi.fn(() => builder),
      order: vi.fn(() => builder),
      maybeSingle: vi.fn(async () => {
        if (table === "organization_members") {
          return { data: options.membership };
        }
        if (table === "stores") {
          const filteredById = eqCalls.some(([column]) => column === "id");
          return { data: filteredById ? options.selectedStore ?? null : options.fallbackStore ?? null };
        }
        return { data: null };
      }),
    };
    return builder;
  });

  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: options.user } })) },
    from,
  };
}

function setCookie(value: string | undefined) {
  mockCookies.mockReturnValue({
    get: vi.fn((name: string) => (name === "bya_current_store" && value !== undefined ? { value } : undefined)),
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  setCookie(undefined);
});

describe("getCurrentStore", () => {
  it("returns null when there is no authenticated user", async () => {
    mockCreateClient.mockReturnValue(
      createSupabaseMock({ user: null, membership: null }) as any
    );

    const result = await getCurrentStore();

    expect(result).toBeNull();
  });

  it("returns null when the user belongs to no organization", async () => {
    mockCreateClient.mockReturnValue(
      createSupabaseMock({ user: { id: "user-1" }, membership: null }) as any
    );

    const result = await getCurrentStore();

    expect(result).toBeNull();
  });

  it("falls back to the first-created store when no store cookie is set", async () => {
    const fallbackStore = makeStore({ id: "store-1", organization_id: "org-1" });
    mockCreateClient.mockReturnValue(
      createSupabaseMock({
        user: { id: "user-1" },
        membership: { organization_id: "org-1" },
        fallbackStore,
      }) as any
    );

    const result = await getCurrentStore();

    expect(result).toEqual(fallbackStore);
  });

  it("returns the cookie-selected store when it belongs to the user's organization", async () => {
    const selectedStore = makeStore({ id: "store-2", organization_id: "org-1" });
    setCookie("store-2");
    mockCreateClient.mockReturnValue(
      createSupabaseMock({
        user: { id: "user-1" },
        membership: { organization_id: "org-1" },
        selectedStore,
      }) as any
    );

    const result = await getCurrentStore();

    expect(result).toEqual(selectedStore);
  });

  it("ignores a store cookie pointing at another organization's store and falls back instead", async () => {
    // The security-relevant case: a forged/stale cookie naming a store id
    // that belongs to a different organization must never be trusted. The
    // .eq("organization_id", membership.organization_id) filter in the real
    // query is what makes this fail server-side regardless of cookie value —
    // here that's modeled by simply never configuring a `selectedStore`, so
    // the mock's "stores" lookup filtered by id resolves to null.
    const fallbackStore = makeStore({ id: "store-1", organization_id: "org-1" });
    setCookie("store-belonging-to-another-org");
    mockCreateClient.mockReturnValue(
      createSupabaseMock({
        user: { id: "user-1" },
        membership: { organization_id: "org-1" },
        selectedStore: null,
        fallbackStore,
      }) as any
    );

    const result = await getCurrentStore();

    expect(result).toEqual(fallbackStore);
  });

  it("returns null when the organization has no store at all", async () => {
    mockCreateClient.mockReturnValue(
      createSupabaseMock({
        user: { id: "user-1" },
        membership: { organization_id: "org-1" },
        fallbackStore: null,
      }) as any
    );

    const result = await getCurrentStore();

    expect(result).toBeNull();
  });
});
