
CREATE OR REPLACE FUNCTION public.check_challenge_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  completed_count INT;
  milestone_title TEXT;
  milestone_title_ar TEXT;
  milestone_icon TEXT;
  bonus_points INT;
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT COUNT(*) INTO completed_count
    FROM public.user_challenges
    WHERE user_id = NEW.user_id AND status = 'completed';

    UPDATE public.profiles
    SET points = points + NEW.reward_points,
        updated_at = now()
    WHERE user_id = NEW.user_id;

    IF completed_count = 10 THEN
      milestone_title := 'Eco-Friendly';
      milestone_title_ar := 'صديق للبيئة 🌿';
      milestone_icon := '🌿';
      bonus_points := 100;
    ELSIF completed_count = 30 THEN
      milestone_title := 'Saving Expert';
      milestone_title_ar := 'خبير توفير ⚡';
      milestone_icon := '⚡';
      bonus_points := 250;
    ELSIF completed_count = 40 THEN
      milestone_title := 'Energy Champion';
      milestone_title_ar := 'بطل الطاقة 🏆';
      milestone_icon := '🏆';
      bonus_points := 400;
    ELSIF completed_count = 60 THEN
      milestone_title := 'Saving Legend';
      milestone_title_ar := 'أسطورة التوفير 👑';
      milestone_icon := '👑';
      bonus_points := 600;
    END IF;

    IF milestone_title IS NOT NULL THEN
      INSERT INTO public.achievements (user_id, title, title_ar, icon, description)
      VALUES (NEW.user_id, milestone_title, milestone_title_ar, milestone_icon,
              'Completed ' || completed_count || ' challenges!')
      ON CONFLICT DO NOTHING;

      UPDATE public.profiles
      SET points = points + bonus_points, updated_at = now()
      WHERE user_id = NEW.user_id;

      INSERT INTO public.chat_messages (user_id, role, content)
      VALUES (NEW.user_id, 'assistant',
              '🎉🎊 مبروك! وصلت لإنجاز جديد: **' || milestone_title_ar || '**! +' || bonus_points || ' نقطة بونص! استمر كده يا بطل! 💪');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER check_challenge_milestones_trigger
AFTER INSERT OR UPDATE ON public.user_challenges
FOR EACH ROW
EXECUTE FUNCTION public.check_challenge_milestones();
