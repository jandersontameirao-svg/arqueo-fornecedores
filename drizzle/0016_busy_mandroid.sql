CREATE TABLE `contract_clicksign_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`clicksignDocumentId` varchar(255),
	`eventType` enum('document_created','document_sent','signer_signed','signer_refused','document_completed','document_cancelled','document_expired','resend') NOT NULL,
	`eventData` json,
	`signerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contract_clicksign_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contract_signers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`cpfCnpj` varchar(20),
	`role` enum('contractor','contracted','witness','guarantor') NOT NULL DEFAULT 'contractor',
	`signOrder` int DEFAULT 1,
	`clicksignSignerId` varchar(255),
	`signedAt` timestamp,
	`status` enum('pending','signed','refused','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contract_signers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contract_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`versionNumber` int NOT NULL DEFAULT 1,
	`content` longtext,
	`changeDescription` varchar(500),
	`title` varchar(255),
	`totalValue` decimal(15,2),
	`startDate` timestamp,
	`endDate` timestamp,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contract_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contract_clicksign_events` ADD CONSTRAINT `contract_clicksign_events_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_signers` ADD CONSTRAINT `contract_signers_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_versions` ADD CONSTRAINT `contract_versions_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_versions` ADD CONSTRAINT `contract_versions_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;