const supabase = supabase.createClient(
  "https://nppwibcwohfzvxxvtnzb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcHdpYmN3b2hmenZ4eHZ0bnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzE2NzYsImV4cCI6MjA4MDA0NzY3Nn0.3oO2qOE5WPwUWZ1Y5UxESo-1HI_JL_DYLebueXwesnc",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

async function getCurrentUser() {
  // SAFE version — no more AuthSessionMissingError
  const { data } = await supabase.auth.getSession();
  return data?.session?.user ?? null;
}

// Fix: remove old broken getUser() calls
(async () => {
  const user = await getCurrentUser();
  console.log("User:", user);
})();
