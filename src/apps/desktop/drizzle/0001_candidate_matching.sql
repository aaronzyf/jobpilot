ALTER TABLE `candidates` ADD `enabled` integer DEFAULT true NOT NULL;
--> statement-breakpoint
CREATE TABLE `match_runs` (
	`candidate_id` text PRIMARY KEY NOT NULL,
	`scanned` integer DEFAULT 0 NOT NULL,
	`added` integer DEFAULT 0 NOT NULL,
	`at` integer NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade
);
