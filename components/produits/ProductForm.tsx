"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CategoryQuickCreate } from "@/components/produits/CategoryQuickCreate";
import { slugify } from "@/lib/utils";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export interface ProductFormValues {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock: number;
  weight: number | null;
  status: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  action: (formData: FormData) => void;
  product?: ProductFormValues;
  categories: Category[];
}

export function ProductForm({ action, product, categories }: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));

  return (
    <form action={action} className="space-y-6">
      {product?.id && <input type="hidden" name="productId" value={product.id} />}

      <div>
        <label htmlFor="name" className={labelClasses}>
          Nom du produit
        </label>
        <input
          id="name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="slug" className={labelClasses}>
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClasses}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ""}
          rows={4}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className={labelClasses}>
            Prix
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price ?? 0}
            required
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="compareAtPrice" className={labelClasses}>
            Prix de comparaison
          </label>
          <input
            id="compareAtPrice"
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.compare_at_price ?? ""}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="sku" className={labelClasses}>
            SKU
          </label>
          <input id="sku" name="sku" defaultValue={product?.sku ?? ""} className={inputClasses} />
        </div>
        <div>
          <label htmlFor="stock" className={labelClasses}>
            Stock
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            defaultValue={product?.stock ?? 0}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="weight" className={labelClasses}>
            Poids (kg)
          </label>
          <input
            id="weight"
            name="weight"
            type="number"
            step="0.001"
            min="0"
            defaultValue={product?.weight ?? ""}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className={labelClasses}>
            Statut
          </label>
          <select
            id="status"
            name="status"
            defaultValue={product?.status ?? "draft"}
            className={inputClasses}
          >
            <option value="draft">Brouillon</option>
            <option value="active">Actif</option>
            <option value="archived">Archivé</option>
          </select>
        </div>
        <div>
          <label htmlFor="categoryId" className={labelClasses}>
            Catégorie
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={product?.category_id ?? ""}
            className={inputClasses}
          >
            <option value="">Aucune</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <CategoryQuickCreate
            redirectTo={product?.id ? `/produits/${product.id}` : "/produits/nouveau"}
          />
        </div>
      </div>

      <Button type="submit">{product?.id ? "Enregistrer" : "Créer le produit"}</Button>
    </form>
  );
}
