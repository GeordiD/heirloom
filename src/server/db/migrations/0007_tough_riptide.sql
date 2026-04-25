CREATE TABLE "job" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_name" text NOT NULL,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "step" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"name" text NOT NULL,
	"input" json,
	"output" json,
	"error" json
);
--> statement-breakpoint
ALTER TABLE "step" ADD CONSTRAINT "step_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE no action ON UPDATE no action;