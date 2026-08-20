import { PageHeader } from "@/components/ui/page-header";
import { TemplateLibrary } from "@/components/templates/template-library";

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Communications"
        title="Email templates"
        description="Broker-approved library. Open a template to revise copy, attach files, and save. Every send is still reviewed before it goes out."
      />

      <TemplateLibrary />
    </div>
  );
}
