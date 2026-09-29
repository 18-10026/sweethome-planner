import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ujwxvyfhgnzaskuktaaf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqd3h2eWZoZ256YXNrdWt0YWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MzA5NTgsImV4cCI6MjEwMzAwNjk1OH0.7auvJWKgoq5-_-w-FffT7q1eKOZHnqxLfFdWAaA0HE4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);