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
const revealTargets = document.querySelectorAll(".project-card, .about-copy, .contact-section");
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


// ===== Motion system v2 =====
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const progress = document.querySelector(".scroll-progress span");
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorRing = document.querySelector(".cursor-ring");

  // Accessible, low-friction smooth scrolling.
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.9 });
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  // Hero: staggered text entrance and portrait reveal.
  const heroCopy = document.querySelector("[data-hero-copy]");
  const heroItems = heroCopy ? [
    heroCopy.querySelector(".eyebrow"),
    heroCopy.querySelector(".hero-title"),
    heroCopy.querySelector(".hero-lead"),
    heroCopy.querySelector(".hero-actions"),
    heroCopy.querySelector(".hero-note")
  ].filter(Boolean) : [];
  heroItems.forEach((item) => item.setAttribute("data-hero-item", ""));
  if (!reduceMotion && window.gsap) {
    gsap.to(heroItems, { y: 0, opacity: 1, duration: 0.85, stagger: 0.12, ease: "power3.out", delay: 0.12 });
    gsap.to("[data-hero-portrait]", { opacity: 1, clipPath: "inset(0% 0% 0% 0% round 46% 46% 18px 18px)", duration: 1.15, ease: "power3.inOut", delay: 0.42 });
  } else {
    heroItems.forEach((item) => { item.style.opacity = "1"; item.style.transform = "none"; });
    const portrait = document.querySelector("[data-hero-portrait]");
    if (portrait) { portrait.style.opacity = "1"; portrait.style.clipPath = "none"; }
  }

  // Scroll progress indicator.
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // Horizontal pinned project story on desktop; normal stacked cards on smaller screens.
  const track = document.querySelector(".projects-track");
  const viewport = document.querySelector(".projects-viewport");
  const desktop = window.matchMedia("(min-width: 901px)");
  if (!reduceMotion && window.gsap && window.ScrollTrigger && track && viewport && desktop.matches) {
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    if (distance() > 40) {
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: "#work",
          start: "top top+=76",
          end: () => "+=" + distance(),
          pin: viewport,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
    }
  }

  // Gentle depth on project cards, not a heavy 3D tilt.
  if (!reduceMotion && window.gsap && finePointer) {
    document.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        const visual = card.querySelector(".project-visual");
        if (visual) visual.style.transform = "perspective(900px) rotateX(" + (-y * 1.2) + "deg) rotateY(" + (x * 1.2) + "deg)";
      });
      card.addEventListener("pointerleave", () => {
        const visual = card.querySelector(".project-visual");
        if (visual) visual.style.transform = "";
      });
    });
  }

  // Magnetic pull for primary actions on precise-pointer devices only.
  if (!reduceMotion && finePointer) {
    document.querySelectorAll(".button-primary,.button-light,.nav-cta").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const rect = element.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        element.style.transform = "translate(" + (dx * 0.08) + "px," + (dy * 0.12) + "px)";
      });
      element.addEventListener("pointerleave", () => { element.style.transform = ""; });
    });
  }

  // Custom cursor is deliberately limited to desktop pointer devices.
  if (!reduceMotion && finePointer && cursorDot && cursorRing) {
    let x = innerWidth / 2, y = innerHeight / 2, ringX = x, ringY = y;
    document.addEventListener("pointermove", (event) => {
      x = event.clientX; y = event.clientY;
      cursorDot.style.transform = "translate(" + x + "px," + y + "px) translate(-50%,-50%)";
      document.body.classList.add("motion-ready");
    });
    const follow = () => {
      ringX += (x - ringX) * 0.16;
      ringY += (y - ringY) * 0.16;
      cursorRing.style.transform = "translate(" + ringX + "px," + ringY + "px) translate(-50%,-50%)";
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
    document.querySelectorAll("a,button,.gallery-shot").forEach((target) => {
      target.addEventListener("pointerenter", () => cursorRing.classList.add("is-hover"));
      target.addEventListener("pointerleave", () => cursorRing.classList.remove("is-hover"));
    });
  }

  // Refresh pinned measurements after fonts and images settle.
  if (window.ScrollTrigger) {
    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
    window.addEventListener("resize", () => ScrollTrigger.refresh(), { passive: true });
  }
})();


// Professional motion polish: staggered section entrances and resilient image states.
(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // Stagger cards and capability tiles as cohesive groups.
  [".expertise-grid", ".repo-grid"].forEach((selector) => {
    const group = document.querySelector(selector);
    if (!group) return;
    const items = group.children;
    gsap.from(items, {
      y: 24, opacity: 0, duration: 0.65, stagger: 0.09, ease: "power2.out",
      scrollTrigger: { trigger: group, start: "top 82%", once: true }
    });
  });

  // Section titles reveal with a small vertical movement, avoiding split-text dependencies.
  document.querySelectorAll(".section-heading h2, .about-label h2").forEach((heading) => {
    gsap.from(heading, {
      y: 22, opacity: 0, duration: 0.75, ease: "power3.out",
      scrollTrigger: { trigger: heading, start: "top 88%", once: true }
    });
  });

  // Make image placeholders robust when an image path is not present yet.
  document.querySelectorAll(".gallery-shot img").forEach((img) => {
    const figure = img.closest(".gallery-shot");
    const sync = () => {
      if (img.naturalWidth > 0) {
        img.classList.add("is-loaded");
        figure?.classList.add("has-image");
      } else {
        img.classList.remove("is-loaded");
        figure?.classList.remove("has-image");
      }
    };
    img.addEventListener("load", sync);
    img.addEventListener("error", sync);
    if (img.complete) sync();
  });
})();
