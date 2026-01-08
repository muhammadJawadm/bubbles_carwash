# Supabase Database Setup for Authentication

This file contains the SQL queries you need to run in your Supabase SQL Editor to set up the authentication system.

## Step 1: Create the admin-user Table

Run this SQL query in your Supabase SQL Editor (located at: https://app.supabase.com/project/YOUR_PROJECT/sql/new):

```sql
-- Create admin-user table
CREATE TABLE IF NOT EXISTS "admin-user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Create index for faster lookups
CREATE INDEX idx_admin_user_user_id ON "admin-user"(user_id);
CREATE INDEX idx_admin_user_email ON "admin-user"(email);

-- Enable Row Level Security
ALTER TABLE "admin-user" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read their own admin record
CREATE POLICY "Users can view own admin record"
  ON "admin-user"
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for service role to manage admin users
CREATE POLICY "Service role can manage admin users"
  ON "admin-user"
  FOR ALL
  USING (auth.role() = 'service_role');
```

## Step 2: Add Your First Admin User

After creating the table, you need to add admin users. Here are two methods:

### Method A: Add Existing User by Email

If you already have a user in Supabase Auth (created through the Authentication tab), use this:

```sql
-- Replace 'user@example.com' with the actual email
INSERT INTO "admin-user" (user_id, email, full_name, role)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name',
  'admin'
FROM auth.users
WHERE email = 'user@example.com';
```

### Method B: Add User by UUID

If you know the user's UUID from the auth.users table:

```sql
-- Replace with actual values
INSERT INTO "admin-user" (user_id, email, full_name, role)
VALUES (
  'paste-user-uuid-here',
  'user@example.com',
  'John Doe',
  'admin'
);
```

## Step 3: Verify the Setup

Check that your admin user was added correctly:

```sql
-- View all admin users
SELECT * FROM "admin-user";

-- Check specific user
SELECT * FROM "admin-user" WHERE email = 'user@example.com';
```

## Creating Additional Admin Users

To add more admin users in the future, first create the user in Supabase Auth (through the Authentication tab or by having them sign up), then run:

```sql
INSERT INTO "admin-user" (user_id, email, full_name, role)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name',
  'admin'
FROM auth.users
WHERE email = 'new-admin@example.com';
```

## Deactivating an Admin User

To deactivate an admin user without deleting them:

```sql
UPDATE "admin-user"
SET is_active = false
WHERE email = 'user@example.com';
```

To reactivate:

```sql
UPDATE "admin-user"
SET is_active = true
WHERE email = 'user@example.com';
```

## Removing an Admin User

To completely remove admin access:

```sql
DELETE FROM "admin-user"
WHERE email = 'user@example.com';
```

Note: This doesn't delete the user from Supabase Auth, only removes their admin access.

## Important Notes

1. **Order of Operations**: You must create a user in Supabase Auth FIRST, then add them to the admin-user table.
   
2. **Finding User UUIDs**: You can find user UUIDs in the Supabase dashboard:
   - Go to Authentication → Users
   - Click on a user to see their UUID

3. **Testing**: After adding yourself as an admin user, try logging in with your email and password to test the system.

4. **Security**: The Row Level Security (RLS) policies ensure that users can only view their own admin record, maintaining security.
