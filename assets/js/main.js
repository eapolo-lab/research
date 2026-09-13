/* ============================================================
   Renders the whole site from /data/*.json.
   To update content, edit the JSON files — this script never
   needs to change for ordinary content updates.
   ============================================================ */

const SOCIAL_ICONS = {
  scholar: {
    class: "icon-scholar",
    html: `<svg viewBox="0 0 24 24" width="19" height="19"><polygon points="12,3 23,9 12,15 1,9" fill="#fff"/><path d="M6 11v4c0 1.5 3 3 6 3s6-1.5 6-3v-4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="23" y1="9" x2="23" y2="15.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><circle cx="23" cy="16.6" r="1.1" fill="#fff"/></svg>`
  },
  orcid: {
    class: "icon-orcid",
    html: `<span class="glyph">iD</span>`
  },
  researchgate: {
    class: "icon-researchgate",
    html: `<span class="glyph">RG</span>`
  },
  linkedin: {
    class: "icon-linkedin",
    html: `<span class="glyph">in</span>`
  },
  x: {
    class: "icon-x",
    html: `<span class="glyph">X</span>`
  },
  github: {
    class: "icon-github",
    html: `<svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 015.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56A10.52 10.52 0 0023.5 12C23.5 5.73 18.27.5 12 .5z"/></svg>`
  }
};

const TYPE_LABELS = {
  article: "Journal article",
  proceedings: "Conference proceedings",
  book: "Book",
  bookchapter: "Book chapter",
  incollection: "Book chapter",
  preprint: "Preprint",
  thesis: "Thesis"
};

const FILTER_GROUPS = [
  { key: "all", label: "All" },
  { key: "article", label: "Journal articles" },
  { key: "proceedings", label: "Conference proceedings" },
  { key: "book,bookchapter,incollection", label: "Books & chapters" }
];

function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.html !== undefined) node.innerHTML = opts.html;
  if (opts.text !== undefined) node.textContent = opts.text;
  if (opts.attrs) for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  children.forEach(c => c && node.appendChild(c));
  return node;
}

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.json();
}

/* ---------------- Header: photo reel ---------------- */

const REEL_FOLDER = "assets/img/hero/";
const REEL_PREFIX = "img_";
const REEL_MAX_PROBE = 60; // stops as soon as a number is missing, so this is just a safety ceiling

