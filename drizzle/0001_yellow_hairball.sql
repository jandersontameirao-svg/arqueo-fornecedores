ALTER TABLE `audit_logs` DROP FOREIGN KEY `audit_logs_organizationalGroupId_organizational_groups_id_fk`;
--> statement-breakpoint
ALTER TABLE `business_units` DROP FOREIGN KEY `business_units_organizationalGroupId_organizational_groups_id_fk`;
--> statement-breakpoint
ALTER TABLE `companies` DROP FOREIGN KEY `companies_organizationalGroupId_organizational_groups_id_fk`;
--> statement-breakpoint
ALTER TABLE `contract_templates` DROP FOREIGN KEY `contract_templates_organizationalGroupId_organizational_groups_id_fk`;
--> statement-breakpoint
ALTER TABLE `contracts` DROP FOREIGN KEY `contracts_organizationalGroupId_organizational_groups_id_fk`;
--> statement-breakpoint
ALTER TABLE `documents` DROP FOREIGN KEY `documents_organizationalGroupId_organizational_groups_id_fk`;
--> statement-breakpoint
ALTER TABLE `interactions` DROP FOREIGN KEY `interactions_organizationalGroupId_organizational_groups_id_fk`;
--> statement-breakpoint
ALTER TABLE `performance_evaluations` DROP FOREIGN KEY `performance_evaluations_organizationalGroupId_organizational_groups_id_fk`;
--> statement-breakpoint
ALTER TABLE `suppliers` DROP FOREIGN KEY `suppliers_organizationalGroupId_organizational_groups_id_fk`;
--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` DROP FOREIGN KEY `user_business_unit_roles_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `contract_templates` DROP COLUMN `organizationalGroupId`;--> statement-breakpoint
ALTER TABLE `contract_templates` DROP COLUMN `orgCompanyId`;