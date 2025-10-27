-- Create UserInvitation table
CREATE TABLE IF NOT EXISTS "user_invitations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "invited_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token" TEXT UNIQUE NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "accepted_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create AuthenticationError table
CREATE TABLE IF NOT EXISTS "authentication_errors" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "error_code" TEXT NOT NULL,
    "user_message" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "context" JSONB,
    "resolved" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create Permission table
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "conditions" JSONB,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_user_invitations_email" ON "user_invitations"("email");
CREATE INDEX IF NOT EXISTS "idx_user_invitations_token" ON "user_invitations"("token");
CREATE INDEX IF NOT EXISTS "idx_user_invitations_expires_at" ON "user_invitations"("expires_at");
CREATE INDEX IF NOT EXISTS "idx_authentication_errors_user_id" ON "authentication_errors"("user_id");
CREATE INDEX IF NOT EXISTS "idx_authentication_errors_created_at" ON "authentication_errors"("created_at");
CREATE INDEX IF NOT EXISTS "idx_permissions_role" ON "permissions"("role");
CREATE INDEX IF NOT EXISTS "idx_permissions_resource" ON "permissions"("resource");

-- Add RLS policies
ALTER TABLE "user_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "authentication_errors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_invitations
CREATE POLICY "Users can view their own invitations" ON "user_invitations"
    FOR SELECT USING (invited_by = auth.uid());

CREATE POLICY "Admins can view all invitations" ON "user_invitations"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "users" 
            WHERE "id" = auth.uid() AND "role" = 'ADMIN'
        )
    );

CREATE POLICY "Admins can create invitations" ON "user_invitations"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "users" 
            WHERE "id" = auth.uid() AND "role" = 'ADMIN'
        )
    );

-- RLS policies for authentication_errors
CREATE POLICY "Users can view their own errors" ON "authentication_errors"
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all errors" ON "authentication_errors"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "users" 
            WHERE "id" = auth.uid() AND "role" = 'ADMIN'
        )
    );

CREATE POLICY "System can insert errors" ON "authentication_errors"
    FOR INSERT WITH CHECK (true);

-- RLS policies for permissions
CREATE POLICY "Everyone can view permissions" ON "permissions"
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage permissions" ON "permissions"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "users" 
            WHERE "id" = auth.uid() AND "role" = 'ADMIN'
        )
    );

-- Create function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
    DELETE FROM "user_invitations" 
    WHERE "expires_at" < NOW() AND "accepted_at" IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user last login
CREATE OR REPLACE FUNCTION update_user_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "users" 
    SET "lastLogin" = NOW(), "updatedAt" = NOW()
    WHERE "id" = NEW."id";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user login updates
CREATE TRIGGER trigger_update_user_last_login
    AFTER UPDATE ON "users"
    FOR EACH ROW
    WHEN (OLD."lastLogin" IS DISTINCT FROM NEW."lastLogin")
    EXECUTE FUNCTION update_user_last_login();

-- Insert default permissions
INSERT INTO "permissions" ("resource", "action", "role", "conditions") VALUES
    ('users', 'read', 'USER', '{"own_only": true}'),
    ('users', 'write', 'USER', '{"own_only": true}'),
    ('users', 'read', 'ADMIN', '{}'),
    ('users', 'write', 'ADMIN', '{}'),
    ('users', 'delete', 'ADMIN', '{}'),
    ('users', 'admin', 'ADMIN', '{}'),
    ('players', 'read', 'GUEST', '{}'),
    ('players', 'read', 'USER', '{}'),
    ('players', 'write', 'USER', '{}'),
    ('players', 'read', 'ADMIN', '{}'),
    ('players', 'write', 'ADMIN', '{}'),
    ('players', 'delete', 'ADMIN', '{}'),
    ('players', 'admin', 'ADMIN', '{}'),
    ('clubs', 'read', 'GUEST', '{}'),
    ('clubs', 'read', 'USER', '{}'),
    ('clubs', 'write', 'USER', '{}'),
    ('clubs', 'read', 'ADMIN', '{}'),
    ('clubs', 'write', 'ADMIN', '{}'),
    ('clubs', 'delete', 'ADMIN', '{}'),
    ('clubs', 'admin', 'ADMIN', '{}'),
    ('tournaments', 'read', 'GUEST', '{}'),
    ('tournaments', 'read', 'USER', '{}'),
    ('tournaments', 'write', 'USER', '{}'),
    ('tournaments', 'read', 'ADMIN', '{}'),
    ('tournaments', 'write', 'ADMIN', '{}'),
    ('tournaments', 'delete', 'ADMIN', '{}'),
    ('tournaments', 'admin', 'ADMIN', '{}'),
    ('games', 'read', 'GUEST', '{}'),
    ('games', 'read', 'USER', '{}'),
    ('games', 'write', 'USER', '{}'),
    ('games', 'read', 'ADMIN', '{}'),
    ('games', 'write', 'ADMIN', '{}'),
    ('games', 'delete', 'ADMIN', '{}'),
    ('games', 'admin', 'ADMIN', '{}'),
    ('analytics', 'read', 'USER', '{}'),
    ('analytics', 'write', 'ADMIN', '{}'),
    ('analytics', 'admin', 'ADMIN', '{}'),
    ('admin', 'read', 'ADMIN', '{}'),
    ('admin', 'write', 'ADMIN', '{}'),
    ('admin', 'delete', 'ADMIN', '{}'),
    ('admin', 'admin', 'ADMIN', '{}');
