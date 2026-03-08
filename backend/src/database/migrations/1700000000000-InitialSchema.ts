import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── users ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "auth_provider_enum" AS ENUM ('local', 'google', 'apple', 'firebase')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"              UUID              NOT NULL DEFAULT gen_random_uuid(),
        "email"           VARCHAR           NOT NULL,
        "password_hash"   VARCHAR,
        "display_name"    VARCHAR           NOT NULL,
        "photo_url"       VARCHAR,
        "provider"        "auth_provider_enum" NOT NULL DEFAULT 'local',
        "provider_id"     VARCHAR,
        "fcm_token"       VARCHAR,
        "location_lat"    DOUBLE PRECISION,
        "location_lng"    DOUBLE PRECISION,
        "created_at"      TIMESTAMPTZ       NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMPTZ       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users"       PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // ── dogs  ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "dogs" (
        "id"          UUID      NOT NULL DEFAULT gen_random_uuid(),
        "owner_id"    UUID      NOT NULL,
        "name"        VARCHAR   NOT NULL,
        "breed"       VARCHAR,
        "age_months"  INT,
        "photo_url"   VARCHAR,
        "bio"         TEXT,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dogs"       PRIMARY KEY ("id"),
        CONSTRAINT "FK_dogs_owner" FOREIGN KEY ("owner_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ── sessions ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
        "user_id"     UUID        NOT NULL,
        "token_hash"  VARCHAR(64) NOT NULL,
        "expires_at"  TIMESTAMPTZ NOT NULL,
        "ip_address"  VARCHAR(45),
        "user_agent"  TEXT,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions"            PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sessions_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_sessions_user"       FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ── walks ─────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "walk_status_enum" AS ENUM ('pending', 'active', 'completed', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE "walks" (
        "id"                  UUID              NOT NULL DEFAULT gen_random_uuid(),
        "host_id"             UUID              NOT NULL,
        "title"               VARCHAR           NOT NULL,
        "description"         TEXT,
        "status"              "walk_status_enum" NOT NULL DEFAULT 'pending',
        "scheduled_at"        TIMESTAMPTZ       NOT NULL,
        "max_participants"    INT               NOT NULL DEFAULT 10,
        "meeting_lat"         DOUBLE PRECISION,
        "meeting_lng"         DOUBLE PRECISION,
        "meeting_address"     VARCHAR,
        "category"            VARCHAR,
        "created_at"          TIMESTAMPTZ       NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMPTZ       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_walks"      PRIMARY KEY ("id"),
        CONSTRAINT "FK_walks_host" FOREIGN KEY ("host_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "walk_participants" (
        "walk_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        CONSTRAINT "PK_walk_participants" PRIMARY KEY ("walk_id", "user_id"),
        CONSTRAINT "FK_wp_walk" FOREIGN KEY ("walk_id") REFERENCES "walks"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wp_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ── messages ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id"          UUID      NOT NULL DEFAULT gen_random_uuid(),
        "walk_id"     UUID      NOT NULL,
        "sender_id"   UUID      NOT NULL,
        "content"     TEXT      NOT NULL,
        "type"        VARCHAR   NOT NULL DEFAULT 'text',
        "sent_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages"       PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_walk"  FOREIGN KEY ("walk_id")
          REFERENCES "walks"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_sender" FOREIGN KEY ("sender_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ── indexes ───────────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE INDEX "IDX_dogs_owner"        ON "dogs"("owner_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_walks_host"        ON "walks"("host_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_walks_scheduled"   ON "walks"("scheduled_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_walks_status"      ON "walks"("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_walk"     ON "messages"("walk_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_sent_at"  ON "messages"("sent_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_sessions_user"     ON "sessions"("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_sessions_expires"  ON "sessions"("expires_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sessions_expires"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sessions_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_sent_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_walk"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_walks_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_walks_scheduled"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_walks_host"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_dogs_owner"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "walk_participants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "walks"`);
    await queryRunner.query(`DROP TYPE  IF EXISTS "walk_status_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dogs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE  IF EXISTS "auth_provider_enum"`);
  }
}
