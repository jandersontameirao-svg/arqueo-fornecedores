-- ============================================================================
-- Migração aditiva: módulos VRM (Score de Risco, Risk Register, Assessments,
-- Offboarding). 100% aditivo — não altera nem remove nenhuma tabela existente.
-- Idempotente (CREATE TABLE IF NOT EXISTS). Pode rodar direto no MySQL da VPS:
--   mysql -u USER -p BANCO < scripts/migrate-vrm-modules.sql
-- Alternativa recomendada (mantém o estado do drizzle): pnpm db:generate && pnpm db:migrate
-- ============================================================================

CREATE TABLE IF NOT EXISTS `supplier_risk_scores` (
  `id` int AUTO_INCREMENT NOT NULL,
  `supplierId` int NOT NULL,
  `score` int NOT NULL,
  `level` enum('low','medium','high','critical') NOT NULL,
  `breakdown` json,
  `notes` text,
  `computedById` int,
  `organizationalGroupId` int,
  `computedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `supplier_risk_scores_id` PRIMARY KEY(`id`),
  CONSTRAINT `srs_supplier_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade,
  CONSTRAINT `srs_user_fk` FOREIGN KEY (`computedById`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `supplier_risks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `supplierId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `category` enum('operational','financial','compliance','security','reputational','strategic','other') NOT NULL DEFAULT 'operational',
  `likelihood` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `impact` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `status` enum('open','in_treatment','mitigated','accepted','closed') NOT NULL DEFAULT 'open',
  `treatmentPlan` text,
  `ownerId` int,
  `dueDate` timestamp NULL,
  `resolvedAt` timestamp NULL,
  `organizationalGroupId` int,
  `createdById` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `supplier_risks_id` PRIMARY KEY(`id`),
  CONSTRAINT `sr_supplier_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade,
  CONSTRAINT `sr_owner_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`),
  CONSTRAINT `sr_creator_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `assessment_templates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(100),
  `questions` json NOT NULL,
  `isActive` boolean NOT NULL DEFAULT true,
  `organizationalGroupId` int,
  `createdById` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `assessment_templates_id` PRIMARY KEY(`id`),
  CONSTRAINT `at_creator_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `supplier_assessments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `supplierId` int NOT NULL,
  `templateId` int NOT NULL,
  `token` varchar(64) NOT NULL,
  `status` enum('draft','sent','in_progress','submitted','reviewed') NOT NULL DEFAULT 'draft',
  `answers` json,
  `score` int,
  `riskLevel` enum('low','medium','high','critical'),
  `sentAt` timestamp NULL,
  `submittedAt` timestamp NULL,
  `reviewedAt` timestamp NULL,
  `reviewedById` int,
  `organizationalGroupId` int,
  `createdById` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `supplier_assessments_id` PRIMARY KEY(`id`),
  CONSTRAINT `supplier_assessments_token_unique` UNIQUE(`token`),
  CONSTRAINT `sa_supplier_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade,
  CONSTRAINT `sa_template_fk` FOREIGN KEY (`templateId`) REFERENCES `assessment_templates`(`id`),
  CONSTRAINT `sa_reviewer_fk` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`),
  CONSTRAINT `sa_creator_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `offboarding_checklists` (
  `id` int AUTO_INCREMENT NOT NULL,
  `supplierId` int NOT NULL,
  `status` enum('open','in_progress','completed','cancelled') NOT NULL DEFAULT 'open',
  `reason` text,
  `items` json NOT NULL,
  `startedById` int,
  `startedAt` timestamp NOT NULL DEFAULT (now()),
  `completedAt` timestamp NULL,
  `organizationalGroupId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `offboarding_checklists_id` PRIMARY KEY(`id`),
  CONSTRAINT `oc_supplier_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade,
  CONSTRAINT `oc_starter_fk` FOREIGN KEY (`startedById`) REFERENCES `users`(`id`)
);
