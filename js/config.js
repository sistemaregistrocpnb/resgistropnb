if (!window.supabaseClient) {
  if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase SDK no cargado. Verifica tu conexión.');
  } else {
    const SUPABASE_CONFIG = {
      URL: 'https://aonfdszenkihbmhyyfgr.supabase.co',
      ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbmZkc3plbmtpaGJtaHl5ZmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3Njc1NjcsImV4cCI6MjA5NTM0MzU2N30.txJtXdXDamTGIBRpSH90KBw0yR2C-7XJgCJSo8H3rsI'
    };
    window.supabaseClient = window.supabase.createClient(
      SUPABASE_CONFIG.URL, 
      SUPABASE_CONFIG.ANON_KEY
    );
  }
}







