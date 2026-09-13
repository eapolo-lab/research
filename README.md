# Personal academic website

A static site for GitHub Pages. All content lives in three JSON files under
`data/` — you never need to touch the HTML, CSS or JS to add a paper, a
project, or update your bio.

## Updating content

### Add a publication
Open `data/publications.json` and add a new object to the array (copy an
existing one and edit it — don't forget the comma between entries):

```json
{
  "title": "Your paper title",
  "authors": "A. Author, B. Author",
  "year": 2026,
  "type": "article",
  "venue": "Journal or conference name",
  "doi": "10.xxxx/xxxxx",
  "url": "https://link-to-the-paper",
  "featured": false,
  "tags": ["keyword one", "keyword two"]
}
```

`type` controls which filter tab it appears under: `article` (journal
articles), `proceedings` (conference proceedings), `book`, `bookchapter` or
`incollection` (grouped as "Books & chapters"). Set `"featured": true` to
give a paper a highlighted left border. Publications are sorted by year
automatically — you don't need to keep the file in order.

Each entry always shows a "Read more" button. It uses `url` if you've
filled it in, otherwise it falls back to `doi` — you don't need to fill in
both. If you leave both empty, the button still appears (so the layout
stays consistent) but shows as greyed-out and unclickable until you add a
real link.

**The file currently includes 4 fictional example entries** (conference
proceedings, a book, and a book chapter), each titled
`[EXAMPLE ENTRY — replace with a real one]` and flagged `"placeholder": true`,
added so you can see how each publication type looks. Delete them (or
replace their contents) whenever you're ready — they're easy to find by
searching the file for `placeholder`.

### Add a project
Same idea in `data/projects.json` — copy an entry and edit the fields:

```json
{
  "slug": "unique-url-friendly-id",
  "title": "Project title",
  "period": "2024 – present",
  "place": "Institution, City, Country",
  "funder": "Funding body or grant name",
  "image": "assets/img/projects/your-image.png",
  "summary": "One or two sentences shown on the project card.",
  "abstract": "The longer description shown on the project's own page.",
  "tags": ["keyword one", "keyword two"],
  "links": [
    { "label": "Project website", "url": "https://..." },
    { "label": "Related publication", "url": "https://..." }
  ]
}
```

Each project automatically gets its own page at
`project.html?slug=your-slug`, reachable by clicking its card on the
homepage — no extra HTML file to create. `slug` must be unique and
URL-safe (letters, numbers, hyphens). `links` and `tags` can be left as
empty arrays (`[]`) if you don't have any yet.

To use a real photo instead of the placeholder graphic, drop the image
file into `assets/img/projects/` and point `image` at it (a 16:10 image,
at least 800px wide, works best).

### Update your bio, CV intro, or contact details
Everything on the About card — name, role lines, greeting, bio paragraphs,
research interests, education, experience, awards, stats, email, phone,
address, social links, and the CV file it links to — lives in
`data/profile.json`. Edit the values directly; the page rebuilds itself
from this file automatically. A few fields worth knowing:

- `greeting` — the "Hi, I'm ...!" heading at the top of the About card.
- `roleLines` — the lines shown under your name (role, affiliation, any
  side roles). Add or remove lines freely; each renders on its own line.
- `bio` — keep this to 1–2 short paragraphs; it's meant to be a summary,
  not your full CV (that's what the CV PDF is for — see below).
- `researchAreas` — only the `title` of each is shown on the homepage (as
  a pill under your bio); the `description` field is kept in the file for
  your own reference but isn't displayed there.
- `awards` — kept in the file for reference (e.g. if you regenerate the CV
  PDF) but not shown on the homepage, to keep the About card short.

### Photos
All photos on the site should be **PNG** files (not JPG) — this includes
your profile photo and any real photos you add later (project photos, the
header filmstrip). Vector graphics (the abstract placeholder illustrations
in `assets/img/hero/` and `assets/img/projects/`) stay as `.svg` since
they're illustrations, not photos.

### Change your photo
Replace `assets/img/profile.png` with a new PNG of the same name (a square
crop around 800×800px works best — it's displayed in a circle, so keep
your face centred).

### Change the header photo reel (filmstrip)
The header shows a continuously scrolling filmstrip of small images below
the menu. It's controlled by the `heroReel` list in `data/profile.json`:

```json
"heroReel": [
  "assets/img/hero/hero-postharvest.svg",
  "assets/img/hero/hero-fusarium.svg",
  "assets/img/hero/hero-satellite.svg",
  "assets/img/hero/hero-uav.svg",
  "assets/img/hero/ai-network.svg"
]
```

These are currently 5 generated placeholder graphics matching the site's
colour palette. To use real photos of your fieldwork or projects instead,
save them as PNGs in `assets/img/hero/` and list their paths here — any
number of images works, not just 5. The strip scrolls continuously and
pauses automatically for anyone with reduced-motion accessibility settings
enabled.

### Update the CV button
The "CV" link in the menu opens a PDF directly in a new tab — it does not
scroll to a section on the page. It points at whatever file `cvUrl` names
in `data/profile.json` (by default `assets/cv/enrique-apolo-apolo-cv.pdf`).
To swap in your own CV, either:
- replace that PDF file with your own, keeping the same filename, or
- put your PDF anywhere in `assets/cv/` and update `cvUrl` to match.

The current PDF is a one-page summary generated from this site's own
profile data, as a placeholder — see "Notes on the current content" below.

### Update the "Elsewhere" icons (Google Scholar, ORCID, etc.)
These come from the `social` list in `data/profile.json`. Each entry needs
a `label`, a `url`, and an `icon` key that matches one of: `scholar`,
`orcid`, `researchgate`, `linkedin`, `x`, `github` — each renders as a
circular badge in that platform's own brand colour. Add, remove or reorder
entries there and the icon rows (both on the About card and in the footer)
update to match.

## Previewing locally

Because the page loads the JSON files with `fetch()`, opening `index.html`
directly by double-clicking it won't work in most browsers (they block
local file requests for security). Instead, from this folder run:

```bash
python3 -m http.server 8000
```

and open `http://localhost:8000` in your browser. (Any other local server
works too — `npx serve`, VS Code's Live Server extension, etc.)

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository (e.g. `your-username.github.io`
   for a root domain, or any repo name for a project site).
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a
   branch", pick the `main` branch and the `/ (root)` folder, then save.
4. GitHub will publish the site at `https://your-username.github.io/` (or
   `https://your-username.github.io/repo-name/` for a project repo) within
   a minute or two. Every push to `main` updates the live site — so
   updating a publication is: edit the JSON, commit, push.

### Optional: a custom domain
Add a `CNAME` file at the root containing your domain (e.g.
`www.yourdomain.com`) and point your domain's DNS at GitHub Pages per
[GitHub's instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## File structure

```
index.html                homepage shell — rarely needs editing
project.html               project detail page template (shared by every project, via ?slug=)
assets/css/style.css       all visual styling
assets/js/main.js          builds the homepage from the JSON files
assets/js/project.js       builds a project detail page from the JSON files
assets/img/profile.png     your photo (PNG)
assets/img/hero/           header filmstrip images (placeholder SVGs included)
assets/img/projects/       project images (placeholder SVGs included)
assets/cv/                 your CV PDF (linked from the "CV" menu item)
data/profile.json          bio, CV link, contact, stats, research areas
data/publications.json     your publication list
data/projects.json         your project list
```

## Notes on the current content

- `data/publications.json` holds your 2 real publications plus 4 clearly
  labelled fictional examples added so you can preview how conference
  proceedings, a book, and a book chapter look (see "Add a publication"
  above for how to find and remove them). Your CV lists 19+ peer-reviewed
  articles — send me a BibTeX export from Google Scholar/ORCID and I can
  convert the full real list into this format.
- `data/projects.json` lists four research lines drawn from your bio
  (postharvest disorder detection, Fusarium hyperspectral detection, GAN/
  satellite vegetation monitoring, UAV citrus yield estimation), each with
  a full detail page. If you'd like your named projects (e.g. funded
  grants) featured instead, replace these with your own titles and
  descriptions.
- Each project currently uses a generated placeholder graphic (an abstract
  line illustration matching the site's colour palette) instead of a real
  photo, and the `funder` field is a visible placeholder — replace both
  with real images (as PNGs) and funding-body names when you have them;
  nothing was invented for these two fields.
- `assets/cv/enrique-apolo-apolo-cv.pdf` is a one-page summary CV
  auto-generated from `data/profile.json` (name, roles, bio, experience,
  education, awards) as a placeholder — it says as much on its own last
  line. Replace it with your official summarized CV (e.g. the
  Ministerio/FECYT normalized CV, CVN/CVA) once you have the PDF, keeping
  the same filename, or update `cvUrl` in `data/profile.json` to point at
  a different file.
- Contact details, dates and affiliations were carried over from your old
  site plus what I know of your current position at IRTA — double-check
  the address, phone number and date ranges in `data/profile.json` before
  publishing.
