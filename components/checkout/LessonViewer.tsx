"use client";

import { CheckCircle2, Circle, Download, FileText } from "lucide-react";
import { useState, useTransition } from "react";
import { getLessonDownloadUrl, markLessonComplete } from "@/lib/actions/courseProgress";
import { toEmbedUrl } from "@/lib/videoEmbed";

export interface LessonViewerLesson {
  id: string;
  title: string;
  video_url: string | null;
  content: string | null;
  file_name: string | null;
}

export function LessonViewer({
  lesson,
  storeSlug,
  productId,
  completed,
}: {
  lesson: LessonViewerLesson;
  storeSlug: string;
  productId: string;
  completed: boolean;
}) {
  const [isDone, setIsDone] = useState(completed);
  const [isPending, startTransition] = useTransition();
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, startDownload] = useTransition();

  const embedUrl = lesson.video_url ? toEmbedUrl(lesson.video_url) : null;

  const handleComplete = () => {
    setIsDone(true);
    const formData = new FormData();
    formData.set("lessonId", lesson.id);
    formData.set("storeSlug", storeSlug);
    formData.set("productId", productId);
    startTransition(() => markLessonComplete(formData));
  };

  const handleDownload = () => {
    setDownloadError(null);
    startDownload(async () => {
      const result = await getLessonDownloadUrl(lesson.id);
      if (!result.url) {
        setDownloadError(result.error ?? "Téléchargement indisponible.");
        return;
      }
      window.location.href = result.url;
    });
  };

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{lesson.title}</h3>
        <button
          type="button"
          onClick={handleComplete}
          disabled={isDone || isPending}
          className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-emerald-600 disabled:text-emerald-600"
        >
          {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4 text-slate-300" />}
          {isDone ? "Terminé" : "Marquer comme terminé"}
        </button>
      </div>

      {lesson.video_url && (
        <div className="mt-3">
          {embedUrl ? (
            <div className="aspect-video overflow-hidden rounded-lg bg-slate-100">
              <iframe
                src={embedUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          ) : (
            <a
              href={lesson.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Voir la vidéo
            </a>
          )}
        </div>
      )}

      {lesson.content && (
        <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{lesson.content}</p>
      )}

      {lesson.file_name && (
        <div className="mt-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50"
          >
            {isDownloading ? <FileText className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
            {isDownloading ? "Préparation..." : `Télécharger ${lesson.file_name}`}
          </button>
          {downloadError && <p className="mt-1 text-xs text-red-600">{downloadError}</p>}
        </div>
      )}
    </div>
  );
}
