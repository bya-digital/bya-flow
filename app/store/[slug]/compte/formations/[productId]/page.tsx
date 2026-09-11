import Link from "next/link";
import { redirect } from "next/navigation";
import { LessonViewer } from "@/components/checkout/LessonViewer";
import { Alert } from "@/components/ui/Alert";
import { getCustomerSession } from "@/lib/data/customerAccount";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";
import { createClient } from "@/lib/supabase/server";

interface LessonRow {
  id: string;
  title: string;
  video_url: string | null;
  content: string | null;
  file_name: string | null;
}

interface ModuleRow {
  id: string;
  title: string;
  course_lessons: LessonRow[];
}

export default async function CourseAccessPage({
  params,
}: {
  params: { slug: string; productId: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const session = await getCustomerSession();
  const pageUrl = `/store/${store.slug}/compte/formations/${params.productId}`;
  if (!session.isLoggedIn) {
    redirect(`/store/${store.slug}/compte/connexion?redirect=${encodeURIComponent(pageUrl)}`);
  }

  const supabase = createClient();

  const [{ data: product }, { data: purchasedRows }] = await Promise.all([
    supabase.from("products").select("id, name, description").eq("id", params.productId).maybeSingle(),
    supabase
      .from("order_items")
      .select("id, orders!inner(payment_status)")
      .eq("product_id", params.productId)
      .eq("orders.payment_status", "paid")
      .limit(1),
  ]);

  const hasPurchased = (purchasedRows?.length ?? 0) > 0;

  if (!hasPurchased) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <Alert
          tone="warning"
          title="Accès non disponible"
          description="Vous n'avez pas (encore) acheté cette formation, ou son paiement n'est pas confirmé."
        />
        <Link
          href={`/store/${store.slug}`}
          className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
        >
          Retourner à la boutique
        </Link>
      </div>
    );
  }

  const { data: modulesData } = await supabase
    .from("course_modules")
    .select("id, title, course_lessons(id, title, video_url, content, file_name)")
    .eq("product_id", params.productId)
    .order("position", { ascending: true })
    .order("position", { ascending: true, foreignTable: "course_lessons" });

  const modules = (modulesData ?? []) as unknown as ModuleRow[];
  const lessonIds = modules.flatMap((mod) => mod.course_lessons.map((lesson) => lesson.id));

  const { data: progressRows } =
    lessonIds.length > 0
      ? await supabase.from("course_progress").select("lesson_id").in("lesson_id", lessonIds)
      : { data: [] as { lesson_id: string }[] };

  const completedLessonIds = new Set((progressRows ?? []).map((row) => row.lesson_id));
  const totalLessons = lessonIds.length;
  const completedCount = lessonIds.filter((id) => completedLessonIds.has(id)).length;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href={`/store/${store.slug}/compte`}
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        ← Mon compte
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-slate-900">{product?.name ?? "Formation"}</h1>
      {product?.description && (
        <p className="mt-2 text-sm text-slate-500">{product.description}</p>
      )}

      {totalLessons > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Progression</span>
            <span>
              {completedCount} / {totalLessons} leçons
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-8 space-y-6">
        {modules.length === 0 && (
          <p className="text-sm text-slate-400">Cette formation n&apos;a pas encore de contenu.</p>
        )}
        {modules.map((mod) => (
          <div key={mod.id}>
            <h2 className="text-sm font-semibold text-slate-900">{mod.title}</h2>
            <div className="mt-3 space-y-3">
              {mod.course_lessons.map((lesson) => (
                <LessonViewer
                  key={lesson.id}
                  lesson={lesson}
                  storeSlug={store.slug}
                  productId={params.productId}
                  completed={completedLessonIds.has(lesson.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
