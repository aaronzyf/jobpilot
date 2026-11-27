ALTER TABLE `candidates` ADD `pop3_host` text;
--> statement-breakpoint
ALTER TABLE `candidates` ADD `pop3_port` integer;
--> statement-breakpoint
ALTER TABLE `candidates` ADD `pop3_enabled` integer DEFAULT false NOT NULL;
