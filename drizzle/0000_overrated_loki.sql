CREATE TABLE `authors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`credentials_json` text,
	`bio_short` text,
	`avatar_url` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `authors_slug_unique` ON `authors` (`slug`);--> statement-breakpoint
CREATE TABLE `bizinfo_programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pblanc_id` text NOT NULL,
	`title` text NOT NULL,
	`dept` text,
	`region` text,
	`field` text,
	`start_date` integer,
	`end_date` integer,
	`detail_url` text,
	`matched_keywords` text,
	`raw_json` text,
	`fetched_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bizinfo_programs_pblanc_id_unique` ON `bizinfo_programs` (`pblanc_id`);--> statement-breakpoint
CREATE TABLE `comparisons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`robot_a_id` integer NOT NULL,
	`robot_b_id` integer NOT NULL,
	`title_ko` text NOT NULL,
	`summary` text,
	`pros_a_json` text,
	`pros_b_json` text,
	`recommended_persona` text,
	`author_id` integer,
	`reviewer_id` integer,
	`published_at` integer,
	FOREIGN KEY (`robot_a_id`) REFERENCES `robots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`robot_b_id`) REFERENCES `robots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `comparisons_slug_unique` ON `comparisons` (`slug`);--> statement-breakpoint
CREATE TABLE `guides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`persona_group` text NOT NULL,
	`scenario` text,
	`title_ko` text NOT NULL,
	`body_md` text NOT NULL,
	`recommended_robots_json` text,
	`author_id` integer,
	`reviewer_id` integer,
	`published_at` integer,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guides_slug_unique` ON `guides` (`slug`);--> statement-breakpoint
CREATE TABLE `program_robots` (
	`program_id` integer NOT NULL,
	`robot_id` integer NOT NULL,
	PRIMARY KEY(`program_id`, `robot_id`),
	FOREIGN KEY (`program_id`) REFERENCES `support_programs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`robot_id`) REFERENCES `robots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `regions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sido_code` text NOT NULL,
	`sigungu_code` text,
	`sido_name` text NOT NULL,
	`sigungu_name` text,
	`level` text NOT NULL,
	`slug` text NOT NULL,
	`population_65plus` integer,
	`single_elderly_households` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regions_slug_unique` ON `regions` (`slug`);--> statement-breakpoint
CREATE TABLE `research_studies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`authors_list` text NOT NULL,
	`journal` text,
	`year` integer,
	`doi` text,
	`url` text,
	`summary_ko` text,
	`cited_robots_json` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `research_studies_slug_unique` ON `research_studies` (`slug`);--> statement-breakpoint
CREATE TABLE `robot_region_availability` (
	`robot_id` integer NOT NULL,
	`region_id` integer NOT NULL,
	`via_program_id` integer,
	`distribution_count` integer,
	PRIMARY KEY(`robot_id`, `region_id`),
	FOREIGN KEY (`robot_id`) REFERENCES `robots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`via_program_id`) REFERENCES `support_programs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `robots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name_ko` text NOT NULL,
	`name_en` text,
	`manufacturer` text NOT NULL,
	`manufacturer_country` text NOT NULL,
	`category` text NOT NULL,
	`korea_market` integer DEFAULT false NOT NULL,
	`price_min` integer,
	`price_max` integer,
	`subscription_monthly` integer,
	`rental_available` integer DEFAULT false NOT NULL,
	`release_year` integer,
	`manufacturer_url` text,
	`description_short` text,
	`features_json` text,
	`hero_image_url` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `robots_slug_unique` ON `robots` (`slug`);--> statement-breakpoint
CREATE TABLE `support_programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`region_id` integer NOT NULL,
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
CREATE UNIQUE INDEX `support_programs_slug_unique` ON `support_programs` (`slug`);