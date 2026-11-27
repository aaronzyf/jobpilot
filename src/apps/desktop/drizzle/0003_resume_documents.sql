CREATE TABLE `resume_documents` (
	`candidate_id` text PRIMARY KEY NOT NULL,
	`profile` text DEFAULT '' NOT NULL,
	`intent` text DEFAULT '' NOT NULL,
	`skills` text NOT NULL,
	`contact` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_resume_docs_candidate` ON `resume_documents` (`candidate_id`);
--> statement-breakpoint
CREATE TABLE `resume_items` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`period` text DEFAULT '' NOT NULL,
	`stack` text DEFAULT '' NOT NULL,
	`highlights` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_resume_items_candidate` ON `resume_items` (`candidate_id`,`position`);
