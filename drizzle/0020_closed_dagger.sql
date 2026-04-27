CREATE TABLE `extracted_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`extractionRunId` int NOT NULL,
	`fieldKey` varchar(100) NOT NULL,
	`fieldLabel` varchar(255) NOT NULL,
	`extractedValue` text,
	`confirmedValue` text,
	`confidence` decimal(5,2),
	`source` enum('ai','manual','ai_confirmed','ai_corrected') NOT NULL DEFAULT 'ai',
	`category` enum('supplier','contract','financial','legal','other') NOT NULL DEFAULT 'other',
	`needsReview` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `extracted_fields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `extraction_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceFileUrl` varchar(1000) NOT NULL,
	`sourceFileKey` varchar(500),
	`sourceFileName` varchar(255) NOT NULL,
	`sourceFileMimeType` varchar(100),
	`purpose` enum('contract_fill','supplier_fill','both') NOT NULL DEFAULT 'both',
	`templateId` int,
	`supplierId` int,
	`contractId` int,
	`status` enum('pending','processing','completed','failed','reviewed') NOT NULL DEFAULT 'pending',
	`overallConfidence` decimal(5,2),
	`rawResponse` longtext,
	`errorMessage` text,
	`processingTimeMs` int,
	`reviewedById` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `extraction_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`fieldKey` varchar(100) NOT NULL,
	`label` varchar(255) NOT NULL,
	`fieldType` enum('text','number','date','currency','textarea','select') NOT NULL DEFAULT 'text',
	`isRequired` boolean NOT NULL DEFAULT true,
	`defaultValue` text,
	`description` text,
	`selectOptions` json,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `template_fields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contracts` ADD `templateId` int;--> statement-breakpoint
ALTER TABLE `contracts` ADD `extractionRunId` int;--> statement-breakpoint
ALTER TABLE `contracts` ADD `aiConfidenceScore` decimal(5,2);--> statement-breakpoint
ALTER TABLE `contracts` ADD `filledFieldsOrigin` json;--> statement-breakpoint
ALTER TABLE `extracted_fields` ADD CONSTRAINT `extracted_fields_extractionRunId_extraction_runs_id_fk` FOREIGN KEY (`extractionRunId`) REFERENCES `extraction_runs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extraction_runs` ADD CONSTRAINT `extraction_runs_templateId_contract_templates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `contract_templates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extraction_runs` ADD CONSTRAINT `extraction_runs_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extraction_runs` ADD CONSTRAINT `extraction_runs_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extraction_runs` ADD CONSTRAINT `extraction_runs_reviewedById_users_id_fk` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extraction_runs` ADD CONSTRAINT `extraction_runs_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `template_fields` ADD CONSTRAINT `template_fields_templateId_contract_templates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `contract_templates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_templateId_contract_templates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `contract_templates`(`id`) ON DELETE no action ON UPDATE no action;