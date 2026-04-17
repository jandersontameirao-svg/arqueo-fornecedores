/**
 * Clicksign Webhook Handler
 * 
 * Recebe eventos do Clicksign via POST /api/clicksign/webhook
 * e atualiza o estado local de contratos e signatários.
 */

import { Request, Response, Express } from "express";
import * as db from "./db";
import { verifyWebhookSignature } from "./clicksign";

interface ClicksignWebhookEvent {
  event: {
    type: string; // e.g., "signer.signed", "envelope.closed", "signer.refused"
  };
  envelope?: {
    id: string;
    status: string;
  };
  signer?: {
    id: string;
    email: string;
    name: string;
  };
  document?: {
    id: string;
  };
}

export function registerClicksignWebhookRoute(app: Express) {
  app.post("/api/clicksign/webhook", async (req: Request, res: Response) => {
    try {
      const payload = JSON.stringify(req.body);
      const signature = req.headers["x-clicksign-signature"] as string || "";

      // Verify signature if configured
      if (!verifyWebhookSignature(payload, signature)) {
        console.error("[Clicksign Webhook] Invalid signature");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      const event = req.body as ClicksignWebhookEvent;
      const eventType = event.event?.type;
      const envelopeId = event.envelope?.id;

      if (!eventType || !envelopeId) {
        console.warn("[Clicksign Webhook] Missing event type or envelope ID");
        res.status(400).json({ error: "Missing event type or envelope ID" });
        return;
      }

      console.log(`[Clicksign Webhook] Received: ${eventType} for envelope ${envelopeId}`);

      // Find the contract by clicksignEnvelopeId
      const contract = await db.getContractByClicksignEnvelopeId(envelopeId);
      if (!contract) {
        console.warn(`[Clicksign Webhook] No contract found for envelope ${envelopeId}`);
        // Still return 200 to avoid Clicksign retrying
        res.status(200).json({ received: true, matched: false });
        return;
      }

      // Map Clicksign event type to our internal event type
      let internalEventType: string;
      switch (eventType) {
        case "signer.signed":
          internalEventType = "signer_signed";
          break;
        case "signer.refused":
          internalEventType = "signer_refused";
          break;
        case "envelope.closed":
          internalEventType = "envelope_completed";
          break;
        case "envelope.cancelled":
          internalEventType = "envelope_cancelled";
          break;
        case "envelope.expired":
          internalEventType = "envelope_expired";
          break;
        default:
          internalEventType = "webhook_received";
      }

      // Record the event
      await db.createContractClicksignEvent({
        contractId: contract.id,
        clicksignEnvelopeId: envelopeId,
        clicksignDocumentId: event.document?.id || null,
        eventType: internalEventType as any,
        eventData: event,
        signerId: null,
      });

      // Update signer status if applicable
      if (event.signer?.id) {
        const signers = await db.getContractSigners(contract.id);
        const matchedSigner = signers.find(s => s.clicksignSignerId === event.signer!.id);

        if (matchedSigner) {
          if (eventType === "signer.signed") {
            await db.updateContractSigner(matchedSigner.id, {
              status: "signed",
              signedAt: new Date(),
            });
          } else if (eventType === "signer.refused") {
            await db.updateContractSigner(matchedSigner.id, {
              status: "refused",
            });
          }
        }
      }

      // Update contract signature status based on event
      switch (eventType) {
        case "signer.signed": {
          // Check if all signers have signed
          const allSigners = await db.getContractSigners(contract.id);
          const allSigned = allSigners.every(s => s.status === "signed");
          if (allSigned) {
            await db.updateContract(contract.id, {
              signatureStatus: "signed" as any,
              status: "active",
            });
          } else {
            await db.updateContract(contract.id, {
              signatureStatus: "partially_signed" as any,
            });
          }
          break;
        }
        case "signer.refused":
          await db.updateContract(contract.id, {
            signatureStatus: "refused" as any,
          });
          break;
        case "envelope.closed":
          await db.updateContract(contract.id, {
            signatureStatus: "signed" as any,
            status: "active",
            signedAt: new Date(),
          });
          break;
        case "envelope.cancelled":
          await db.updateContract(contract.id, {
            signatureStatus: "cancelled" as any,
          });
          break;
        case "envelope.expired":
          await db.updateContract(contract.id, {
            signatureStatus: "expired" as any,
          });
          break;
      }

      console.log(`[Clicksign Webhook] Processed ${eventType} for contract ${contract.id}`);
      res.status(200).json({ received: true, processed: true });
    } catch (error: any) {
      console.error("[Clicksign Webhook] Error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
