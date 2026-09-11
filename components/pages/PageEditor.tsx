"use client";

import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { savePageBlocks } from "@/lib/actions/pages";
import { BLOCK_DEFS, BLOCK_TYPES, type Block, type BlockType } from "@/lib/pageBuilder/types";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

function newBlockId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `b${Date.now()}${Math.random()}`;
}

function BlockFieldInput({
  fieldType,
  value,
  onChange,
  products,
}: {
  fieldType: string;
  value: string;
  onChange: (value: string) => void;
  products: { id: string; name: string }[];
}) {
  if (fieldType === "textarea" || fieldType === "list" || fieldType === "faqlist") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={fieldType === "textarea" ? 3 : 4}
        className={inputClasses}
      />
    );
  }
  if (fieldType === "product") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClasses}>
        <option value="">Choisir un produit</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
    );
  }
  if (fieldType === "datetime") {
    return (
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClasses}
      />
    );
  }
  return (
    <input
      type={fieldType === "url" ? "url" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClasses}
    />
  );
}

function BlockCard({
  block,
  index,
  total,
  products,
  onUpdate,
  onRemove,
  onDuplicate,
  onMove,
}: {
  block: Block;
  index: number;
  total: number;
  products: { id: string; name: string }[];
  onUpdate: (id: string, key: string, value: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  const def = BLOCK_DEFS[block.type];

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{def.label}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(block.id, "up")}
            disabled={index === 0}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Monter"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(block.id, "down")}
            disabled={index === total - 1}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Descendre"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(block.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Dupliquer"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(block.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {def.fields.map((field) => (
          <div key={field.key}>
            <label className="text-xs font-medium text-slate-500">{field.label}</label>
            <BlockFieldInput
              fieldType={field.type}
              value={block.props[field.key] ?? ""}
              onChange={(value) => onUpdate(block.id, field.key, value)}
              products={products}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageEditor({
  pageId,
  initialBlocks,
  products,
}: {
  pageId: string;
  initialBlocks: Block[];
  products: { id: string; name: string }[];
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [dirty, setDirty] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const addBlock = (type: BlockType) => {
    const def = BLOCK_DEFS[type];
    setBlocks((prev) => [...prev, { id: newBlockId(), type, props: { ...def.defaultProps } }]);
    setDirty(true);
    setShowPicker(false);
  };

  const updateBlock = (id: string, key: string, value: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, props: { ...b.props, [key]: value } } : b))
    );
    setDirty(true);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setDirty(true);
  };

  const duplicateBlock = (id: string) => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      if (index === -1) return prev;
      const copy = { ...prev[index], id: newBlockId() };
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
    setDirty(true);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
    setDirty(true);
  };

  const handleSave = () => {
    setSaveError(null);
    startSaving(async () => {
      try {
        await savePageBlocks(pageId, blocks);
        setDirty(false);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {dirty ? "Modifications non enregistrées" : "Tout est enregistré"}
        </p>
        <Button onClick={handleSave} disabled={isSaving || !dirty}>
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
      {saveError && <p className="text-sm text-red-600">{saveError}</p>}

      {blocks.map((block, index) => (
        <BlockCard
          key={block.id}
          block={block}
          index={index}
          total={blocks.length}
          products={products}
          onUpdate={updateBlock}
          onRemove={removeBlock}
          onDuplicate={duplicateBlock}
          onMove={moveBlock}
        />
      ))}

      <div className="rounded-xl border border-dashed border-slate-300 p-4">
        {showPicker ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BLOCK_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:border-brand-400 hover:bg-brand-50"
              >
                {BLOCK_DEFS[type].label}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            + Ajouter un bloc
          </button>
        )}
      </div>
    </div>
  );
}
