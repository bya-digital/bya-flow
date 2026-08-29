"use client";

import { Sparkles } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { generateCampaignContent } from "@/lib/actions/ai";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export interface CampaignFormValues {
  id?: string;
  name: string;
  subject: string | null;
  content: string | null;
  channel: string;
  audience_tags: string[];
  audience_status: string | null;
  scheduled_at: string | null;
}

export function CampaignForm({
  action,
  campaign,
}: {
  action: (formData: FormData) => void;
  campaign?: CampaignFormValues;
}) {
  const [subject, setSubject] = useState(campaign?.subject ?? "");
  const [content, setContent] = useState(campaign?.content ?? "");
  const [isGenerating, startGenerating] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<HTMLSelectElement>(null);

  const handleGenerate = () => {
    const name = nameRef.current?.value ?? "";
    const channel = channelRef.current?.value ?? "email";
    if (!name.trim()) return;

    startGenerating(async () => {
      const generated = await generateCampaignContent({ name, channel });
      setSubject(generated.subject);
      setContent(generated.content);
    });
  };

  return (
    <form action={action} className="space-y-5">
      {campaign?.id && <input type="hidden" name="campaignId" value={campaign.id} />}

      <div>
        <label htmlFor="name" className={labelClasses}>
          Nom de la campagne
        </label>
        <input
          id="name"
          name="name"
          ref={nameRef}
          defaultValue={campaign?.name ?? ""}
          required
          className={inputClasses}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="channel" className={labelClasses}>
            Canal
          </label>
          <select
            id="channel"
            name="channel"
            ref={channelRef}
            defaultValue={campaign?.channel ?? "email"}
            className={inputClasses}
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
        <div>
          <label htmlFor="scheduledAt" className={labelClasses}>
            Date d&apos;envoi programmée
          </label>
          <input
            id="scheduledAt"
            name="scheduledAt"
            type="datetime-local"
            defaultValue={campaign?.scheduled_at?.slice(0, 16) ?? ""}
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="subject" className={labelClasses}>
            Objet / titre du message
          </label>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline disabled:opacity-50"
          >
            <Sparkles className="h-3 w-3" />
            {isGenerating ? "Génération..." : "Générer avec l'IA"}
          </button>
        </div>
        <input
          id="subject"
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="content" className={labelClasses}>
          Contenu
        </label>
        <textarea
          id="content"
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className={inputClasses}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className={labelClasses}>Audience ciblée</p>
        <p className="mt-1 text-xs text-slate-500">
          Ciblez par tags, ou par statut, ou laissez vide pour toucher tous vos contacts.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="audienceTags" className="text-xs font-medium text-slate-600">
              Tags (séparés par des virgules)
            </label>
            <input
              id="audienceTags"
              name="audienceTags"
              defaultValue={campaign?.audience_tags.join(", ") ?? ""}
              placeholder="vip, newsletter"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="audienceStatus" className="text-xs font-medium text-slate-600">
              Statut
            </label>
            <select
              id="audienceStatus"
              name="audienceStatus"
              defaultValue={campaign?.audience_status ?? ""}
              className={inputClasses}
            >
              <option value="">Tous</option>
              <option value="prospect">Prospects</option>
              <option value="client">Clients</option>
            </select>
          </div>
        </div>
      </div>

      <Button type="submit">{campaign?.id ? "Enregistrer" : "Créer la campagne"}</Button>
    </form>
  );
}
