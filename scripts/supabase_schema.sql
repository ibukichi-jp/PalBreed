-- 1. Profiles Table (Integrated with Supabase Auth)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Owned Pals Table
CREATE TABLE public.user_pals (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pal_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_pal UNIQUE (user_id, pal_name)
);

-- 3. User Breeding Recipes Memo Table (Store user's custom breeding experiences with mutation flag)
CREATE TABLE public.breed_recipes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_a_name VARCHAR(50) NOT NULL,
    parent_b_name VARCHAR(50) NOT NULL,
    child_name VARCHAR(50) NOT NULL,
    is_mutation BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_recipe UNIQUE (user_id, parent_a_name, parent_b_name, child_name, is_mutation)
);

-- Indexes for Query Performance
CREATE INDEX idx_user_pals_user_id ON public.user_pals(user_id);
CREATE INDEX idx_breed_recipes_user_id ON public.breed_recipes(user_id);
CREATE INDEX idx_breed_recipes_child ON public.breed_recipes(child_name);
CREATE INDEX idx_breed_recipes_parent_a ON public.breed_recipes(parent_a_name);
CREATE INDEX idx_breed_recipes_parent_b ON public.breed_recipes(parent_b_name);

-- Enable Row Level Security (RLS) and Create Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breed_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to manage their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Trigger to automatically create a profile record when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (new.id)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS for user_pals
CREATE POLICY "Allow users to select their own owned pals" ON public.user_pals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own owned pals" ON public.user_pals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own owned pals" ON public.user_pals
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for breed_recipes (User's custom recipes)
CREATE POLICY "Allow users to select their own breeding recipes" ON public.breed_recipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own breeding recipes" ON public.breed_recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own breeding recipes" ON public.breed_recipes
    FOR DELETE USING (auth.uid() = user_id);
