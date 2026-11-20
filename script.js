document.getElementById("year").textContent = new Date().getFullYear();
const navLinks = document.querySelectorAll(".nav-links a");
const sections = [...document.querySelectorAll("main section[id]")];
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id));
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  sections.forEach((section) => observer.observe(section));
}


// Local portrait and project screenshot fallbacks.
document.querySelectorAll(".portrait-image, .gallery-shot img").forEach((img) => {
  const markLoaded = () => img.classList.add("is-loaded");
  img.addEventListener("load", markLoaded, { once: true });
  if (img.complete && img.naturalWidth > 0) markLoaded();
});

// Reveal sections as they enter the viewport; respect reduced-motion preferences.
const revealTargets = document.querySelectorAll(".section-heading, .project-card, .expertise-grid article, .about-copy, .contact-section, .repo-card");
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
  revealTargets.forEach((item) => item.classList.add("reveal"));
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((item) => revealObserver.observe(item));
}

// Read-only public GitHub API: repository metadata for the featured work.
const featuredRepos = ["sistemmonitoringpbl", "flagloop", "simple-pos-kelompok-02", "PBL-FinanceTracker-Kelompok4"];
const repoGrid = document.getElementById("repo-grid");
if (repoGrid) {
  Promise.all(featuredRepos.map(async (name) => {
    const response = await fetch("https://api.github.com/repos/adzikraaa/" + name, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!response.ok) throw new Error("GitHub API unavailable");
    return response.json();
  })).then((repos) => {
    repoGrid.innerHTML = repos.map((repo) => `
      <article class="repo-card">
        <a href="${repo.html_url}" target="_blank" rel="noreferrer">
          <span class="repo-owner">ADZIKRAAA / REPOSITORY</span>
          <h3>${repo.name}</h3>
          <p>${repo.description || "Public software project."}</p>
          <div class="repo-meta">
            <span><i class="repo-language"></i>${repo.language || "Multiple"}</span>
            <span>★ ${repo.stargazers_count}</span>
            <span>⑂ ${repo.forks_count}</span>
          </div>
        </a>
      </article>`).join("");
  }).catch(() => {
    repoGrid.innerHTML = '<article class="repo-card"><span class="repo-owner">GITHUB / API</span><h3>Repositories on GitHub</h3><p>Live repository statistics are temporarily unavailable. Visit the profile to explore the source code.</p><div class="repo-meta"><a href="https://github.com/adzikraaa" target="_blank" rel="noreferrer">Open GitHub profile ↗</a></div></article>';
  });
}
