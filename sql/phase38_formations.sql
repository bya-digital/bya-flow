-- BYA Flow — Phase 38 : formations (modules, leçons, progression)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase37_produits_numeriques.sql.
--
-- Troisième type de produit après physique/numérique. Une vidéo n'est
-- jamais hébergée par BYA Flow (aucune infrastructure de streaming) :
-- video_url pointe vers une vidéo hébergée ailleurs par le marchand
-- (YouTube, Vimeo, Loom...), embarquée en iframe. Un fichier de leçon
-- (support de cours, PDF...) réutilise exactement le bucket privé
-- digital-products de la Phase 37 — même convention de chemin
-- (${storeId}/${productId}/...), donc les policies RLS déjà en place
-- couvrent aussi les fichiers de leçon sans rien ajouter côté storage.
--
-- Accès à l'espace formation : réservé aux clients connectés à leur
-- compte (jamais un panier invité anonyme — la progression n'aurait
-- aucun sens si l'identité ne survit pas à la fermeture du navigateur).

-- ============================================================
-- 1. Nouveau type de produit
-- ============================================================
alter table products drop constraint if exists products_product_type_check;
alter table products add constraint products_product_type_check
  check (product_type in ('physical', 'digital', 'course'));

-- ============================================================
-- 2. Modules et leçons
-- ============================================================
create table if not exists course_modules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references course_modules(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  video_url text,
  content text,
  file_path text,
  file_name text,
  created_at timestamptz not null default now()
);

create or replace function is_module_member(p_module_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from course_modules
    where course_modules.id = p_module_id
      and is_product_member(course_modules.product_id)
  );
$$;

create or replace function is_lesson_member(p_lesson_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from course_lessons
    join course_modules on course_modules.id = course_lessons.module_id
    where course_lessons.id = p_lesson_id
      and is_product_member(course_modules.product_id)
  );
$$;

-- Lecture du contenu par un client qui a payé — même fonction générique
-- que la Phase 37 pour les fichiers numériques (son nom vient de là,
-- mais son critère est déjà générique : "commande payée que je possède").
create or replace function is_paying_customer_of_module(p_module_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from course_modules
    where course_modules.id = p_module_id
      and customer_has_paid_digital_access(course_modules.product_id)
  );
$$;

create or replace function is_paying_customer_of_lesson(p_lesson_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from course_lessons
    join course_modules on course_modules.id = course_lessons.module_id
    where course_lessons.id = p_lesson_id
      and customer_has_paid_digital_access(course_modules.product_id)
  );
$$;

alter table course_modules enable row level security;
alter table course_lessons enable row level security;

create policy "course_modules_select_member" on course_modules
  for select using (is_product_member(product_id));
create policy "course_modules_insert_member" on course_modules
  for insert with check (is_product_member(product_id));
create policy "course_modules_update_member" on course_modules
  for update using (is_product_member(product_id));
create policy "course_modules_delete_member" on course_modules
  for delete using (is_product_member(product_id));
create policy "course_modules_select_purchaser" on course_modules
  for select using (is_paying_customer_of_module(id));

create policy "course_lessons_select_member" on course_lessons
  for select using (is_module_member(module_id));
create policy "course_lessons_insert_member" on course_lessons
  for insert with check (is_module_member(module_id));
create policy "course_lessons_update_member" on course_lessons
  for update using (is_module_member(module_id));
create policy "course_lessons_delete_member" on course_lessons
  for delete using (is_module_member(module_id));
create policy "course_lessons_select_purchaser" on course_lessons
  for select using (is_paying_customer_of_lesson(id));

-- ============================================================
-- 3. Progression — nécessite un vrai compte client (auth.email()),
--    jamais une session anonyme de panier invité.
-- ============================================================
create table if not exists course_progress (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references course_lessons(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (customer_id, lesson_id)
);

alter table course_progress enable row level security;

create or replace function is_own_customer_record(p_customer_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from customers
    where customers.id = p_customer_id and customers.email = auth.email()
  );
$$;

create policy "course_progress_select_own" on course_progress
  for select using (is_own_customer_record(customer_id));
create policy "course_progress_insert_own" on course_progress
  for insert with check (
    is_own_customer_record(customer_id) and is_paying_customer_of_lesson(lesson_id)
  );
create policy "course_progress_delete_own" on course_progress
  for delete using (is_own_customer_record(customer_id));
-- Visibilité marchand (suivi d'engagement, pas construit dans cette
-- phase mais la donnée est déjà accessible pour plus tard) :
create policy "course_progress_select_member" on course_progress
  for select using (
    exists (
      select 1 from course_lessons
      join course_modules on course_modules.id = course_lessons.module_id
      where course_lessons.id = course_progress.lesson_id
        and is_product_member(course_modules.product_id)
    )
  );

-- Marque une leçon terminée pour le client connecté — jamais un
-- customer_id fourni tel quel par le client (dérivé de auth.email() ici,
-- jamais du formulaire).
create or replace function mark_lesson_complete(p_lesson_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_authorized boolean;
begin
  if auth.email() is null then
    return false;
  end if;

  select exists (
    select 1 from course_lessons
    join course_modules on course_modules.id = course_lessons.module_id
    where course_lessons.id = p_lesson_id
      and customer_has_paid_digital_access(course_modules.product_id)
  ) into v_authorized;

  if not v_authorized then
    return false;
  end if;

  select c.id into v_customer_id
  from course_lessons cl
  join course_modules cm on cm.id = cl.module_id
  join products p on p.id = cm.product_id
  join stores s on s.id = p.store_id
  join customers c on c.organization_id = s.organization_id and c.email = auth.email()
  where cl.id = p_lesson_id;

  if v_customer_id is null then
    return false;
  end if;

  insert into course_progress (lesson_id, customer_id)
  values (p_lesson_id, v_customer_id)
  on conflict (customer_id, lesson_id) do nothing;

  return true;
end;
$$;

-- Support de leçon (PDF, slides...) pour un client qui a payé — même
-- principe que get_digital_file_for_download() en Phase 37, mais
-- scopée à une leçon plutôt qu'à une ligne de commande (l'accès à une
-- formation n'est jamais lié à un seul achat précis, contrairement à
-- un téléchargement unitaire).
create or replace function get_lesson_file_for_download(p_lesson_id uuid)
returns table (file_path text, file_name text)
language sql
security definer
set search_path = public
stable
as $$
  select cl.file_path, cl.file_name
  from course_lessons cl
  join course_modules cm on cm.id = cl.module_id
  where cl.id = p_lesson_id
    and customer_has_paid_digital_access(cm.product_id)
    and cl.file_path is not null;
$$;

-- ============================================================
-- 4. Nombre de leçons par produit — pour la garde à l'activation
--    (une formation sans leçon ne doit jamais être "Actif", même
--    principe que les produits numériques sans fichier en Phase 37).
-- ============================================================
create or replace function count_course_lessons(p_product_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from course_lessons cl
  join course_modules cm on cm.id = cl.module_id
  where cm.product_id = p_product_id and is_product_member(p_product_id);
$$;
