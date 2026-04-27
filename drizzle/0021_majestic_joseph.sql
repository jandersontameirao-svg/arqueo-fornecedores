CREATE TABLE `supplier_document_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`extractionRunId` int,
	`fileUrl` varchar(1000) NOT NULL,
	`fileKey` varchar(500),
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`documentType` enum('cnpj_card','registration_form','personal_id','address_proof','resume','diploma','certificate','cnh','contract','invoice','other') NOT NULL DEFAULT 'other',
	`documentTypeConfidence` decimal(5,2),
	`linkedById` int,
	`linkedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplier_document_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `suppliers` ADD `registrationOrigin` enum('manual','ai') DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `supplier_document_links` ADD CONSTRAINT `supplier_document_links_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_document_links` ADD CONSTRAINT `supplier_document_links_extractionRunId_extraction_runs_id_fk` FOREIGN KEY (`extractionRunId`) REFERENCES `extraction_runs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_document_links` ADD CONSTRAINT `supplier_document_links_linkedById_users_id_fk` FOREIGN KEY (`linkedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;