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
document.querySelectorAll(".certificate-art img[data-fallbacks]").forEach((img) => {
  const fallbacks = img.dataset.fallbacks.split("|");
  img.addEventListener("error", () => {
    const nextSource = fallbacks.shift();
    if (nextSource) img.src = nextSource;
  });
});

// Prefer an uploaded certificate PDF when it exists; otherwise retain the image preview.
const certificatePdfPath = "assets/certificates/revou-software-engineering.pdf";
const certificatePdfViewer = document.querySelector(".certificate-pdf");
if (certificatePdfViewer) {
  fetch(certificatePdfPath, { method: "HEAD" }).then((response) => {
    if (!response.ok) return;
    certificatePdfViewer.src = certificatePdfPath;
    certificatePdfViewer.hidden = false;
    document.querySelector(".certificate-art img")?.setAttribute("hidden", "");
    document.querySelector(".certificate-placeholder")?.setAttribute("hidden", "");
    const pdfLink = document.querySelector(".certificate-pdf-link");
    if (pdfLink) pdfLink.hidden = false;
  }).catch(() => {});
}

document.querySelectorAll(".portrait-image, .cinematic-photo img, .gallery-shot img, .certificate-art img, .experience-photo img").forEach((img) => {
  const markLoaded = () => img.classList.add("is-loaded");
  img.addEventListener("load", markLoaded, { once: true });
  if (img.complete && img.naturalWidth > 0) markLoaded();
});

// Horizontal project screenshot galleries: touch/trackpad scrolling plus arrow controls.
document.querySelectorAll(".gallery-arrow").forEach((button) => {
  button.addEventListener("click", () => {
    const gallery = button.closest(".project-visual")?.querySelector(".project-gallery");
    if (!gallery) return;
    const direction = button.classList.contains("gallery-next") ? 1 : -1;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    gallery.scrollBy({ left: direction * gallery.clientWidth, behavior });
  });
});

