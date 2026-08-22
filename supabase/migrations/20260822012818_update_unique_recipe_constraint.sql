-- 既存の古いユニーク制約を削除
ALTER TABLE public.breed_recipes DROP CONSTRAINT IF EXISTS unique_user_recipe;

-- 新しい複合ユニーク制約を追加
ALTER TABLE public.breed_recipes ADD CONSTRAINT unique_user_recipe UNIQUE (user_id, parent_a_name, parent_b_name, child_name, is_mutation);
