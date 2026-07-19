import { createClient } from '@supabase/supabase-js';

// آدرس پایه پروژه (بدون بخش‌های اضافی)
const supabaseUrl = 'https://mhbivyoxxflczseijrtk.supabase.co';

// کلید پابلیک تو
const supabaseAnonKey = 'sb_publishable__CF-FvCXIHdAF0rZnK8idA_9-6kMmzz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);