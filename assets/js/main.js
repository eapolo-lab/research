/* ============================================================
   Renders the whole site from /data/*.json.
   To update content, edit the JSON files — this script never
   needs to change for ordinary content updates.
   ============================================================ */

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
    socialRow.appendChild(el("a", {
      text: s.label,
      attrs: { href: s.url, target: "_blank", rel: "noopener" }
    }));
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
    const card = el("a", {
      class: "project-card",
      attrs: { href: `project.html?slug=${encodeURIComponent(proj.slug)}` }
    }, [
      el("div", { class: "thumb" }, [
        el("img", { attrs: { src: proj.image || "assets/img/projects/placeholder.svg", alt: "", loading: "lazy" } })
      ]),
      el("div", { class: "card-body" }, [
        el("div", { class: "period", text: proj.period }),
        el("h3", { text: proj.title }),
        el("div", { class: "funder", text: proj.funder }),
        el("p", { class: "summary", text: proj.summary }),
        el("div", { class: "tag-row" }, (proj.tags || []).map(t => el("span", { text: t }))),
        el("span", { class: "view-link", text: "View project details" })
      ])
    ]);
    list.appendChild(card);
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
  const links = [];
  if (p.url) links.push(el("a", { text: "Read", attrs: { href: p.url, target: "_blank", rel: "noopener" } }));
  if (p.doi) links.push(el("a", {
    text: "DOI",
    attrs: { href: p.doi.startsWith("http") ? p.doi : `https://doi.org/${p.doi}`, target: "_blank", rel: "noopener" }
  }));

  return el("div", { class: `pub-item${p.featured ? " featured" : ""}` }, [
    el("div", { class: "pub-title" }, [
      document.createTextNode(p.title),
      el("span", { class: "pub-type-tag", text: TYPE_LABELS[p.type] || p.type })
    ]),
    el("div", { class: "pub-meta" }, [
      document.createTextNode(p.authors + " \u2014 "),
      el("span", { class: "pub-venue", text: p.venue || "" })
    ]),
    links.length ? el("div", { class: "pub-links" }, links) : null
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
