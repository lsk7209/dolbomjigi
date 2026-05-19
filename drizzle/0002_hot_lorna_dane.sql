PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_support_programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`region_id` integer,
	`name_ko` text NOT NULL,
	`program_type` text NOT NULL,
	`eligibility_json` text,
	`application_method` text,
	`application_url` text,
	`period_start` integer,
	`period_end` integer,
	`budget` integer,
	`distribution_count` integer,
	`source_url` text NOT NULL,
	`source_publication_date` integer,
	`source_license` text DEFAULT '공공누리 제1유형' NOT NULL,
	`last_seen` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`human_reviewed` integer DEFAULT false NOT NULL,
	`reviewer_id` integer,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_support_programs`("id", "slug", "region_id", "name_ko", "program_type", "eligibility_json", "application_method", "application_url", "period_start", "period_end", "budget", "distribution_count", "source_url", "source_publication_date", "source_license", "last_seen", "status", "human_reviewed", "reviewer_id") SELECT "id", "slug", "region_id", "name_ko", "program_type", "eligibility_json", "application_method", "application_url", "period_start", "period_end", "budget", "distribution_count", "source_url", "source_publication_date", "source_license", "last_seen", "status", "human_reviewed", "reviewer_id" FROM `support_programs`;--> statement-breakpoint
DROP TABLE `support_programs`;--> statement-breakpoint
ALTER TABLE `__new_support_programs` RENAME TO `support_programs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `support_programs_slug_unique` ON `support_programs` (`slug`);