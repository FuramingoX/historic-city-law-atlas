CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`law_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`label` text NOT NULL,
	`chapter` text,
	`content` text NOT NULL,
	FOREIGN KEY (`law_id`) REFERENCES `laws`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_articles_law_ordinal_unique` ON `articles` (`law_id`,`ordinal`);--> statement-breakpoint
CREATE INDEX `idx_articles_law_id` ON `articles` (`law_id`);--> statement-breakpoint
CREATE TABLE `codings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`law_id` text NOT NULL,
	`indicator_code` text NOT NULL,
	`presence` integer DEFAULT 0 NOT NULL,
	`strength` integer DEFAULT 0 NOT NULL,
	`confidence` text DEFAULT 'low' NOT NULL,
	`review_status` text DEFAULT 'machine_draft' NOT NULL,
	`coding_note` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`law_id`) REFERENCES `laws`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`indicator_code`) REFERENCES `indicators`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_codings_law_indicator_unique` ON `codings` (`law_id`,`indicator_code`);--> statement-breakpoint
CREATE INDEX `idx_codings_indicator_strength` ON `codings` (`indicator_code`,`strength`);--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`coding_id` integer NOT NULL,
	`article_id` integer,
	`article_label` text NOT NULL,
	`excerpt` text NOT NULL,
	`relevance` text DEFAULT 'supporting' NOT NULL,
	FOREIGN KEY (`coding_id`) REFERENCES `codings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_evidence_coding_id` ON `evidence` (`coding_id`);--> statement-breakpoint
CREATE TABLE `indicators` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`definition` text NOT NULL,
	`rubric_json` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_indicators_sort_order_unique` ON `indicators` (`sort_order`);--> statement-breakpoint
CREATE TABLE `laws` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`jurisdiction` text NOT NULL,
	`version_year` integer,
	`version_type` text DEFAULT 'original' NOT NULL,
	`document_type` text DEFAULT 'regulation' NOT NULL,
	`source_file` text NOT NULL,
	`source_bytes` integer DEFAULT 0 NOT NULL,
	`extraction_status` text DEFAULT 'pending' NOT NULL,
	`review_status` text DEFAULT 'machine_draft' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_laws_jurisdiction` ON `laws` (`jurisdiction`);--> statement-breakpoint
CREATE INDEX `idx_laws_version_year` ON `laws` (`version_year`);--> statement-breakpoint
CREATE INDEX `idx_laws_review_status` ON `laws` (`review_status`);--> statement-breakpoint
CREATE TABLE `review_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`reviewer` text NOT NULL,
	`action` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_review_logs_entity` ON `review_logs` (`entity_type`,`entity_id`);