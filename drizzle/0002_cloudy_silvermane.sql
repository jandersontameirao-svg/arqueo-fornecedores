CREATE TABLE `contract_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`unit` varchar(50),
	`quantity` decimal(10,3),
	`unitPrice` decimal(15,2),
	`totalPrice` decimal(15,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contract_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contract_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`contractType` enum('service','supply','lease','consulting','maintenance','other') DEFAULT 'service',
	`content` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contract_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`number` varchar(50),
	`title` varchar(255) NOT NULL,
	`object` text,
	`contractType` enum('service','supply','lease','consulting','maintenance','other') DEFAULT 'service',
	`status` enum('draft','review','active','suspended','expired','terminated') NOT NULL DEFAULT 'draft',
	`creationMode` enum('manual','template','duplicate','ai') DEFAULT 'manual',
	`totalValue` decimal(15,2),
	`currency` varchar(3) DEFAULT 'BRL',
	`paymentTerms` text,
	`startDate` timestamp,
	`endDate` timestamp,
	`signedAt` timestamp,
	`contractorName` varchar(255),
	`contractorCnpj` varchar(18),
	`contractorRepresentative` varchar(255),
	`content` text,
	`notes` text,
	`fileKey` varchar(500),
	`fileUrl` varchar(1000),
	`fileName` varchar(255),
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contract_items` ADD CONSTRAINT `contract_items_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_templates` ADD CONSTRAINT `contract_templates_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;