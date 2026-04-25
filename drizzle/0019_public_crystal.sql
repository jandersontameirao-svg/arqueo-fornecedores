CREATE TABLE `supplier_company_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`companyId` int NOT NULL,
	`businessUnitId` int,
	`categoryId` int,
	`criticality` enum('low','medium','high','critical') DEFAULT 'medium',
	`serviceScope` text,
	`internalResponsibleId` int,
	`homologationStatus` enum('pending','in_progress','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
	`homologatedAt` timestamp,
	`homologatedById` int,
	`status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
	`internalNotes` text,
	`linkedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_company_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `suppliers` ADD `legalRepresentatives` json;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_businessUnitId_business_units_id_fk` FOREIGN KEY (`businessUnitId`) REFERENCES `business_units`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_categoryId_supplier_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `supplier_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_internalResponsibleId_users_id_fk` FOREIGN KEY (`internalResponsibleId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_homologatedById_users_id_fk` FOREIGN KEY (`homologatedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_linkedById_users_id_fk` FOREIGN KEY (`linkedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;