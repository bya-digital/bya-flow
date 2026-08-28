import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <p className="mb-6 text-center text-xl font-bold text-brand-600">BYA Flow</p>
        <OnboardingWizard error={searchParams.error} />
      </div>
    </main>
  );
}
