"use client";

import { Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { deleteProductImage, uploadProductImage } from "@/lib/actions/products";

interface ProductImage {
  id: string;
  url: string;
}

export function ProductImages({
  productId,
  storeId,
  images,
}: {
  productId: string;
  storeId: string;
  images: ProductImage[];
}) {
  const uploadFormRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
              <form action={deleteProductImage}>
                <input type="hidden" name="imageId" value={image.id} />
                <input type="hidden" name="productId" value={productId} />
                <input type="hidden" name="imageUrl" value={image.url} />
                <button
                  type="submit"
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-500 opacity-0 shadow transition-opacity hover:text-red-600 group-hover:opacity-100"
                  aria-label="Supprimer l'image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <form action={uploadProductImage} ref={uploadFormRef} className="flex items-center gap-3">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="storeId" value={storeId} />
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600">
          <Upload className="h-4 w-4" />
          Ajouter une image
          <input
            type="file"
            name="image"
            accept="image/*"
            className="hidden"
            onChange={() => uploadFormRef.current?.requestSubmit()}
          />
        </label>
      </form>
    </div>
  );
}
