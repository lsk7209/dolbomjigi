CREATE TABLE `blog_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title_ko` text NOT NULL,
	`summary` text,
	`cover_image_url` text,
	`body_md` text NOT NULL,
	`category` text DEFAULT 'care_info' NOT NULL,
	`target_persona` text DEFAULT 'all' NOT NULL,
	`tags_json` text,
	`reading_time_minutes` integer,
	`author_id` integer,
	`published_at` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);