// Reveal sections as they enter the viewport; respect reduced-motion preferences.
const revealTargets = document.querySelectorAll(".about-copy, .contact-section");
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
const featuredRepos = ["sistemmonitoringpbl", "flagloop", "PBL-FinanceTracker-Kelompok4"];
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

  // Scroll-driven cinematic card reveal, followed by the personal introduction.
  const introSection = document.querySelector(".cinematic-intro");
  const introStage = document.querySelector("[data-cinematic-stage]");
  if (!reduceMotion && window.gsap && window.ScrollTrigger && introSection && introStage) {
    gsap.registerPlugin(ScrollTrigger);
    const introTitle = document.querySelector("[data-cinematic-title]");
    const introPhoto = document.querySelector("[data-cinematic-photo]");
    const introBio = document.querySelector("[data-cinematic-bio]");
    const introBeam = document.querySelector(".cinematic-beam");
    const scrollCue = document.querySelector("[data-cinematic-cue]");
    const header = document.querySelector(".site-header");
    const reveal = gsap.timeline({
      scrollTrigger: {
        trigger: introSection,
        pin: introStage,
        start: () => "top top+=" + (header?.offsetHeight || 76),
        // Keep the profile pinned long enough to read before moving to the stack section.
        end: () => "+=" + Math.round(window.innerHeight * 2.2),
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
    reveal.fromTo(introPhoto, { clipPath: "inset(0 0 100% 0 round 24px)", scale: 1.08 }, { clipPath: "inset(0 0 0% 0 round 24px)", scale: 1, ease: "none", duration: 0.75 }, 0);
    reveal.fromTo(introBeam, { opacity: 0.12, scaleX: 0.35, rotate: -13 }, { opacity: 0.9, scaleX: 1, rotate: 0, ease: "none", duration: 0.8 }, 0);
    reveal.to(introTitle, { y: -72, scale: 0.78, opacity: 0.28, transformOrigin: "left top", ease: "none", duration: 0.75 }, 0.12);
    reveal.fromTo(introBio, { y: 54, opacity: 0 }, { y: 0, opacity: 1, ease: "none", duration: 0.55 }, 0.52);
    reveal.to(scrollCue, { y: 18, opacity: 0, ease: "none", duration: 0.22 }, 0);
    // Hold the fully revealed profile briefly before the pinned intro releases.
    reveal.to(introBio, { y: 0, opacity: 1, ease: "none", duration: 1 });
  }

  // Reveal the technology icons in their own section, after the profile intro.
  const stackStrip = document.querySelector(".stack-strip");
  const stackLogoTrack = document.querySelector(".stack-marquee-track");
  const originalStackLogos = stackLogoTrack?.querySelector(".stack-logos");
  if (originalStackLogos && stackLogoTrack.children.length === 1) {
    const repeatedStackLogos = originalStackLogos.cloneNode(true);
    repeatedStackLogos.setAttribute("aria-hidden", "true");
    repeatedStackLogos.querySelectorAll("img").forEach((img) => { img.alt = ""; });
    stackLogoTrack.append(repeatedStackLogos);
  }
  const stackItems = window.gsap && window.ScrollTrigger ? window.gsap.utils.toArray(".stack-logos .stack-item") : [];
  if (!reduceMotion && window.gsap && window.ScrollTrigger && stackStrip && stackItems.length) {
    gsap.fromTo(stackItems, { y: 22, autoAlpha: 0 }, {
      y: 0,
      autoAlpha: 1,
      stagger: 0.08,
      duration: 0.55,
      ease: "power2.out",
      scrollTrigger: {
        trigger: stackStrip,
        start: "top 82%",
        once: true
      }
    });
  }

  // Scroll progress indicator.
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // Cinematic horizontal project track on desktop; keep the mobile/reduced-motion layout vertical.
  const projectTrack = document.querySelector(".projects-track");
  const projectViewport = document.querySelector(".projects-viewport");
  const desktopProjects = window.matchMedia("(min-width: 901px)").matches;
  if (!reduceMotion && desktopProjects && window.gsap && window.ScrollTrigger && projectTrack && projectViewport) {
    gsap.registerPlugin(ScrollTrigger);
    const horizontalProjects = gsap.to(projectTrack, {
      x: () => -Math.max(0, projectTrack.scrollWidth - projectViewport.clientWidth),
      ease: "none",
      scrollTrigger: {
        trigger: "#work",
        start: "top top+=76",
        end: () => "+=" + Math.max(0, projectTrack.scrollWidth - projectViewport.clientWidth),
        pin: projectViewport,
        scrub: 0.75,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    gsap.utils.toArray(".projects-track .project-card").forEach((card) => {
      gsap.fromTo(card, { scale: 0.94, filter: "saturate(.72)", boxShadow: "0 8px 20px rgba(14,47,118,.04)" }, {
        scale: 1,
        filter: "saturate(1.12)",
        boxShadow: "0 28px 90px rgba(14,47,118,.2)",
        ease: "none",
        scrollTrigger: {
          trigger: card,
          containerAnimation: horizontalProjects,
          start: "left 92%",
          end: "left 48%",
          scrub: 0.6
        }
      });
    });
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
  [".expertise-grid", ".experience-list", ".repo-grid"].forEach((selector) => {
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


// Cinematic scroll accents: clipped image entrances and restrained depth drift.
(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !window.gsap || !window.ScrollTrigger) return;
  gsap.utils.toArray(".project-visual").forEach((visual) => {
    gsap.fromTo(visual, { clipPath: "inset(8% 5% 8% 5% round 18px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 0px)",
      duration: 1.05, ease: "power3.out",
      scrollTrigger: { trigger: visual, start: "top 88%", once: true }
    });
  });
  gsap.utils.toArray(".bizprice-orbit").forEach((orbit) => {
    gsap.to(orbit, {
      rotation: 360, duration: 42, ease: "none", repeat: -1,
      transformOrigin: "50% 50%"
    });
  });
  gsap.utils.toArray(".motion-marquee").forEach((marquee) => {
    gsap.from(marquee, {
      opacity: 0, y: 28, duration: .8, ease: "power3.out",
      scrollTrigger: { trigger: marquee, start: "top 92%", once: true }
    });
  });
})();
