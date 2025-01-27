CREATE TABLE `compounds` (
	`id` integer PRIMARY KEY NOT NULL,
	`smiles` text,
	`inchi` text,
	`molfile` text,
	`paper_id` integer NOT NULL,
	FOREIGN KEY (`paper_id`) REFERENCES `papers`(`id`) ON UPDATE no action ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `papers` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`authors` text NOT NULL,
	`year` integer NOT NULL,
	`journal` text,
	`volume` text,
	`pdf` blob
);
