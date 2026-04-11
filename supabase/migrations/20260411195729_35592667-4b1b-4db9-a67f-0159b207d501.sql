
-- Allow public read of profiles for leaderboard (only display_name, points, avatar_url visible via select)
DROP POLICY IF EXISTS "Profiles are publicly viewable for leaderboard" ON public.profiles;
CREATE POLICY "Profiles are publicly viewable for leaderboard"
ON public.profiles
FOR SELECT
USING (true);

-- Drop old restrictive select policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
