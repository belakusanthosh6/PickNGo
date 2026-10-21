
const SUPABASE_URL =
    "https://uvtnvqsqwmnbqonkyaqn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_fvPYrTJuNLWW-Z8oB3yoGQ_aKSL9oyd";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
