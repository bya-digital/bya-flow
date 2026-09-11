"use client";

import { FileText, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  uploadLessonFile,
} from "@/lib/actions/courses";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

export interface CourseLesson {
  id: string;
  title: string;
  video_url: string | null;
  content: string | null;
  file_name: string | null;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

function LessonRow({
  productId,
  lesson,
}: {
  productId: string;
  lesson: CourseLesson;
}) {
  const uploadFormRef = useRef<HTMLFormElement>(null);

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">{lesson.title}</p>
          {lesson.video_url && (
            <p className="truncate text-xs text-slate-400">Vidéo : {lesson.video_url}</p>
          )}
          {lesson.file_name && (
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <FileText className="h-3 w-3" /> {lesson.file_name}
            </p>
          )}
        </div>
        <form action={deleteLesson}>
          <input type="hidden" name="lessonId" value={lesson.id} />
          <input type="hidden" name="productId" value={productId} />
          <button
            type="submit"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Supprimer la leçon"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {!lesson.file_name && (
        <form action={uploadLessonFile} ref={uploadFormRef} className="mt-2">
          <input type="hidden" name="lessonId" value={lesson.id} />
          <input type="hidden" name="productId" value={productId} />
          <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline">
            <Upload className="h-3 w-3" />
            Ajouter un support (PDF, slides...)
            <input
              type="file"
              name="file"
              className="hidden"
              onChange={() => uploadFormRef.current?.requestSubmit()}
            />
          </label>
        </form>
      )}
    </div>
  );
}

function NewLessonForm({ productId, moduleId }: { productId: string; moduleId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-brand-600 hover:underline"
      >
        + Ajouter une leçon
      </button>
    );
  }

  return (
    <form action={createLesson} className="space-y-2 rounded-lg border border-dashed border-slate-300 p-3">
      <input type="hidden" name="moduleId" value={moduleId} />
      <input type="hidden" name="productId" value={productId} />
      <input
        name="title"
        placeholder="Titre de la leçon"
        required
        className={inputClasses}
        autoFocus
      />
      <input name="videoUrl" placeholder="Lien vidéo (YouTube, Vimeo...) — optionnel" className={inputClasses} />
      <textarea
        name="content"
        placeholder="Notes / contenu texte — optionnel"
        rows={2}
        className={inputClasses}
      />
      <div className="flex gap-2">
        <Button type="submit">Ajouter</Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-500 hover:underline"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function NewModuleForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        + Ajouter un module
      </button>
    );
  }

  return (
    <form action={createModule} className="flex items-end gap-2">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex-1">
        <input name="title" placeholder="Titre du module" required className={inputClasses} autoFocus />
      </div>
      <Button type="submit">Ajouter</Button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-slate-500 hover:underline"
      >
        Annuler
      </button>
    </form>
  );
}

export function CourseBuilder({
  productId,
  modules,
}: {
  productId: string;
  modules: CourseModule[];
}) {
  return (
    <div className="space-y-4">
      {modules.length === 0 && (
        <p className="text-sm text-slate-400">
          Aucun module — cette formation n&apos;est pas encore vendable.
        </p>
      )}

      {modules.map((mod) => (
        <div key={mod.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">{mod.title}</h3>
            <form action={deleteModule}>
              <input type="hidden" name="moduleId" value={mod.id} />
              <input type="hidden" name="productId" value={productId} />
              <button
                type="submit"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Supprimer le module"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          <div className="mt-3 space-y-2">
            {mod.lessons.map((lesson) => (
              <LessonRow key={lesson.id} productId={productId} lesson={lesson} />
            ))}
          </div>

          <div className="mt-3">
            <NewLessonForm productId={productId} moduleId={mod.id} />
          </div>
        </div>
      ))}

      <NewModuleForm productId={productId} />
    </div>
  );
}
