-- Create person table for storing people that can be assigned to items
CREATE TABLE IF NOT EXISTS "person" (
  "id" text PRIMARY KEY NOT NULL,
  "board_id" text NOT NULL,
  "name" text NOT NULL,
  "email" text,
  "color" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp NOT NULL,
  CONSTRAINT "person_board_id_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "board"("id") ON DELETE CASCADE
);

-- Create index on board_id for faster queries
CREATE INDEX IF NOT EXISTS "person_board_id_idx" ON "person" ("board_id");

