CREATE TABLE `supplier_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`targetCompanyId` varchar(100) NOT NULL,
	`targetCompanyName` varchar(255) NOT NULL,
	`sourceCompanyId` varchar(100) NOT NULL,
	`sourceCompanyName` varchar(255) NOT NULL,
	`groupName` varchar(100) NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`linkedById` int,
	`linkedByEmail` varchar(320),
	`linkedByName` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `supplier_links` ADD CONSTRAINT `supplier_links_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_links` ADD CONSTRAINT `supplier_links_linkedById_users_id_fk` FOREIGN KEY (`linkedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;