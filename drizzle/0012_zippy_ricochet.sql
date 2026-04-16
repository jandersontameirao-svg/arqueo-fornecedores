CREATE TABLE `document_expiration_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`supplierId` int NOT NULL,
	`daysBeforeExpiration` int NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`notificationTitle` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_expiration_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `interactions` ADD `attachmentKey` varchar(500);--> statement-breakpoint
ALTER TABLE `interactions` ADD `attachmentName` varchar(255);--> statement-breakpoint
ALTER TABLE `interactions` ADD `aiExtractedContent` longtext;--> statement-breakpoint
ALTER TABLE `document_expiration_notifications` ADD CONSTRAINT `document_expiration_notifications_documentId_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_expiration_notifications` ADD CONSTRAINT `document_expiration_notifications_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;