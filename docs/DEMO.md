# ReviewIt — demo script

A short walkthrough for showing the app without a backend. The demo runs against
the local mock fixture and needs only the Angular dev server.

```bash
cd frontend
npm install
npm start
```

Open <http://localhost:5173>. If Supabase values are blank (the default), the
app starts in demo mode. Maria is the signed-in demo user (Admin) and owns
eleven reviews.

## Script (3–4 minutes)

1. **Feed.** Show the editorial cards, generated covers and the centered search.
   Scroll to the bottom twice to trigger infinite loading; the end state appears
   after the seeded 36 reviews.
2. **Filter and sort.** Open the filter popover, choose *Filmes* and a genre, and
   apply. Change the sort to *Populares* and show that the URL records the query
   and survives a reload.
3. **Search.** Search for a word from a review, then clear it. Point out the
   empty state when nothing matches.
4. **Detail.** Open a review. Like it and watch the counter update optimistically;
   add a comment and show it at the end of the (oldest-first) list.
5. **Profile.** Open Maria's avatar → *Perfil*. Show *Suas reviews* and the author
   timeline; edit the display name and save.
6. **Notifications.** Open the notification page, mark one as read, and use
   *Carregar mais notificações* to page through the list.
7. **Moderation.** Open the avatar menu → *Moderação* (Maria is Admin). Filter by
   *Pendentes*, resolve a report, and show the success toast.
8. **Resilience.** Resize to a narrow viewport (320 px) and show the layout; toggle
   the browser offline to show the global banner, then reconnect.

## Real mode

To exercise the real API and Supabase Auth, follow
[`DEPLOYMENT.md`](./DEPLOYMENT.md). Locally, the fastest path is to set the
Supabase URL/anon key in `frontend/src/environments/environment.development.ts`,
run the backend with `.env.properties`, and open `/login`.
