ALTER TABLE `contracts` ADD `companyScope` enum('single','all_group') DEFAULT 'single' NOT NULL;--> statement-breakpoint
ALTER TABLE `contracts` ADD `contractCompanyId` int;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_contractCompanyId_companies_id_fk` FOREIGN KEY (`contractCompanyId`) REFERENCES `companies`(`id`) ON DELETE set null ON UPDATE no action;