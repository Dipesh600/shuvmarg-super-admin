import {
  adoptSeatLayoutForOperator,
  assignInitialFleetSeatLayout,
  createInitialFleetSeatLayout,
  listSeatLayoutTemplates,
} from "@/api/seatLayoutV3Api";
import type { AdminFleetLayoutChoice } from "./types";

function adoptionCode(ownerId: string, templateId: string) {
  const compact = (value: string) => value.replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase();
  return `OP-${compact(ownerId)}-${compact(templateId)}`;
}

async function findPublishedAdoption(ownerId: string, sourceTemplateId: string) {
  const templates = await listSeatLayoutTemplates();
  return templates.find((template) =>
    template.scope === "OPERATOR"
    && template.ownerId === ownerId
    && template.sourceTemplateId === sourceTemplateId
    && template.status === "ACTIVE"
    && template.currentPublishedRevisionId
  );
}

export async function persistFleetLayoutChoice(input: {
  fleetId: string;
  ownerId: string;
  busName: string;
  choice: AdminFleetLayoutChoice;
}) {
  const { fleetId, ownerId, busName, choice } = input;
  if (!choice.customized && choice.templateId && choice.revisionId) {
    const existing = await findPublishedAdoption(ownerId, choice.templateId);
    if (existing?.currentPublishedRevisionId) {
      return assignInitialFleetSeatLayout(fleetId, existing.currentPublishedRevisionId);
    }
    try {
      const adopted = await adoptSeatLayoutForOperator(choice.templateId, {
        ownerId,
        name: choice.templateName,
        templateCode: adoptionCode(ownerId, choice.templateId),
      });
      return assignInitialFleetSeatLayout(fleetId, adopted.revision.id);
    } catch (error) {
      const concurrentlyCreated = await findPublishedAdoption(ownerId, choice.templateId);
      if (!concurrentlyCreated?.currentPublishedRevisionId) throw error;
      return assignInitialFleetSeatLayout(fleetId, concurrentlyCreated.currentPublishedRevisionId);
    }
  }
  return createInitialFleetSeatLayout(fleetId, {
    name: `${busName.trim()} seat layout`,
    layout: choice.layout,
    sourceTemplateId: choice.sourceTemplateId,
  });
}
