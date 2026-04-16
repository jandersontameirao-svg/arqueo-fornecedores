CREATE TABLE `contract_expiration_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`supplierId` int NOT NULL,
	`daysBeforeExpiration` int NOT NULL,
	`effectiveDateSource` enum('original','amendment') NOT NULL DEFAULT 'original',
	`amendmentId` int,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`notificationTitle` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contract_expiration_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contract_expiration_notifications` ADD CONSTRAINT `contract_expiration_notifications_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_expiration_notifications` ADD CONSTRAINT `contract_expiration_notifications_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_expiration_notifications` ADD CONSTRAINT `contract_expiration_notifications_amendmentId_contract_amendments_id_fk` FOREIGN KEY (`amendmentId`) REFERENCES `contract_amendments`(`id`) ON DELETE set null ON UPDATE no action;