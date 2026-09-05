import { useState } from "react";
import type { DriverProfile, SecureDriverDocumentRequest } from "@/api/driverApi";
import DocumentViewerModal from "@/components/DocumentViewerModal";
import { Button } from "@/components/ui/button";

export default function DriverDocumentPreview({ driver }: { driver: DriverProfile }) {
  const [request, setRequest] = useState<SecureDriverDocumentRequest | null>(null);
  const slots = [
    { slot: "license", label: "View licence", present: driver.licenseDoc || driver.documents?.license?.url },
  ] as const;
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {slots.filter(item => item.present).map(item => (
          <Button key={item.slot} type="button" variant="outline" size="sm"
            onClick={() => setRequest({ driverId: driver._id, slot: item.slot })}>
            {item.label}
          </Button>
        ))}
      </div>
      {!slots[0].present && <p className="text-xs text-amber-600">Upload the licence to complete the automated security checks.</p>}
      <DocumentViewerModal s3Key={null} driverDocumentRequest={request}
        title={`${driver.fullName} — ${request?.slot || "document"}`}
        open={Boolean(request)} onClose={() => setRequest(null)} />
    </div>
  );
}
