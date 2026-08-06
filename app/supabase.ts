import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://wsvtdueenwlzdurwndvz.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_whPNnxZJMYZKOWAodukEbA_ZoADQm0R";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
