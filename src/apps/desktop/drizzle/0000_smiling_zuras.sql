CREATE TABLE `application_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`seq` integer NOT NULL,
	`at` integer NOT NULL,
	`label` text NOT NULL,
	`detail` text NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_app_logs_app` ON `application_logs` (`application_id`,`seq`);--> statement-breakpoint
CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`candidate_id` text NOT NULL,
	`channel` text NOT NULL,
	`status` text NOT NULL,
	`submitted_at` integer NOT NULL,
	`score` integer NOT NULL,
	`resume_snapshot` text NOT NULL,
	`to_email` text,
	`subject` text,
	`body` text,
	`subject_rule_ok` integer,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_apps_candidate` ON `applications` (`candidate_id`);--> statement-breakpoint
CREATE INDEX `idx_apps_status` ON `applications` (`status`);--> statement-breakpoint
CREATE INDEX `idx_apps_submitted` ON `applications` (`submitted_at`);--> statement-breakpoint
CREATE TABLE `candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`headline` text NOT NULL,
	`years` integer NOT NULL,
	`location` text NOT NULL,
	`hue` integer NOT NULL,
	`email` text NOT NULL,
	`languages` text NOT NULL,
	`note` text NOT NULL,
	`threshold_auto` integer NOT NULL,
	`threshold_reject` integer NOT NULL,
	`daily_cap` integer NOT NULL,
	`resume_file` text NOT NULL,
	`resume_updated_at` integer NOT NULL,
	`resume_pages` integer NOT NULL,
	`smtp_host` text,
	`smtp_port` integer,
	`smtp_verified` integer DEFAULT false NOT NULL,
	`fact_projects` integer DEFAULT 0 NOT NULL,
	`fact_experiences` integer DEFAULT 0 NOT NULL,
	`fact_skills` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`candidate_id` text NOT NULL,
	`source_id` text NOT NULL,
	`peer_name` text NOT NULL,
	`peer_title` text NOT NULL,
	`stage` text NOT NULL,
	`last_message_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_conv_candidate` ON `conversations` (`candidate_id`);--> statement-breakpoint
CREATE TABLE `interview_interviewers` (
	`id` text PRIMARY KEY NOT NULL,
	`interview_id` text NOT NULL,
	`seq` integer NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	FOREIGN KEY (`interview_id`) REFERENCES `interviews`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_itv_people` ON `interview_interviewers` (`interview_id`,`seq`);--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`candidate_id` text NOT NULL,
	`source_id` text NOT NULL,
	`conversation_id` text,
	`round` text NOT NULL,
	`round_index` integer NOT NULL,
	`round_total` integer NOT NULL,
	`status` text NOT NULL,
	`starts_at` integer NOT NULL,
	`duration_min` integer NOT NULL,
	`format` text NOT NULL,
	`place` text NOT NULL,
	`invited_at` integer NOT NULL,
	`reply_by` integer,
	`note` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_itv_starts` ON `interviews` (`starts_at`);--> statement-breakpoint
CREATE INDEX `idx_itv_candidate` ON `interviews` (`candidate_id`);--> statement-breakpoint
CREATE TABLE `job_bookmarks` (
	`job_id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `job_scores` (
	`job_id` text NOT NULL,
	`candidate_id` text NOT NULL,
	`score` integer NOT NULL,
	`verdict` text NOT NULL,
	`reasons` text NOT NULL,
	`gaps` text NOT NULL,
	`model` text DEFAULT '' NOT NULL,
	`scored_at` integer NOT NULL,
	PRIMARY KEY(`job_id`, `candidate_id`),
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_scores_candidate` ON `job_scores` (`candidate_id`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`external_id` text,
	`company` text NOT NULL,
	`company_hue` integer DEFAULT 220 NOT NULL,
	`title` text NOT NULL,
	`city` text NOT NULL,
	`country` text NOT NULL,
	`work_mode` text NOT NULL,
	`employment_type` text NOT NULL,
	`salary_text` text NOT NULL,
	`salary_min` integer,
	`salary_max` integer,
	`salary_currency` text,
	`region` text NOT NULL,
	`submit_channel` text NOT NULL,
	`posted_at` integer NOT NULL,
	`discovered_at` integer NOT NULL,
	`tags` text NOT NULL,
	`jd_summary` text NOT NULL,
	`responsibilities` text NOT NULL,
	`requirements` text NOT NULL,
	`contact_email` text,
	`subject_rule_raw` text,
	`subject_rule_template` text,
	`subject_rule_example` text,
	`company_size` text DEFAULT '' NOT NULL,
	`company_stage` text DEFAULT '' NOT NULL,
	`company_industry` text DEFAULT '' NOT NULL,
	`company_visa` integer DEFAULT false NOT NULL,
	`applicants` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_jobs_posted_at` ON `jobs` (`posted_at`);--> statement-breakpoint
CREATE INDEX `idx_jobs_source` ON `jobs` (`source_id`);--> statement-breakpoint
CREATE INDEX `idx_jobs_company` ON `jobs` (`company`);--> statement-breakpoint
CREATE TABLE `llm_usage` (
	`scene` text PRIMARY KEY NOT NULL,
	`model` text NOT NULL,
	`calls` integer DEFAULT 0 NOT NULL,
	`cost_cents` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`seq` integer NOT NULL,
	`at` integer NOT NULL,
	`dir` text NOT NULL,
	`text` text NOT NULL,
	`read_at` integer,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_msg_conv` ON `messages` (`conversation_id`,`seq`);--> statement-breakpoint
CREATE TABLE `saved_views` (
	`id` text PRIMARY KEY NOT NULL,
	`name_key` text NOT NULL,
	`filter` text NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`region` text NOT NULL,
	`interval_min` integer NOT NULL,
	`last_run_at` integer,
	`next_run_at` integer,
	`found_count` integer DEFAULT 0 NOT NULL,
	`state` text DEFAULT 'ok' NOT NULL,
	`auth` text DEFAULT 'none' NOT NULL,
	`account` text DEFAULT '' NOT NULL,
	`capabilities` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL
);
