/* ============================================================
   Renders the whole site from /data/*.json.
   To update content, edit the JSON files — this script never
   needs to change for ordinary content updates.
   ============================================================ */

const SOCIAL_GLYPH = {
  scholar: "GS",
  orcid: "iD",
  researchgate: "RG",
  linkedin: "in",
  x: "X",
  github: "GH"
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

/* ---------------- Profile / header / about / cv / contact ---------------- */

function renderHeroReel(images) {
  const container = document.getElementById("heroCarousel");
  if (!container || !images || !images.length) return;

  const slides = images.map((src, i) => {
    const slide = el("div", { class: "slide" + (i === 0 ? " active" : "") });
    slide.style.backgroundImage = `url("${src}")`;
    container.appendChild(slide);
    return slide;
  });

  if (slides.length < 2) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  let current = 0;
  setInterval(() => {
    slides[current].classList.remove("active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("active");
  }, 5000);
}

function renderProfile(p) {
  document.title = `${p.name}, ${p.credentials} — ${p.role}`;

  document.getElementById("brandLink").textContent = p.name.split(" ").slice(-2).join(" ");
  document.getElementById("heroName").textContent = `${p.name}, ${p.credentials}`;
  document.getElementById("heroRole").textContent = `${p.role} · ${p.affiliation}`;
  document.getElementById("heroTagline").textContent = p.tagline;
  document.getElementById("heroLocation").textContent = p.location;
  document.getElementById("heroPhoto").alt = p.name;
  document.getElementById("footerName").textContent = `© ${new Date().getFullYear()} ${p.name}`;

  const statsRow = document.getElementById("statsRow");
  p.stats.forEach(s => {
    statsRow.appendChild(el("div", { class: "stat" }, [
      el("div", { class: "value", text: s.value }),
      el("div", { class: "label", text: s.label })
    ]));
  });

  const bioText = document.getElementById("bioText");
  p.bio.forEach(para => bioText.appendChild(el("p", { class: "measure", text: para })));

  const areasList = document.getElementById("areasList");
  p.researchAreas.forEach(a => {
    areasList.appendChild(el("li", {}, [
      el("h3", { text: a.title }),
      el("p", { text: a.description })
    ]));
  });

  const eduList = document.getElementById("educationList");
  p.education.forEach(e => eduList.appendChild(timelineItem(e.degree, e.place, e.period, e.detail)));

  const expList = document.getElementById("experienceList");
  p.experience.forEach(e => expList.appendChild(timelineItem(e.role, e.place, e.period, e.detail)));

  const awardsList = document.getElementById("awardsList");
  p.awards.forEach(a => awardsList.appendChild(el("li", { text: a })));

  document.getElementById("contactAddress").innerHTML = p.address.join("<br>");
  const emailLink = document.getElementById("contactEmail");
  emailLink.href = `mailto:${p.email}`;
  emailLink.textContent = p.email;
  const phoneLink = document.getElementById("contactPhone");
  phoneLink.href = `tel:${p.phone.replace(/\s+/g, "")}`;
  phoneLink.textContent = p.phone;

  const socialRow = document.getElementById("socialRow");
  p.social.forEach(s => {
    const a = el("a", {
      class: "social-icon",
      attrs: { href: s.url, target: "_blank", rel: "noopener", "aria-label": s.label, title: s.label }
    }, [
      el("span", { class: "glyph", text: SOCIAL_GLYPH[s.icon] || s.label.slice(0, 2).toUpperCase() })
    ]);
    socialRow.appendChild(a);
  });
}

function timelineItem(title, place, period, detail) {
  return el("div", { class: "tl-item" }, [
    el("div", { class: "period", text: period }),
    el("h4", { text: title }),
    el("div", { class: "place", text: place }),
    detail ? el("div", { class: "detail", text: detail }) : null
  ]);
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
        el("img", { attrs: { src: proj.image || "assets/img/projects/placeholder.svg", alt: "" } })
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
  // Show a single "Read more" link — prefer the direct URL, fall back to
  // the DOI only when there's no URL. No need to show both when they'd
  // point to the same paper.
  const primary = p.url || (p.doi ? (p.doi.startsWith("http") ? p.doi : `https://doi.org/${p.doi}`) : null);
  const link = primary ? el("a", { text: "Read more", attrs: { href: primary, target: "_blank", rel: "noopener" } }) : null;

  return el("div", { class: `pub-item${p.featured ? " featured" : ""}` }, [
    el("div", { class: "pub-title" }, [
      document.createTextNode(p.title),
      el("span", { class: "pub-type-tag", text: TYPE_LABELS[p.type] || p.type })
    ]),
    el("div", { class: "pub-meta" }, [
      document.createTextNode(p.authors + " \u2014 "),
      el("span", { class: "pub-venue", text: p.venue || "" })
    ]),
    link ? el("div", { class: "pub-links" }, [link]) : null
  ]);
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

async function init() {
  initNav();
  try {
    const [profile, publications, projects] = await Promise.all([
      loadJSON("data/profile.json"),
      loadJSON("data/publications.json"),
      loadJSON("data/projects.json")
    ]);

    renderProfile(profile);
    renderHeroReel(profile.heroReel);
    renderProjects(projects);

    ALL_PUBS = publications;
    renderPublicationControls();
    renderPublicationResults();
  } catch (err) {
    console.error(err);
    document.querySelector("main").insertAdjacentHTML(
      "afterbegin",
      `<div class="wrap"><p style="color:#8a3f3f;padding:2rem 0;">
        Could not load site content. If you're viewing this file directly
        (file://), run a local server instead \u2014 see README.md.
      </p></div>`
    );
  }
}

init();
