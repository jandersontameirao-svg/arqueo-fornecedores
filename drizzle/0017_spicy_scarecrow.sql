ALTER TABLE `contract_clicksign_events` MODIFY COLUMN `eventType` enum('envelope_created','document_uploaded','signers_added','requirements_set','envelope_activated','notification_sent','signer_signed','signer_refused','envelope_completed','envelope_cancelled','envelope_expired','resend','send_failed','webhook_received') NOT NULL;--> statement-breakpoint
ALTER TABLE `contract_clicksign_events` ADD `clicksignEnvelopeId` varchar(255);--> statement-breakpoint
ALTER TABLE `contract_clicksign_events` ADD `errorMessage` text;--> statement-breakpoint
ALTER TABLE `contract_clicksign_events` ADD `httpStatus` int;--> statement-breakpoint
ALTER TABLE `contract_clicksign_events` ADD `requestId` varchar(255);--> statement-breakpoint
ALTER TABLE `contract_signers` ADD `clicksignRequirementId` varchar(255);--> statement-breakpoint
ALTER TABLE `contract_signers` ADD `emailDeliveryStatus` varchar(50);--> statement-breakpoint
ALTER TABLE `contract_signers` ADD `lastNotifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `contracts` ADD `clicksignEnvelopeId` varchar(255);--> statement-breakpoint
ALTER TABLE `contracts` ADD `clicksignDocumentId` varchar(255);--> statement-breakpoint
ALTER TABLE `contracts` ADD `signatureStatus` enum('not_sent','sending','sent','partially_signed','signed','refused','cancelled','expired','send_failed') DEFAULT 'not_sent';--> statement-breakpoint
ALTER TABLE `contracts` ADD `lastSendAttemptAt` timestamp;--> statement-breakpoint
ALTER TABLE `contracts` ADD `lastSendError` text;--> statement-breakpoint
ALTER TABLE `contracts` ADD `sendAttemptCount` int DEFAULT 0;