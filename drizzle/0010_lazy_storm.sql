ALTER TABLE `contracts` MODIFY COLUMN `contractorName` varchar(1000);--> statement-breakpoint
ALTER TABLE `contracts` MODIFY COLUMN `contractorCnpj` varchar(500);--> statement-breakpoint
ALTER TABLE `contracts` MODIFY COLUMN `contractorRepresentative` varchar(500);