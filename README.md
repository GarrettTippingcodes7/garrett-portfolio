# Garrett Tipping · Portfolio

Hand-written HTML, CSS and JavaScript, hosted on Netlify.

## Run it locally

```bash
python3 -m http.server 8642
```

Then open http://localhost:8642.

## Editing

- The header and footer live in `partials/`. After changing them, run `python3 tools/build.py` to update every page.
- Add images as `.png`/`.jpg` in `assets/img` (with an optional `.avif` next to them), reference the `.png`/`.jpg` in the HTML, and run the build script.
- The contact form sends through Web3Forms (free), which emails each message to Garrett. The access key is the hidden `access_key` field in `contact.html`.
