# Good Company

A personal social website for sharing YouTube videos, jokes, and conversations with friends. Rebuilt from the former Comedy Club React project, using React 18, Vite, React Router, Firebase Auth, Firestore, Cloud Functions and GitHub Pages.

## What works

- **Real routes:** Home, video feed, joke feed, individual post details, create pages, saved posts, profiles and admin. Uses `HashRouter` so direct links and browser Back/Forward work on GitHub Pages.
- **Public browsing:** No account needed to browse, search, filter, submit clips, post jokes or leave comments.
- **Videos:** Supports standard, mobile, short, embedded and live YouTube links; extracts an 11-character ID, shows thumbnails, click-to-play privacy-enhanced embeds and muted desktop hover previews where supported. Reduced-motion/data users get thumbnails.
- **Jokes:** Text posts, optional titles, preserved line breaks, discussion threads and sortable/searchable feeds.
- **Voting:** Only logged-in users can like/dislike. One vote per user/post; clicking again removes it, opposite vote switches it. Cloud Function transaction updates the stored totals. **Displayed score is `max(0, likes - dislikes)`**, including for zero likes and ten dislikes.
- **Comments:** Guest comments and optional replies, pending moderation, incremental display.
- **Saved items:** Device-local bookmarks for guests and members.
- **Moderation:** All submitted content/comments remain pending until admin approval; public queries never read pending/rejected documents. Reporting and admin review/removal are available.
- **Optional profiles:** Publicly approved posts attributed to signed-in users appear on a simple profile.
- **Demo mode:** With no complete Firebase configuration, the app runs using local test content and clearly labels local-only actions. Demo member login enables simulated voting.

## Setup

Requires **Node.js 20+**.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To run at the root path locally, create `.env.local` and add `VITE_BASE_PATH=/` (otherwise Vite defaults to `/Comedy-Club/` for GitHub Pages). Without Firebase configuration the demo works automatically.

### Firebase configuration

Create a Firebase project with Authentication, Cloud Firestore and Cloud Functions; enable **Email/Password** and **Google** providers in Firebase Authentication. Add the local development origin and GitHub Pages site to Firebase Auth authorized domains. In `.env.local`:

```dotenv
VITE_BASE_PATH=/
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Supply all six Firebase values to switch from local demo to the real backend. **Do not configure these until rules and Cloud Functions are deployed:** guest submission and voting depend on the secure callable functions.

Install the Firebase CLI and authenticate:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
cd functions && npm install && cd ..
firebase deploy --only firestore:rules,firestore:indexes,functions
```

Depending on your Firebase plan, deploying Cloud Functions may require the pay-as-you-go Blaze plan. Cloud Functions must be accessible for guest callables. Review Firebase console logs and usage for abuse.

### Admin setup

The old school email-domain shortcut has been removed. The `users/{uid}` document is **not writable by ordinary clients**. Sign in through Firebase Auth, then **using the Firebase Console or a trusted Admin SDK** create `users/{uid}` with:

```json
{ "role": "admin" }
```

Only authorized admin UIDs should receive this role. The admin panel is at `#/admin`. It can approve/reject submissions and comments, review abuse reports and remove reported posts. Every sensitive callable rechecks the role against server-side Firestore state; hidden buttons are not the security boundary.

### Moderation and guest flow

- Guests submit via `submitContent` and `submitComment` callable functions (not direct Firestore writes).
- The Cloud Functions validate content length, tags, video IDs and parent documents, apply a per-IP transactional rate limit, and store posts/comments as **pending**.
- Admins approve or reject items using `moderateItem`.
- Public Firestore rules allow reads of **approved** posts/comments only. The UI explicitly tells users if their submission is waiting for review.
- Comments increment the parent post's `commentCount` only when approved.
- Likes/dislikes are stored in private per-user vote documents and counted atomically on approved posts.
- Moderation queue and export tools are restricted. Public users cannot edit vote counters, content statuses, profiles, reports, or rate-limit documents.

Guest names are **not verified identities**. Input text is rendered by React as plain text; arbitrary user HTML is not evaluated. All writes go through functions.

**Operational security:** Per-IP limits are a baseline, not comprehensive abuse protection. Before opening to a large public audience, configure Firebase App Check with a supported provider, add monitoring / abuse review and consider stronger spam detection and TTL policies for rate-limit records. App Check enforcement for guest callables is not enabled by default so deployments remain compatible with basic setups.

### GitHub Pages

The GitHub Actions workflow builds from `main`, runs tests and deploys `dist`. It sets `VITE_BASE_PATH` to `/<repository-name>/`; `HashRouter` keeps page refreshes working. Configure Pages with **GitHub Actions** deployment.

To enable the real backend in GitHub Actions, add repository **Actions secrets** with the exact six `VITE_FIREBASE_...` names above. Without them, deployment explicitly remains local-only demo mode.

Once deployed, visit the site URL and confirm that Firebase Auth authorizes that domain; verify guest posting, approving pending posts, authenticated voting, and comments using test accounts. Firebase services deploy separately via Firebase CLI.

## Tests

```bash
npm run test:smoke  # dependency-free Node tests for YouTube URLs and vote scores
npm test            # Vitest + jsdom React tests (after npm install)
npm run build       # production Vite bundle
```

The tests cover common/malicious YouTube URL patterns, zero-floor scores (including **0 likes / 10 dislikes**), switching/removing votes, demo posting, guest comment flow, feed links and sign-in prompts.

**Not yet validated:** Actual Firestore security-rule enforcement, Cloud Functions transactional concurrency, and browser autoplay behavior need Firebase Emulator Suite / a real Firebase test deployment and browser-level tests. Run a production build and all Vitest tests on a machine with npm dependencies installed.

## Code map

```text
src/
  App.jsx                    Real route table, footer, demo mode banner
  config.js                  Brand name and text
  context/                   Auth, feed, sign-in modal, local bookmarks
  components/                Header, cards, video preview, voting, comments
  pages/                     Home, Feed, Detail, Submit, Profile, Admin
  lib/
    content.js               Scoring, formatting, sorting, direct links
    youtube.js               Strict YouTube URL parsing and embeds
    store.js                 Firebase callables/listeners + demo store
  data/mockData.js           Clearly labeled demo posts and comments
functions/index.js           Server validation, submission, voting, reports, moderation
firestore.rules              Read-only public data and private user votes
firestore.indexes.json       Comment feed index
```

## Design and limitations

The brand name is configured in `src/config.js`; also update `index.html` metadata and `public/manifest.webmanifest` if you rename it. Global colors, fonts and spacing are defined in `src/styles.css`.

- Firebase live services have to be configured and deployed by the repository owner; the ZIP does not include credentials.
- All live submissions and comments require admin approval. There is no external email or pending-submission tracking page yet.
- Bookmarks are stored on the current device, including for signed-in users; server-synced bookmarks are not implemented.
- User profiles show approved posts tied to their authenticated UID; guest nicknames are deliberately not treated as verified accounts.
- Autoplay, removed/restricted videos and YouTube privacy embeddings depend on browser and YouTube availability. The player has a 'Watch on YouTube' fallback.
- The demo data includes fictional nicknames/sample posts and is labeled as local preview content, not live community engagement.
