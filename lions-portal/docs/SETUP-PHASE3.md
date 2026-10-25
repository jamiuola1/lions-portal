# Phase 3 setup (accounts and membership approval)

1. Create a Supabase project. Run `supabase/migrations/0001_*.sql`, then `0002_*.sql` in the SQL editor (or `supabase db push`).
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key and service-role key. The service-role key stays server-side.
3. Auth > Providers: enable Email (turn on "Confirm email") and Google. In Google Cloud Console create an OAuth client (Web). Authorized redirect URI: the callback URL shown in the Supabase Google provider settings. Paste the client ID and secret into Supabase.
4. Auth > URL configuration: set Site URL to your site, and add `<site>/auth/callback` to the redirect allow-list (also `http://localhost:3000/auth/callback` for development).
5. Register the first account on the site, then make it an admin in the SQL editor:
   `insert into user_roles (user_id, role_id) select '<USER_UUID>', id from roles where key = 'admin';`
6. Still to do: rate limiting on login and registration, password reset page, email verification wording, avatar upload.
