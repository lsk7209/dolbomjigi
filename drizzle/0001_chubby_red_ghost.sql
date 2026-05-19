CREATE TABLE `info_articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title_ko` text NOT NULL,
	`summary` text,
	`body_html` text NOT NULL,
	`topic_category` text,
	`related_robots_json` text,
	`author_id` integer,
	`published_at` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `info_articles_slug_unique` ON `info_articles` (`slug`);