-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `approval_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`stepName` varchar(100) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`assignedToId` int,
	`approvedById` int,
	`approvedAt` timestamp,
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `approval_workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`status` enum('pending','in_progress','approved','rejected') NOT NULL DEFAULT 'pending',
	`currentStep` int NOT NULL DEFAULT 1,
	`totalSteps` int NOT NULL DEFAULT 1,
	`notes` text,
	`startedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`completedAt` timestamp,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`action` enum('create','update','delete','approve','reject','upload','download') NOT NULL,
	`changes` json,
	`userId` int,
	`userEmail` varchar(320),
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`organizationalGroupId` int,
	`companyId` int,
	`businessUnitId` int,
	`beforeData` json,
	`afterData` json,
	`userAgent` varchar(500)
);
--> statement-breakpoint
CREATE TABLE `business_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50),
	`description` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`logoUrl` varchar(1000),
	`organizationalGroupId` int
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessUnitId` int NOT NULL,
	`legalName` varchar(255) NOT NULL,
	`tradeName` varchar(255),
	`cnpj` varchar(18),
	`logoUrl` varchar(1000),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`organizationalGroupId` int,
	`companyType` enum('holding','subsidiary','branch','independent') DEFAULT 'subsidiary',
	`country` varchar(100) DEFAULT 'Brasil'
);
--> statement-breakpoint
CREATE TABLE `compliance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int,
	`documentId` int,
	`alertType` enum('expiration','missing_document','compliance_issue','review_needed') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`title` varchar(255) NOT NULL,
	`description` text,
	`dueDate` timestamp,
	`isResolved` tinyint(1) NOT NULL DEFAULT 0,
	`resolvedAt` timestamp,
	`resolvedById` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
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
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `contract_clicksign_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`clicksignDocumentId` varchar(255),
	`eventType` enum('envelope_created','document_uploaded','signers_added','requirements_set','envelope_activated','notification_sent','signer_signed','signer_refused','envelope_completed','envelope_cancelled','envelope_expired','resend','send_failed','webhook_received') NOT NULL,
	`eventData` json,
	`signerId` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`clicksignEnvelopeId` varchar(255),
	`errorMessage` text,
	`httpStatus` int,
	`requestId` varchar(255)
);
--> statement-breakpoint
CREATE TABLE `contract_expiration_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`supplierId` int NOT NULL,
	`daysBeforeExpiration` int NOT NULL,
	`effectiveDateSource` enum('original','amendment') NOT NULL DEFAULT 'original',
	`amendmentId` int,
	`sentAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`notificationTitle` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `contract_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`unit` varchar(50),
	`quantity` decimal(10,3),
	`unitPrice` decimal(15,2),
	`totalPrice` decimal(15,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `contract_signers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`cpfCnpj` varchar(20),
	`role` enum('contractor','contracted','witness','guarantor') NOT NULL DEFAULT 'contractor',
	`signOrder` int DEFAULT 1,
	`clicksignSignerId` varchar(255),
	`signedAt` timestamp,
	`status` enum('pending','signed','refused','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`clicksignRequirementId` varchar(255),
	`emailDeliveryStatus` varchar(50),
	`lastNotifiedAt` timestamp
);
--> statement-breakpoint
CREATE TABLE `contract_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`contractType` enum('service','supply','lease','consulting','maintenance','other') DEFAULT 'service',
	`content` longtext NOT NULL,
	`isActive` tinyint(1) NOT NULL DEFAULT 1,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`fileUrl` varchar(1000),
	`fileName` varchar(500),
	`organizationalGroupId` int,
	`orgCompanyId` int
);
--> statement-breakpoint
CREATE TABLE `contract_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`versionNumber` int NOT NULL DEFAULT 1,
	`content` longtext,
	`changeDescription` varchar(500),
	`title` varchar(255),
	`totalValue` decimal(15,2),
	`startDate` timestamp,
	`endDate` timestamp,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
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
	`contractorName` varchar(1000),
	`contractorCnpj` varchar(500),
	`contractorRepresentative` varchar(500),
	`content` longtext,
	`notes` text,
	`fileKey` varchar(500),
	`fileUrl` varchar(1000),
	`fileName` varchar(255),
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`clicksignEnvelopeId` varchar(255),
	`clicksignDocumentId` varchar(255),
	`signatureStatus` enum('not_sent','sending','sent','partially_signed','signed','refused','cancelled','expired','send_failed') DEFAULT 'not_sent',
	`lastSendAttemptAt` timestamp,
	`lastSendError` text,
	`sendAttemptCount` int DEFAULT 0,
	`templateId` int,
	`extractionRunId` int,
	`aiConfidenceScore` decimal(5,2),
	`filledFieldsOrigin` json,
	`templateName` varchar(255),
	`companyScope` enum('single','all_group') NOT NULL DEFAULT 'single',
	`contractCompanySlug` varchar(100),
	`organizationalGroupId` int,
	`orgCompanyId` int,
	`orgBusinessUnitId` int,
	`organizationalScopeStatus` enum('classified','pending_classification') DEFAULT 'pending_classification'
);
--> statement-breakpoint
CREATE TABLE `document_expiration_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`supplierId` int NOT NULL,
	`daysBeforeExpiration` int NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`notificationTitle` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('contract','certificate','invoice','license','insurance','registration','other') NOT NULL,
	`description` text,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` varchar(1000) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`version` int NOT NULL DEFAULT 1,
	`parentDocumentId` int,
	`expiresAt` timestamp,
	`expirationAlertSent` tinyint(1) DEFAULT 0,
	`uploadedById` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`organizationalGroupId` int,
	`orgCompanyId` int,
	`orgBusinessUnitId` int
);
--> statement-breakpoint
CREATE TABLE `extracted_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`extractionRunId` int NOT NULL,
	`fieldKey` varchar(100) NOT NULL,
	`fieldLabel` varchar(255) NOT NULL,
	`extractedValue` text,
	`confirmedValue` text,
	`confidence` decimal(5,2),
	`source` enum('ai','manual','ai_confirmed','ai_corrected') NOT NULL DEFAULT 'ai',
	`category` enum('supplier','contract','financial','legal','other') NOT NULL DEFAULT 'other',
	`needsReview` tinyint(1) NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `extraction_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceFileUrl` varchar(1000) NOT NULL,
	`sourceFileKey` varchar(500),
	`sourceFileName` varchar(255) NOT NULL,
	`sourceFileMimeType` varchar(100),
	`purpose` enum('contract_fill','supplier_fill','both') NOT NULL DEFAULT 'both',
	`templateId` int,
	`supplierId` int,
	`contractId` int,
	`status` enum('pending','processing','completed','failed','reviewed') NOT NULL DEFAULT 'pending',
	`overallConfidence` decimal(5,2),
	`rawResponse` longtext,
	`errorMessage` text,
	`processingTimeMs` int,
	`reviewedById` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
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
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`type` enum('email','phone','meeting','visit','note','other') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`description` text,
	`contactName` varchar(255),
	`interactionDate` timestamp NOT NULL,
	`followUpDate` timestamp,
	`attachmentUrl` varchar(1000),
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`attachmentKey` varchar(500),
	`attachmentName` varchar(255),
	`aiExtractedContent` longtext,
	`organizationalGroupId` int,
	`orgCompanyId` int,
	`orgBusinessUnitId` int
);
--> statement-breakpoint
CREATE TABLE `organizational_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`country` varchar(100) DEFAULT 'Brasil',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`description` text,
	`logoUrl` varchar(1000),
	`createdById` int
);
--> statement-breakpoint
CREATE TABLE `performance_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`evaluationPeriod` varchar(50) NOT NULL,
	`qualityScore` decimal(5,2),
	`deliveryScore` decimal(5,2),
	`priceScore` decimal(5,2),
	`communicationScore` decimal(5,2),
	`complianceScore` decimal(5,2),
	`overallScore` decimal(5,2),
	`strengths` text,
	`improvements` text,
	`comments` text,
	`evaluatedById` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`organizationalGroupId` int,
	`orgCompanyId` int,
	`orgBusinessUnitId` int
);
--> statement-breakpoint
CREATE TABLE `supplier_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`color` varchar(7) DEFAULT '#3B82F6',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
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
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `supplier_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(100),
	`email` varchar(320),
	`phone` varchar(20),
	`isPrimary` tinyint(1) DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `supplier_document_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`extractionRunId` int,
	`fileUrl` varchar(1000) NOT NULL,
	`fileKey` varchar(500),
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`documentType` enum('cnpj_card','registration_form','personal_id','address_proof','resume','diploma','certificate','cnh','contract','invoice','other') NOT NULL DEFAULT 'other',
	`documentTypeConfidence` decimal(5,2),
	`linkedById` int,
	`linkedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
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
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`tradeName` varchar(255),
	`cnpj` varchar(18) NOT NULL,
	`stateRegistration` varchar(20),
	`municipalRegistration` varchar(20),
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`website` varchar(255),
	`street` varchar(255),
	`number` varchar(20),
	`complement` varchar(100),
	`neighborhood` varchar(100),
	`city` varchar(100),
	`state` varchar(2),
	`zipCode` varchar(10),
	`country` varchar(100) DEFAULT 'Brasil',
	`bankName` varchar(100),
	`bankAgency` varchar(20),
	`bankAccount` varchar(30),
	`bankAccountType` enum('checking','savings'),
	`pixKey` varchar(255),
	`categoryId` int,
	`criticality` enum('low','medium','high','critical') DEFAULT 'medium',
	`status` enum('pending','approved','rejected','suspended','inactive') NOT NULL DEFAULT 'pending',
	`approvedAt` timestamp,
	`approvedById` int,
	`notes` text,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`companyId` varchar(100),
	`groupId` int,
	`legalRepresentatives` json,
	`registrationOrigin` enum('manual','ai') NOT NULL DEFAULT 'manual',
	`organizationalGroupId` int,
	`orgCompanyId` int,
	`orgBusinessUnitId` int,
	`organizationalScopeStatus` enum('classified','pending_classification') DEFAULT 'pending_classification'
);
--> statement-breakpoint
CREATE TABLE `template_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`fieldKey` varchar(100) NOT NULL,
	`label` varchar(255) NOT NULL,
	`fieldType` enum('text','number','date','currency','textarea','select') NOT NULL DEFAULT 'text',
	`isRequired` tinyint(1) NOT NULL DEFAULT 1,
	`defaultValue` text,
	`description` text,
	`selectOptions` json,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `user_business_unit_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organizationalGroupId` int NOT NULL,
	`businessUnitId` int NOT NULL,
	`role` enum('business_manager','operator','viewer') NOT NULL DEFAULT 'viewer',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`grantedById` int
);
--> statement-breakpoint
CREATE TABLE `user_business_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessUnitId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `user_company_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organizationalGroupId` int NOT NULL,
	`companyId` int NOT NULL,
	`role` enum('company_admin','business_manager','operator','viewer') NOT NULL DEFAULT 'viewer',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`grantedById` int
);
--> statement-breakpoint
CREATE TABLE `user_group_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organizationalGroupId` int NOT NULL,
	`role` enum('group_admin','company_admin','business_manager','operator','viewer') NOT NULL DEFAULT 'viewer',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`grantedById` int
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('admin','manager','reader') NOT NULL DEFAULT 'reader',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`isActive` tinyint(1) NOT NULL DEFAULT 1,
	`passwordHash` varchar(255),
	`globalRole` enum('superadmin_global','group_admin','company_admin','business_manager','operator','viewer') DEFAULT 'operator',
	`defaultOrgGroupId` int
);
--> statement-breakpoint
ALTER TABLE `approval_steps` ADD CONSTRAINT `approval_steps_workflowId_approval_workflows_id_fk` FOREIGN KEY (`workflowId`) REFERENCES `approval_workflows`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_steps` ADD CONSTRAINT `approval_steps_assignedToId_users_id_fk` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_steps` ADD CONSTRAINT `approval_steps_approvedById_users_id_fk` FOREIGN KEY (`approvedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_workflows` ADD CONSTRAINT `approval_workflows_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_workflows` ADD CONSTRAINT `approval_workflows_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_units` ADD CONSTRAINT `business_units_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `companies` ADD CONSTRAINT `companies_businessUnitId_business_units_id_fk` FOREIGN KEY (`businessUnitId`) REFERENCES `business_units`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `companies` ADD CONSTRAINT `companies_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_alerts` ADD CONSTRAINT `compliance_alerts_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_alerts` ADD CONSTRAINT `compliance_alerts_documentId_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compliance_alerts` ADD CONSTRAINT `compliance_alerts_resolvedById_users_id_fk` FOREIGN KEY (`resolvedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_amendments` ADD CONSTRAINT `contract_amendments_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_amendments` ADD CONSTRAINT `contract_amendments_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_clicksign_events` ADD CONSTRAINT `contract_clicksign_events_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_expiration_notifications` ADD CONSTRAINT `contract_expiration_notifications_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_expiration_notifications` ADD CONSTRAINT `contract_expiration_notifications_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_items` ADD CONSTRAINT `contract_items_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_signers` ADD CONSTRAINT `contract_signers_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_templates` ADD CONSTRAINT `contract_templates_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_versions` ADD CONSTRAINT `contract_versions_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contract_versions` ADD CONSTRAINT `contract_versions_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_templateId_contract_templates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `contract_templates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_expiration_notifications` ADD CONSTRAINT `document_expiration_notifications_documentId_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_expiration_notifications` ADD CONSTRAINT `document_expiration_notifications_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploadedById_users_id_fk` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extracted_fields` ADD CONSTRAINT `extracted_fields_extractionRunId_extraction_runs_id_fk` FOREIGN KEY (`extractionRunId`) REFERENCES `extraction_runs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extraction_runs` ADD CONSTRAINT `extraction_runs_templateId_contract_templates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `contract_templates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extraction_runs` ADD CONSTRAINT `extraction_runs_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extraction_runs` ADD CONSTRAINT `extraction_runs_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extraction_runs` ADD CONSTRAINT `extraction_runs_reviewedById_users_id_fk` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extraction_runs` ADD CONSTRAINT `extraction_runs_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_milestones` ADD CONSTRAINT `financial_milestones_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_milestones` ADD CONSTRAINT `financial_milestones_amendmentId_contract_amendments_id_fk` FOREIGN KEY (`amendmentId`) REFERENCES `contract_amendments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_milestones` ADD CONSTRAINT `financial_milestones_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interactions` ADD CONSTRAINT `interactions_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interactions` ADD CONSTRAINT `interactions_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD CONSTRAINT `performance_evaluations_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_evaluations` ADD CONSTRAINT `performance_evaluations_evaluatedById_users_id_fk` FOREIGN KEY (`evaluatedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_businessUnitId_business_units_id_fk` FOREIGN KEY (`businessUnitId`) REFERENCES `business_units`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_categoryId_supplier_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `supplier_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_internalResponsibleId_users_id_fk` FOREIGN KEY (`internalResponsibleId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_homologatedById_users_id_fk` FOREIGN KEY (`homologatedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_company_links` ADD CONSTRAINT `supplier_company_links_linkedById_users_id_fk` FOREIGN KEY (`linkedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_contacts` ADD CONSTRAINT `supplier_contacts_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_document_links` ADD CONSTRAINT `supplier_document_links_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_document_links` ADD CONSTRAINT `supplier_document_links_extractionRunId_extraction_runs_id_fk` FOREIGN KEY (`extractionRunId`) REFERENCES `extraction_runs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_document_links` ADD CONSTRAINT `supplier_document_links_linkedById_users_id_fk` FOREIGN KEY (`linkedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_links` ADD CONSTRAINT `supplier_links_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_links` ADD CONSTRAINT `supplier_links_linkedById_users_id_fk` FOREIGN KEY (`linkedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_categoryId_supplier_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `supplier_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_approvedById_users_id_fk` FOREIGN KEY (`approvedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_groupId_business_units_id_fk` FOREIGN KEY (`groupId`) REFERENCES `business_units`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `template_fields` ADD CONSTRAINT `template_fields_templateId_contract_templates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `contract_templates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` ADD CONSTRAINT `user_business_unit_roles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` ADD CONSTRAINT `ubr_org_group_fk` FOREIGN KEY (`organizationalGroupId`) REFERENCES `organizational_groups`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` ADD CONSTRAINT `ubr_bu_fk` FOREIGN KEY (`businessUnitId`) REFERENCES `business_units`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` ADD CONSTRAINT `ubr_grantedby_fk` FOREIGN KEY (`grantedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_business_unit_roles` ADD CONSTRAINT `ubr_bu_fk2` FOREIGN KEY (`businessUnitId`) REFERENCES `business_units`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_business_units` ADD CONSTRAINT `user_business_units_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_business_units` ADD CONSTRAINT `user_business_units_businessUnitId_business_units_id_fk` FOREIGN KEY (`businessUnitId`) REFERENCES `business_units`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_company_roles` ADD CONSTRAINT `ucr_grantedby_fk` FOREIGN KEY (`grantedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_group_roles` ADD CONSTRAINT `ugr_grantedby_fk` FOREIGN KEY (`grantedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `organizational_groups_slug_unique` ON `organizational_groups` (`slug`);--> statement-breakpoint
CREATE INDEX `supplier_categories_name_unique` ON `supplier_categories` (`name`);--> statement-breakpoint
CREATE INDEX `users_openId_unique` ON `users` (`openId`);
*/