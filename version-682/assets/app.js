const HLS_MIME_TYPE = "application/vnd.apple.mpegurl";

function setupMobileMenu() {
  const button = document.querySelector("[data-mobile-menu-button]");
  const menu = document.querySelector("[data-mobile-menu]");
  if (!button || !menu) {
    return;
  }
  button.addEventListener("click", () => {
    menu.classList.toggle("is-open");
  });
}

function setupHero() {
  const hero = document.querySelector("[data-hero]");
  if (!hero) {
    return;
  }
  const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
  const previous = hero.querySelector("[data-hero-prev]");
  const next = hero.querySelector("[data-hero-next]");
  let current = 0;
  let timer = 0;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("active", slideIndex === current);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === current);
    });
  };

  const restart = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => show(current + 1), 5000);
  };

  previous?.addEventListener("click", () => {
    show(current - 1);
    restart();
  });

  next?.addEventListener("click", () => {
    show(current + 1);
    restart();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      show(Number(dot.dataset.heroDot || 0));
      restart();
    });
  });

  show(0);
  restart();
}

function setupCardSearch() {
  document.querySelectorAll("[data-card-search]").forEach((form) => {
    const input = form.querySelector("input[type='search']");
    const list = document.querySelector("[data-card-list]");
    if (!input || !list) {
      return;
    }
    const cards = Array.from(list.querySelectorAll("[data-card]"));
    const filterCards = () => {
      const query = input.value.trim().toLowerCase();
      cards.forEach((card) => {
        const title = (card.dataset.title || "").toLowerCase();
        const tags = (card.dataset.tags || "").toLowerCase();
        card.classList.toggle("is-hidden", Boolean(query) && !`${title} ${tags}`.includes(query));
      });
    };
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      filterCards();
    });
    input.addEventListener("input", filterCards);
  });
}

function setupGlobalSearch() {
  const page = document.querySelector("[data-search-page]");
  if (!page || !window.SEARCH_MOVIES) {
    return;
  }
  const form = page.querySelector("[data-global-search]");
  const input = form?.querySelector("input[type='search']");
  const results = page.querySelector("[data-search-results]");
  if (!form || !input || !results) {
    return;
  }

  const createCard = (movie) => {
    const meta = [movie.region, movie.type, movie.year].filter(Boolean).join(" · ");
    const searchText = `${movie.title} ${movie.region} ${movie.type} ${movie.year} ${movie.genre} ${movie.tags}`;
    return `
      <article class="movie-card" data-card data-title="${escapeHtml(movie.title)}" data-tags="${escapeHtml(searchText)}">
        <a class="poster-link" href="./${movie.url}" aria-label="观看${escapeHtml(movie.title)}">
          <span class="poster-frame">
            <img src="./${movie.image}" alt="${escapeHtml(movie.title)}" loading="lazy">
            <span class="poster-overlay"><span class="play-dot">▶</span></span>
            <span class="year-badge">${escapeHtml(movie.year)}</span>
          </span>
        </a>
        <div class="card-body">
          <h2><a href="./${movie.url}">${escapeHtml(movie.title)}</a></h2>
          <p class="card-meta">${escapeHtml(meta)}</p>
          <p class="card-line">${escapeHtml(movie.oneLine)}</p>
          <div class="card-tags">${movie.genre.split(/[\/，,、]/).slice(0, 3).map((tag) => `<span>${escapeHtml(tag.trim())}</span>`).join("")}</div>
        </div>
      </article>
    `;
  };

  const runSearch = () => {
    const query = input.value.trim().toLowerCase();
    const source = window.SEARCH_MOVIES;
    const matched = query
      ? source.filter((movie) => `${movie.title} ${movie.region} ${movie.type} ${movie.year} ${movie.genre} ${movie.tags} ${movie.oneLine}`.toLowerCase().includes(query))
      : source.slice(0, 24);
    results.innerHTML = matched.slice(0, 96).map(createCard).join("");
  };

  const params = new URLSearchParams(window.location.search);
  const initial = params.get("q");
  if (initial) {
    input.value = initial;
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch();
  });
  input.addEventListener("input", runSearch);
  runSearch();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setupSearchForms() {
  document.querySelectorAll("[data-search-form]").forEach((form) => {
    form.addEventListener("submit", () => {
      const input = form.querySelector("input[type='search']");
      if (input) {
        input.value = input.value.trim();
      }
    });
  });
}

async function setupPlayers() {
  const players = Array.from(document.querySelectorAll("[data-player]"));
  if (!players.length) {
    return;
  }

  let Hls = null;
  try {
    const module = await import("./hls-module.js");
    Hls = module.H;
  } catch (error) {
    Hls = null;
  }

  players.forEach((player) => {
    const video = player.querySelector("video");
    const button = player.querySelector("[data-play-button]");
    if (!video || !button) {
      return;
    }
    const stream = video.dataset.stream;
    let loaded = false;
    let hlsInstance = null;

    const load = () => {
      if (loaded || !stream) {
        return;
      }
      if (video.canPlayType(HLS_MIME_TYPE)) {
        video.src = stream;
      } else if (Hls && Hls.isSupported && Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: true });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
      } else {
        video.src = stream;
      }
      loaded = true;
    };

    const start = () => {
      load();
      button.classList.add("is-hidden");
      video.controls = true;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          button.classList.remove("is-hidden");
        });
      }
    };

    button.addEventListener("click", start);
    video.addEventListener("click", () => {
      if (video.paused) {
        start();
      }
    });
    player.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        start();
      }
    });
    window.addEventListener("pagehide", () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });

  document.querySelectorAll("[data-start-current-player]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const player = document.querySelector("[data-player]");
      const button = player?.querySelector("[data-play-button]");
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      player?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupHero();
  setupSearchForms();
  setupCardSearch();
  setupGlobalSearch();
  setupPlayers();
});
