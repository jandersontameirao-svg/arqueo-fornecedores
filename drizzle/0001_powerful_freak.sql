ALTER TABLE `user_business_unit_roles` DROP FOREIGN KEY `ubr_org_group_fk`;
--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` DROP FOREIGN KEY `ubr_bu_fk`;
--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` DROP FOREIGN KEY `ubr_grantedby_fk`;
--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` DROP FOREIGN KEY `ubr_bu_fk2`;
--> statement-breakpoint
ALTER TABLE `user_company_roles` DROP FOREIGN KEY `ucr_grantedby_fk`;
--> statement-breakpoint
ALTER TABLE `user_group_roles` DROP FOREIGN KEY `ugr_grantedby_fk`;
--> statement-breakpoint
DROP INDEX `organizational_groups_slug_unique` ON `organizational_groups`;--> statement-breakpoint
DROP INDEX `supplier_categories_name_unique` ON `supplier_categories`;--> statement-breakpoint
DROP INDEX `users_openId_unique` ON `users`;--> statement-breakpoint
ALTER TABLE `approval_steps` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `approval_steps` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `approval_workflows` MODIFY COLUMN `startedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `approval_workflows` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `approval_workflows` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `business_units` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `business_units` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `compliance_alerts` MODIFY COLUMN `isResolved` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `compliance_alerts` MODIFY COLUMN `isResolved` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `compliance_alerts` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `compliance_alerts` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `contract_amendments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `contract_amendments` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `contract_clicksign_events` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `contract_expiration_notifications` MODIFY COLUMN `sentAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `contract_expiration_notifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `contract_items` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `contract_signers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `contract_signers` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `contract_templates` MODIFY COLUMN `isActive` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `contract_templates` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `contract_templates` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `contract_versions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `contracts` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `contracts` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `document_expiration_notifications` MODIFY COLUMN `sentAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `document_expiration_notifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `expirationAlertSent` boolean;--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `expirationAlertSent` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `extracted_fields` MODIFY COLUMN `needsReview` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `extracted_fields` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `extracted_fields` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `extraction_runs` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `extraction_runs` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `financial_milestones` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `financial_milestones` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `interactions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `interactions` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `organizational_groups` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `organizational_groups` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `performance_evaluations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `performance_evaluations` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `supplier_categories` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `supplier_categories` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `supplier_company_links` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `supplier_company_links` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `supplier_contacts` MODIFY COLUMN `isPrimary` boolean;--> statement-breakpoint
ALTER TABLE `supplier_contacts` MODIFY COLUMN `isPrimary` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `supplier_contacts` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `supplier_contacts` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `supplier_document_links` MODIFY COLUMN `linkedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `supplier_document_links` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `supplier_links` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `supplier_links` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `suppliers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `suppliers` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `template_fields` MODIFY COLUMN `isRequired` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `template_fields` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `template_fields` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` MODIFY COLUMN `role` enum('bu_admin','bu_operator','bu_viewer') NOT NULL;--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `user_business_units` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `user_company_roles` MODIFY COLUMN `role` enum('company_admin','company_operator','company_viewer') NOT NULL;--> statement-breakpoint
ALTER TABLE `user_company_roles` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `user_company_roles` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `user_group_roles` MODIFY COLUMN `role` enum('group_admin','group_operator','group_viewer') NOT NULL;--> statement-breakpoint
ALTER TABLE `user_group_roles` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `user_group_roles` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `isActive` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `globalRole` enum('superadmin_global','group_admin','company_admin','business_manager','operator','viewer') DEFAULT 'viewer';--> statement-breakpoint
ALTER TABLE `approval_steps` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `approval_workflows` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `audit_logs` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `business_units` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `companies` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `compliance_alerts` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `contract_amendments` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `contract_clicksign_events` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `contract_expiration_notifications` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `contract_items` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `contract_signers` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `contract_templates` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `contract_versions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `contracts` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `document_expiration_notifications` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `documents` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `extracted_fields` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `extraction_runs` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `financial_milestones` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `interactions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `organizational_groups` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `supplier_categories` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `supplier_contacts` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `supplier_document_links` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `supplier_links` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `suppliers` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `template_fields` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `user_business_units` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `user_company_roles` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `user_group_roles` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `users` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `organizational_groups` ADD CONSTRAINT `organizational_groups_slug_unique` UNIQUE(`slug`);--> statement-breakpoint
ALTER TABLE `supplier_categories` ADD CONSTRAINT `supplier_categories_name_unique` UNIQUE(`name`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_openId_unique` UNIQUE(`openId`);--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` ADD CONSTRAINT `user_business_unit_roles_businessUnitId_business_units_id_fk` FOREIGN KEY (`businessUnitId`) REFERENCES `business_units`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` ADD CONSTRAINT `user_business_unit_roles_grantedById_users_id_fk` FOREIGN KEY (`grantedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_company_roles` ADD CONSTRAINT `user_company_roles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_company_roles` ADD CONSTRAINT `user_company_roles_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_company_roles` ADD CONSTRAINT `user_company_roles_grantedById_users_id_fk` FOREIGN KEY (`grantedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_group_roles` ADD CONSTRAINT `user_group_roles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_group_roles` ADD CONSTRAINT `user_group_roles_grantedById_users_id_fk` FOREIGN KEY (`grantedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;