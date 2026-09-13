const SOCIAL_ICONS = {
  scholar: {
    class: "icon-scholar",
    html: `<svg viewBox="0 0 24 24" width="19" height="19"><polygon points="12,3 23,9 12,15 1,9" fill="#fff"/><path d="M6 11v4c0 1.5 3 3 6 3s6-1.5 6-3v-4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="23" y1="9" x2="23" y2="15.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><circle cx="23" cy="16.6" r="1.1" fill="#fff"/></svg>`
  },
  orcid: { class: "icon-orcid", html: `<span class="glyph">iD</span>` },
  researchgate: { class: "icon-researchgate", html: `<span class="glyph">RG</span>` },
  linkedin: { class: "icon-linkedin", html: `<span class="glyph">in</span>` },
  x: { class: "icon-x", html: `<span class="glyph">X</span>` },
  github: {
    class: "icon-github",
    html: `<svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 015.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56A10.52 10.52 0 0023.5 12C23.5 5.73 18.27.5 12 .5z"/></svg>`
  }
};

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

function renderFooterAndNav(p) {
  document.getElementById("brandLink").textContent = p.name.split(" ").slice(-2).join(" ");
  document.getElementById("footerName").textContent = `\u00A9 ${new Date().getFullYear()} ${p.name}`;
  document.getElementById("contactAddress").innerHTML = p.address.join("<br>");
  document.getElementById("navCv").href = p.cvUrl;

  const emailLink = document.getElementById("contactEmail");
  emailLink.href = `mailto:${p.email}`;
  emailLink.textContent = p.email;

  const phoneLink = document.getElementById("contactPhone");
  phoneLink.href = `tel:${p.phone.replace(/\s+/g, "")}`;
  phoneLink.textContent = p.phone;

  const socialRow = document.getElementById("socialRow");
  p.social.forEach(s => {
    const icon = SOCIAL_ICONS[s.icon];
    const a = el("a", {
      class: `social-icon${icon ? " " + icon.class : ""}`,
      html: icon ? icon.html : `<span class="glyph">${s.label.slice(0, 2).toUpperCase()}</span>`,
      attrs: { href: s.url, target: "_blank", rel: "noopener", "aria-label": s.label, title: s.label }
    });
    socialRow.appendChild(a);
  });
}

function renderProject(proj) {
  document.title = `${proj.title} — Orly Enrique Apolo-Apolo, PhD`;

  document.getElementById("detailImage").src = proj.image || "";
  document.getElementById("detailImage").alt = proj.title;
  document.getElementById("detailTitle").textContent = proj.title;
  document.getElementById("detailPeriod").textContent = proj.period || "\u2014";
  document.getElementById("detailPlace").textContent = proj.place || "\u2014";
  document.getElementById("detailFunder").textContent = proj.funder || "\u2014";
  document.getElementById("detailAbstract").textContent = proj.abstract || proj.summary || "";

  const tagRow = document.getElementById("detailTags");
  (proj.tags || []).forEach(t => tagRow.appendChild(el("span", { text: t })));

  if (proj.links && proj.links.length) {
    document.getElementById("detailLinksWrap").style.display = "";
    const ul = document.getElementById("detailLinks");
    proj.links.forEach(l => {
      ul.appendChild(el("li", {}, [
        el("a", { text: l.label, attrs: { href: l.url, target: "_blank", rel: "noopener" } })
      ]));
    });
  }
}

function initNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

async function init() {
  initNav();
  const slug = new URLSearchParams(window.location.search).get("slug");

  const [profileR, projR] = await Promise.allSettled([
    loadJSON("data/profile.json"),
    loadJSON("data/projects.json")
  ]);

  if (profileR.status === "fulfilled") {
    renderFooterAndNav(profileR.value);
  } else {
    console.error("profile.json:", profileR.reason);
  }

  if (projR.status !== "fulfilled") {
    console.error("projects.json:", projR.reason);
    document.querySelector("main").innerHTML =
      `<div class="wrap" style="padding:3rem 0;"><p style="color:#8a3f3f;">
        Could not load data/projects.json \u2014 it likely has a JSON syntax
        error (a common one: a missing comma between entries). Check the
        browser console for details.
      </p></div>`;
    document.querySelector(".detail-header").style.display = "none";
    return;
  }

  const proj = projR.value.find(p => p.slug === slug);
  if (!proj) {
    document.querySelector("main").innerHTML =
      `<div class="wrap" style="padding:3rem 0;"><p>Project not found.
       <a href="index.html#projects" style="border-bottom:1px solid var(--wheat);">Back to projects</a>.</p></div>`;
    document.querySelector(".detail-header").style.display = "none";
    return;
  }
  renderProject(proj);
}

init();
