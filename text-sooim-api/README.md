# Text Sooim API (Vercel)

The small server behind the portfolio's "Text Sooim" chat. The site (GitHub Pages) sends the conversation here; this function adds the Anthropic key and Sooim's facts, asks Claude, and returns a reply in texting voice.

- `api/chat.js`: the function. All the facts the AI knows are in `SYSTEM` at the top.
- The chat UI lives in the portfolio: `js/text-sooim.js`, `css/text-sooim.css`.

## One-time setup (about 5 minutes, no Terminal needed)

1. Go to vercel.com → **Add New… → Project** → import the `portfolio` GitHub repo.
2. On the configure screen:
   - **Root Directory:** click Edit and choose `text-sooim-api`
   - **Framework Preset:** Other
   - **Environment Variables:** add `ANTHROPIC_API_KEY` = your key from platform.claude.com
3. Click **Deploy**. Your endpoint is `https://<project-name>.vercel.app/api/chat`.
4. Paste that URL into `data-endpoint` on the chat's script tag in the portfolio:
   ```html
   <script src="js/text-sooim.js?v=5" data-endpoint="https://<project-name>.vercel.app/api/chat" defer></script>
   ```

After that, every push to GitHub redeploys it automatically.

## Test it locally

Visitors on `sooimkang.com` and your preview server (`python3 _preview_server.py` → http://127.0.0.1:8899/text-sooim-draft) are allowed. Opening the HTML file directly (`file://…`) is blocked by design, so use the preview server to test.

## Change things later

- **What it knows:** edit `SYSTEM` in `api/chat.js`, push to GitHub. Update it when case studies change (for example, once yap has real numbers). It's told never to invent metrics.
- **Model:** add an environment variable `MODEL` in Vercel (Settings → Environment Variables) to override the default `claude-haiku-4-5`, then redeploy.
- **Allowed sites:** `ALLOWED_ORIGINS` at the top of `api/chat.js`.
- **Rate limit:** `RATE` (40 texts per hour per visitor, best effort). Also set a monthly spend limit in the Claude Console so a spike can't run up a bill.
- **Key:** it only ever lives in Vercel's environment variables. Never put it in the portfolio code or GitHub.

## If the chat says "Not Delivered"

Open `https://<project-name>.vercel.app/api/chat` logs in Vercel (Project → Logs):
- `ANTHROPIC_API_KEY is not set`: add the variable and redeploy.
- `upstream 401`: the key is wrong or revoked.
- `upstream 400/402` with a billing message: add credits in the Claude Console.
- `upstream 404`: the model name is outdated; set `MODEL` to a current one.
- `origin not allowed`: the page isn't on sooimkang.com or 127.0.0.1:8899.
