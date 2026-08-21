# party cam 📸

Dump photos into `/photos`, push, they show up in a grid on the site.
Tap a photo to go fullscreen and swipe left/right through them.
Pinch on the grid to make it denser or wider instead of the phone zooming the page — or just tap tight / normal / wide.

## setup (one time)

1. Create a new GitHub repo and push this folder to it.
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / root**.
3. Wait a minute, then visit `https://<your-username>.github.io/<repo-name>/`.

## using it

1. Drop photos into the `photos/` folder (any name, jpg/png/heic/webp/gif).
2. Commit + push to `main`.
3. A GitHub Action automatically rebuilds `photos/photos.json` (newest first) and commits it back.
4. Refresh the site — new photos are in the grid.

That's it. No build step, no framework, no server — just static files + one small Action.

## from your iPhone

Easiest flow: AirDrop / iCloud the photos to a laptop, drop them in `photos/`, `git add -A && git commit -m "party" && git push`. Or use GitHub's mobile app / the web uploader on github.com to drag photos straight into the `photos/` folder from your phone — the Action does the rest.
