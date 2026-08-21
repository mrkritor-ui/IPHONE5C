# party cam 📸

Dump photos straight into the repo root (from your phone or a laptop), push, and they get auto-sorted into `/photos` and show up in a grid on the site.
Tap a photo to go fullscreen and swipe left/right through them.
Pinch on the grid to make it denser or wider instead of the phone zooming the page — or just tap tight / normal / wide.

## setup (one time)

1. Create a new GitHub repo and push this folder to it.
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / root**.
3. Wait a minute, then visit `https://<your-username>.github.io/<repo-name>/`.

## using it

1. In the GitHub repo (root, not inside any folder), tap **Add file → Upload files** and pick photos straight from your camera roll.
2. Commit to `main`.
3. A GitHub Action automatically sweeps any loose photos into `photos/`, rebuilds `photos.json` (newest first), and commits both.
4. Refresh the site — new photos are in the grid.

That's it. No build step, no framework, no server, no need to ever navigate into the `photos/` folder — just static files + one small Action.

## from your iPhone

The GitHub app itself doesn't support uploading files to a repo — use **Safari** (or Chrome) instead:

1. Go to `github.com` → your repo (stay at the root — don't open the `photos/` folder, mobile Safari's upload button is unreliable inside subfolders).
2. Tap **Add file → Upload files**.
3. Pick photos straight from your camera roll (multiple at once).
4. Scroll down, add a commit message, tap **Commit changes**.
5. Refresh the site in ~30 seconds — the Action moves the photos into `/photos` and rebuilds the manifest automatically.

Tip: Share icon → **Add to Home Screen** on that repo page gives you a one-tap shortcut that feels like a dedicated upload app.
