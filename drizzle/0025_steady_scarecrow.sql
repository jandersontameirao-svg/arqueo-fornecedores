ALTER TABLE `contracts` DROP FOREIGN KEY `contracts_contractCompanyId_companies_id_fk`;
--> statement-breakpoint
ALTER TABLE `contracts` ADD `contractCompanySlug` varchar(100);--> statement-breakpoint
ALTER TABLE `contracts` DROP COLUMN `contractCompanyId`;