function probeImage(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// Scans assets/img/hero/ for img_01.png, img_02.png, ... and stops at the
// first missing number — so the reel always matches whatever numbered
// photos are actually in the folder, no JSON editing required.
async function discoverReelImages() {
  const found = [];
  for (let i = 1; i <= REEL_MAX_PROBE; i++) {
    const num = String(i).padStart(2, "0");
    const url = `${REEL_FOLDER}${REEL_PREFIX}${num}.png`;
    const ok = await probeImage(url);
    if (!ok) break;
    found.push(url);
  }
  return found;
}

function renderReelStrip(images) {
  const track = document.getElementById("reelTrack");
  if (!track || !images || !images.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Duplicate the list once so the CSS marquee (translateX -50%) loops seamlessly.
  const loopImages = reduceMotion ? images : images.concat(images);

  loopImages.forEach(src => {
    track.appendChild(el("img", { attrs: { src, alt: "" } }));
  });

  if (reduceMotion) track.style.animation = "none";
}

/* ---------------- Profile / intro / contact ---------------- */

function renderSocialIcons(container, social) {
  social.forEach(s => {
    const icon = SOCIAL_ICONS[s.icon];
    const a = el("a", {
      class: `social-icon${icon ? " " + icon.class : ""}`,
      html: icon ? icon.html : `<span class="glyph">${s.label.slice(0, 2).toUpperCase()}</span>`,
      attrs: { href: s.url, target: "_blank", rel: "noopener", "aria-label": s.label, title: s.label }
    });
    container.appendChild(a);
  });
}

function renderProfile(p) {
  document.title = `${p.name}, ${p.credentials} — ${p.role}`;

  document.getElementById("brandLink").textContent = p.name.split(" ").slice(-2).join(" ");
  document.getElementById("footerName").textContent = `\u00A9 ${new Date().getFullYear()} ${p.name}`;

  document.getElementById("navCv").href = p.cvUrl;

  const statsRow = document.getElementById("statsRow");
  p.stats.forEach(s => {
    statsRow.appendChild(el("div", { class: "stat" }, [
      el("div", { class: "value", text: s.value }),
      el("div", { class: "label", text: s.label })
    ]));
  });

  // Intro card
  document.getElementById("heroPhoto").alt = p.name;
  if (p.photoHover) {
    const hoverImg = document.getElementById("heroPhotoHover");
    hoverImg.src = p.photoHover;
    hoverImg.alt = p.name;
    hoverImg.onerror = () => { hoverImg.closest(".photo-swap").classList.add("no-hover-photo"); };
  } else {
    document.querySelector(".photo-swap").classList.add("no-hover-photo");
  }
  document.getElementById("introName").textContent = p.name;
  const roleLines = document.getElementById("introRoleLines");
  (p.roleLines || [p.role, p.affiliation]).forEach((line, i) => {
    roleLines.appendChild(el("p", { class: i === 0 ? "role-primary" : "role-line", text: line }));
  });
  renderSocialIcons(document.getElementById("socialRowTop"), p.social);

  document.getElementById("greeting").textContent = p.greeting;
  const bioText = document.getElementById("bioText");
  p.bio.forEach(para => bioText.appendChild(el("p", { text: para })));

  const interestsRow = document.getElementById("interestsRow");
  interestsRow.appendChild(el("span", { class: "interests-label", text: "Research interests:" }));
  p.researchAreas.forEach(a => interestsRow.appendChild(el("span", { class: "interest-tag", text: a.title })));

  // Footer contact
  document.getElementById("contactAddress").innerHTML = p.address.join("<br>");
  const emailLink = document.getElementById("contactEmail");
  emailLink.href = `mailto:${p.email}`;
  emailLink.textContent = p.email;
  const phoneLink = document.getElementById("contactPhone");
  phoneLink.href = `tel:${p.phone.replace(/\s+/g, "")}`;
  phoneLink.textContent = p.phone;
  renderSocialIcons(document.getElementById("socialRow"), p.social);
}

/* ---------------- Projects ---------------- */

function renderProjects(projects) {
  const list = document.getElementById("projectList");
  projects.forEach(proj => {
    const row = el("a", {
      class: "project-row",
      attrs: { href: `project.html?slug=${encodeURIComponent(proj.slug)}` }
    }, [
      el("div", { class: "thumb" }, [
        el("img", { attrs: { src: proj.image || "assets/img/projects/placeholder.png", alt: "" } })
      ]),
      el("div", { class: "row-body" }, [
        el("div", { class: "period", text: proj.period }),
        el("h3", { text: proj.title }),
        el("div", { class: "funder", text: proj.funder }),
        el("p", { class: "summary", text: proj.summary }),
        el("div", { class: "tag-row" }, (proj.tags || []).map(t => el("span", { text: t })))
      ]),
      el("div", { class: "row-arrow", text: "\u2192" })
    ]);
    list.appendChild(row);
  });
}

/* ---------------- Publications ---------------- */

let ALL_PUBS = [];
let ACTIVE_FILTER = "all";

function renderPublicationControls() {
  const filters = document.getElementById("pubFilters");
  FILTER_GROUPS.forEach(g => {
    const btn = el("button", { text: g.label, attrs: { type: "button", "data-key": g.key } });
    if (g.key === ACTIVE_FILTER) btn.classList.add("active");
    btn.addEventListener("click", () => {
      ACTIVE_FILTER = g.key;
      [...filters.children].forEach(b => b.classList.toggle("active", b === btn));
      renderPublicationResults();
    });
    filters.appendChild(btn);
  });

  document.getElementById("pubSearch").addEventListener("input", renderPublicationResults);
}

function renderPublicationResults() {
  const container = document.getElementById("pubResults");
  container.innerHTML = "";

  const query = document.getElementById("pubSearch").value.trim().toLowerCase();
  const allowedTypes = ACTIVE_FILTER === "all" ? null : ACTIVE_FILTER.split(",");

  let pubs = ALL_PUBS.filter(p => !allowedTypes || allowedTypes.includes(p.type));
  if (query) {
    pubs = pubs.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.authors.toLowerCase().includes(query) ||
      String(p.year).includes(query) ||
      (p.venue || "").toLowerCase().includes(query)
    );
  }

  document.getElementById("pubCount").textContent =
    `${pubs.length} of ${ALL_PUBS.length}`;

  if (pubs.length === 0) {
    container.appendChild(el("p", { class: "pub-empty", text: "No publications match that search." }));
    return;
  }

  const byYear = {};
  pubs.forEach(p => { (byYear[p.year] = byYear[p.year] || []).push(p); });

  Object.keys(byYear).sort((a, b) => b - a).forEach(year => {
    const group = el("div", { class: "pub-year-group" }, [el("h3", { text: year })]);
    byYear[year].forEach(p => group.appendChild(publicationItem(p)));
    container.appendChild(group);
  });
}

function publicationItem(p) {
  // Every publication shows a "Read more" button. It uses the URL if
  // present, falling back to the DOI — no need for both when they point
  // to the same paper. If neither is filled in yet, the button still
  // appears but in a muted, non-clickable state so the layout stays
  // consistent while the real link is added.
  const primary = p.url || (p.doi ? (p.doi.startsWith("http") ? p.doi : `https://doi.org/${p.doi}`) : null);
  const link = primary
    ? el("a", { class: "pub-readmore", text: "Read more", attrs: { href: primary, target: "_blank", rel: "noopener" } })
    : el("span", { class: "pub-readmore disabled", text: "Read more", attrs: { title: "Add the link in data/publications.json" } });

  return el("div", { class: `pub-item${p.featured ? " featured" : ""}` }, [
    el("div", { class: "pub-title" }, [
      document.createTextNode(p.title),
      el("span", { class: "pub-type-tag", text: TYPE_LABELS[p.type] || p.type })
    ]),
    el("div", { class: "pub-meta" }, [
      document.createTextNode(p.authors + " \u2014 "),
      el("span", { class: "pub-venue", text: p.venue || "" })
    ]),
    el("div", { class: "pub-links" }, [link])
  ]);
}

/* ---------------- Interviews ---------------- */

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function renderInterviews(interviews) {
  const grid = document.getElementById("interviewGrid");
  if (!grid) return;

  if (!interviews || !interviews.length) {
    grid.appendChild(el("p", { class: "pub-empty", text: "No interviews added yet — see data/interviews.json." }));
    return;
  }

  interviews.forEach(iv => {
    const videoId = extractYouTubeId(iv.youtubeUrl || "");
    if (!videoId) return;

    const thumb = el("div", { class: "interview-thumb" }, [
      el("img", { attrs: { src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, alt: "", loading: "lazy" } }),
      el("span", { class: "play-badge", html: `<svg viewBox="0 0 24 24" width="22" height="22"><polygon points="7,4 20,12 7,20" fill="#fff"/></svg>` })
    ]);
    thumb.addEventListener("click", () => {
      thumb.innerHTML = "";
      thumb.appendChild(el("iframe", {
        attrs: {
          src: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
          title: iv.title,
          frameborder: "0",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true"
        }
      }));
    }, { once: true });

    grid.appendChild(el("div", { class: "interview-card" }, [
      thumb,
      el("div", { class: "interview-body" }, [
        el("h3", { text: iv.title }),
        el("div", { class: "interview-meta", text: [iv.source, iv.date].filter(Boolean).join(" \u00b7 ") })
      ])
    ]));
  });
}

/* ---------------- Mobile nav ---------------- */

function initNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));
}

