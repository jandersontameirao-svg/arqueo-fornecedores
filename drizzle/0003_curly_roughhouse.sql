CREATE TABLE `contract_amendments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`number` varchar(50),
	`title` varchar(255) NOT NULL,
	`amendmentType` enum('financial','scope','term','mixed') NOT NULL DEFAULT 'financial',
	`status` enum('draft','review','active','terminated') NOT NULL DEFAULT 'draft',
	`description` text,
	`valueChange` varchar(50),
	`newTotalValue` varchar(50),
	`newEndDate` timestamp,
	`content` text,
	`notes` text,
	`signedAt` timestamp,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contract_amendments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financial_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`amendmentId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`plannedValue` varchar(50) NOT NULL,
	`paidValue` varchar(50),
	`dueDate` timestamp NOT NULL,
	`paidAt` timestamp,
	`paymentDeadlineDays` int DEFAULT 30,
	`status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financial_milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contract_amendments` ADD CONSTRAINT `contract_amendments_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_amendments` ADD CONSTRAINT `contract_amendments_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_milestones` ADD CONSTRAINT `financial_milestones_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_milestones` ADD CONSTRAINT `financial_milestones_amendmentId_contract_amendments_id_fk` FOREIGN KEY (`amendmentId`) REFERENCES `contract_amendments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_milestones` ADD CONSTRAINT `financial_milestones_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;