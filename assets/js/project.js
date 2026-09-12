function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
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
  try {
    const [profile, projects] = await Promise.all([
      loadJSON("data/profile.json"),
      loadJSON("data/projects.json")
    ]);
    renderFooterAndNav(profile);

    const proj = projects.find(p => p.slug === slug);
    if (!proj) {
      document.querySelector("main").innerHTML =
        `<div class="wrap" style="padding:3rem 0;"><p>Project not found.
         <a href="index.html#projects" style="border-bottom:1px solid var(--wheat);">Back to projects</a>.</p></div>`;
      document.querySelector(".detail-header").style.display = "none";
      return;
    }
    renderProject(proj);
  } catch (err) {
    console.error(err);
    document.querySelector("main").insertAdjacentHTML(
      "afterbegin",
      `<div class="wrap"><p style="color:#8a3f3f;padding:2rem 0;">
        Could not load project content. If you're viewing this file directly
        (file://), run a local server instead \u2014 see README.md.
      </p></div>`
    );
  }
}

init();