/* ---------------- Boot ---------------- */

function showSectionError(container, filename) {
  if (!container) return;
  container.innerHTML = "";
  container.appendChild(el("p", {
    class: "pub-empty",
    text: `Could not load ${filename} \u2014 it likely has a JSON syntax error (a common one: a missing comma between entries). Check the browser console for details.`
  }));
}

async function init() {
  initNav();

  // The header photo reel doesn't depend on any JSON file — it scans
  // assets/img/hero/ directly, so it starts right away.
  discoverReelImages().then(renderReelStrip);

  const [profileR, pubsR, projR, intR] = await Promise.allSettled([
    loadJSON("data/profile.json"),
    loadJSON("data/publications.json"),
    loadJSON("data/projects.json"),
    loadJSON("data/interviews.json")
  ]);

  if (profileR.status === "fulfilled") {
    renderProfile(profileR.value);
  } else {
    console.error("profile.json:", profileR.reason);
    showSectionError(document.getElementById("bioText"), "data/profile.json");
  }

  if (pubsR.status === "fulfilled") {
    ALL_PUBS = pubsR.value;
    renderPublicationControls();
    renderPublicationResults();
  } else {
    console.error("publications.json:", pubsR.reason);
    showSectionError(document.getElementById("pubResults"), "data/publications.json");
  }

  if (projR.status === "fulfilled") {
    renderProjects(projR.value);
  } else {
    console.error("projects.json:", projR.reason);
    showSectionError(document.getElementById("projectList"), "data/projects.json");
  }

  if (intR.status === "fulfilled") {
    renderInterviews(intR.value);
  } else {
    console.error("interviews.json:", intR.reason);
    showSectionError(document.getElementById("interviewGrid"), "data/interviews.json");
  }
}

init();
