import { PageHeader } from "@/components/ui/page-header";
import { TemplateLibrary } from "@/components/templates/template-library";

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Communications"
        title="Email templates"
        description="Broker-approved library. Click any template to preview subject and body. Every send is logged; anything off-template needs your review first."
      />

      <TemplateLibrary />
    </div>
  );
}
