-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT CHECK (role IN ('husband', 'wife')),
  partner_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create photos table for gallery
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video call sessions
CREATE TABLE public.video_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT false,
  participants JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create watch party sessions
CREATE TABLE public.watch_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  title TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('netflix', 'youtube', 'library')),
  content_url TEXT,
  current_position INTEGER DEFAULT 0,
  is_playing BOOLEAN DEFAULT false,
  participants JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create birthday wishes
CREATE TABLE public.birthday_wishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game sessions
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  game_type TEXT NOT NULL,
  game_state JSONB DEFAULT '{}',
  participants JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birthday_wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for photos
CREATE POLICY "Photos are viewable by everyone" 
ON public.photos FOR SELECT USING (true);

CREATE POLICY "Users can insert their own photos" 
ON public.photos FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos" 
ON public.photos FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos" 
ON public.photos FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for video sessions
CREATE POLICY "Video sessions are viewable by participants" 
ON public.video_sessions FOR SELECT USING (true);

CREATE POLICY "Users can create video sessions" 
ON public.video_sessions FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their sessions" 
ON public.video_sessions FOR UPDATE USING (auth.uid() = host_id);

-- Create RLS policies for watch sessions
CREATE POLICY "Watch sessions are viewable by everyone" 
ON public.watch_sessions FOR SELECT USING (true);

CREATE POLICY "Users can create watch sessions" 
ON public.watch_sessions FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their sessions" 
ON public.watch_sessions FOR UPDATE USING (auth.uid() = host_id);

-- Create RLS policies for birthday wishes
CREATE POLICY "Approved wishes are viewable by everyone" 
ON public.birthday_wishes FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can insert birthday wishes" 
ON public.birthday_wishes FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own wishes" 
ON public.birthday_wishes FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for game sessions
CREATE POLICY "Game sessions are viewable by everyone" 
ON public.game_sessions FOR SELECT USING (true);

CREATE POLICY "Users can create game sessions" 
ON public.game_sessions FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their sessions" 
ON public.game_sessions FOR UPDATE USING (auth.uid() = host_id);

-- Create storage policies
CREATE POLICY "Photos are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Users can upload photos" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own photos" 
ON storage.objects FOR UPDATE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos" 
ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for all tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.photos REPLICA IDENTITY FULL;
ALTER TABLE public.video_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.watch_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.birthday_wishes REPLICA IDENTITY FULL;
ALTER TABLE public.game_sessions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.birthday_wishes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON public.photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_sessions_updated_at
  BEFORE UPDATE ON public.video_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_watch_sessions_updated_at
  BEFORE UPDATE ON public.watch_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();