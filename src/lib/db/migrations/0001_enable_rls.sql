-- Enable RLS on all tables
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tap_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "card_status_events" ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON "profiles" FOR SELECT 
  USING (is_published = true AND archived_at IS NULL);

CREATE POLICY "Users can view own profile" 
  ON "profiles" FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR (is_published = true AND archived_at IS NULL));

CREATE POLICY "Users can insert own profile" 
  ON "profiles" FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" 
  ON "profiles" FOR UPDATE TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own profile" 
  ON "profiles" FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- Cards Policies
CREATE POLICY "Public active cards are viewable by everyone" 
  ON "cards" FOR SELECT 
  USING (status = 'active');

CREATE POLICY "Users can view own cards" 
  ON "cards" FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR status = 'active');

CREATE POLICY "Users can update own cards" 
  ON "cards" FOR UPDATE TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- Tap Events Policies
CREATE POLICY "Anyone can insert tap events" 
  ON "tap_events" FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view own tap events" 
  ON "tap_events" FOR SELECT TO authenticated 
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Connections Policies
CREATE POLICY "Users can view own connections" 
  ON "connections" FOR SELECT TO authenticated 
  USING (viewer_user_id = auth.uid());

CREATE POLICY "Users can insert own connections" 
  ON "connections" FOR INSERT TO authenticated 
  WITH CHECK (viewer_user_id = auth.uid());

CREATE POLICY "Users can delete own connections" 
  ON "connections" FOR DELETE TO authenticated 
  USING (viewer_user_id = auth.uid());

-- Users Policies
CREATE POLICY "Users can view own user record" 
  ON "users" FOR SELECT TO authenticated 
  USING (id = auth.uid());

-- Card Status Events Policies
CREATE POLICY "Users can view own card status events" 
  ON "card_status_events" FOR SELECT TO authenticated 
  USING (user_id = auth.uid());