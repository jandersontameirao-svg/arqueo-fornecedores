CREATE TABLE `user_business_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessUnitId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_business_units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_business_units` ADD CONSTRAINT `user_business_units_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_business_units` ADD CONSTRAINT `user_business_units_businessUnitId_business_units_id_fk` FOREIGN KEY (`businessUnitId`) REFERENCES `business_units`(`id`) ON DELETE cascade ON UPDATE no action;