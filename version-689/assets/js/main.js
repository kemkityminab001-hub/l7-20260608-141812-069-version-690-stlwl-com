document.addEventListener("DOMContentLoaded", function () {
  setupMobileMenu();
  setupHero();
  setupListingFilters();
  setupPlayer();
});

function setupMobileMenu() {
  var button = document.querySelector("[data-menu-button]");
  var nav = document.querySelector("[data-mobile-nav]");

  if (!button || !nav) {
    return;
  }

  button.addEventListener("click", function () {
    nav.classList.toggle("is-open");
  });
}

function setupHero() {
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));

  if (slides.length === 0) {
    return;
  }

  var active = 0;

  function showSlide(index) {
    active = (index + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("is-active", slideIndex === active);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("is-active", dotIndex === active);
    });
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener("click", function () {
      showSlide(index);
    });
  });

  window.setInterval(function () {
    showSlide(active + 1);
  }, 5200);

  showSlide(0);
}

function setupListingFilters() {
  var search = document.getElementById("siteSearch");
  var typeFilter = document.getElementById("typeFilter");
  var yearSort = document.getElementById("yearSort");
  var grids = Array.prototype.slice.call(document.querySelectorAll("[data-listing-grid]"));

  if (grids.length === 0) {
    return;
  }

  var cards = [];
  grids.forEach(function (grid) {
    Array.prototype.slice.call(grid.querySelectorAll(".movie-card, .rank-item")).forEach(function (card) {
      cards.push(card);
    });
  });

  function matchCard(card) {
    var keyword = search ? search.value.trim().toLowerCase() : "";
    var typeValue = typeFilter ? typeFilter.value : "";
    var text = [
      card.getAttribute("data-title") || "",
      card.getAttribute("data-meta") || "",
      card.textContent || ""
    ].join(" ").toLowerCase();

    var type = card.getAttribute("data-type") || "";

    if (keyword && text.indexOf(keyword) === -1) {
      return false;
    }

    if (typeValue && type.indexOf(typeValue) === -1) {
      return false;
    }

    return true;
  }

  function sortGrid(grid) {
    if (!yearSort) {
      return;
    }

    var direction = yearSort.value === "asc" ? 1 : -1;
    var children = Array.prototype.slice.call(grid.children);

    children.sort(function (a, b) {
      var ay = parseInt(a.getAttribute("data-year") || "0", 10);
      var by = parseInt(b.getAttribute("data-year") || "0", 10);
      return (ay - by) * direction;
    });

    children.forEach(function (child) {
      grid.appendChild(child);
    });
  }

  function update() {
    grids.forEach(sortGrid);

    var visible = 0;
    cards.forEach(function (card) {
      var ok = matchCard(card);
      card.style.display = ok ? "" : "none";
      if (ok) {
        visible += 1;
      }
    });

    Array.prototype.slice.call(document.querySelectorAll("[data-empty-state]")).forEach(function (empty) {
      empty.style.display = visible === 0 ? "block" : "none";
    });
  }

  if (search) {
    search.addEventListener("input", update);
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", update);
  }

  if (yearSort) {
    yearSort.addEventListener("change", update);
  }

  update();
}

function setupPlayer() {
  var wrappers = Array.prototype.slice.call(document.querySelectorAll("[data-player-wrap]"));

  wrappers.forEach(function (wrap) {
    var video = wrap.querySelector("video");
    var button = wrap.querySelector("[data-play]");
    var overlay = wrap.querySelector(".player-overlay");

    if (!video || !button) {
      return;
    }

    var source = video.getAttribute("data-source");

    function start() {
      if (!source) {
        return;
      }

      if (window.Hls && window.Hls.isSupported() && source.indexOf(".m3u8") !== -1) {
        if (!video.hlsInstance) {
          var hls = new window.Hls();
          hls.loadSource(source);
          hls.attachMedia(video);
          video.hlsInstance = hls;
        }
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else {
        video.src = source;
      }

      video.controls = true;

      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }

      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    }

    button.addEventListener("click", start);
    video.addEventListener("click", function () {
      if (video.paused) {
        start();
      }
    });
  });
}
