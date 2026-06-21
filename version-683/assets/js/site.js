(function () {
  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!button || !menu) {
      return;
    }
    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function initImages() {
    var images = document.querySelectorAll("img[data-cover]");
    images.forEach(function (image) {
      image.addEventListener("error", function () {
        image.classList.add("image-off");
      });
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var next = hero.querySelector("[data-hero-next]");
    var prev = hero.querySelector("[data-hero-prev]");
    var index = 0;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
      });
    }
    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
      });
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
      });
    });
    window.setInterval(function () {
      show(index + 1);
    }, 5000);
  }

  function initSearch() {
    var form = document.querySelector("[data-search-form]");
    if (!form) {
      return;
    }
    var input = form.querySelector("[data-search-input]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
    var yearSelect = document.querySelector("[data-filter-year]");
    var regionSelect = document.querySelector("[data-filter-region]");
    var emptyState = document.querySelector("[data-empty-state]");
    var params = new URLSearchParams(window.location.search);
    var queryFromUrl = params.get("q") || "";

    if (input && queryFromUrl) {
      input.value = queryFromUrl;
    }

    function applyFilters() {
      var query = normalize(input ? input.value : "");
      var year = normalize(yearSelect ? yearSelect.value : "");
      var region = normalize(regionSelect ? regionSelect.value : "");
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-year"),
          card.getAttribute("data-region"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags")
        ].join(" "));
        var matchesQuery = !query || haystack.indexOf(query) !== -1;
        var matchesYear = !year || normalize(card.getAttribute("data-year")) === year;
        var matchesRegion = !region || normalize(card.getAttribute("data-region")) === region;
        var show = matchesQuery && matchesYear && matchesRegion;
        card.style.display = show ? "" : "none";
        if (show) {
          visible += 1;
        }
      });

      if (emptyState) {
        emptyState.classList.toggle("is-visible", visible === 0);
      }
    }

    form.addEventListener("submit", function (event) {
      if (form.hasAttribute("data-redirect-search")) {
        return;
      }
      event.preventDefault();
      applyFilters();
    });

    if (input) {
      input.addEventListener("input", applyFilters);
    }
    if (yearSelect) {
      yearSelect.addEventListener("change", applyFilters);
    }
    if (regionSelect) {
      regionSelect.addEventListener("change", applyFilters);
    }
    if (cards.length) {
      applyFilters();
    }
  }

  function initPlayers() {
    var players = document.querySelectorAll("[data-player]");
    players.forEach(function (player) {
      var video = player.querySelector("video[data-stream]");
      var trigger = player.querySelector("[data-play-trigger]");
      if (!video) {
        return;
      }
      var stream = video.getAttribute("data-stream");
      var hlsInstance = null;
      var ready = false;

      function playNow() {
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {});
        }
      }

      function prepareStream(callback) {
        if (ready) {
          callback();
          return;
        }
        ready = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
          callback();
          return;
        }
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          var done = false;
          var run = function () {
            if (done) {
              return;
            }
            done = true;
            callback();
          };
          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, run);
          window.setTimeout(run, 1200);
          return;
        }
        video.src = stream;
        callback();
      }

      function start() {
        player.classList.add("is-playing");
        prepareStream(playNow);
      }

      if (trigger) {
        trigger.addEventListener("click", start);
      }
      video.addEventListener("click", function () {
        if (video.paused) {
          start();
        }
      });
      video.addEventListener("play", function () {
        player.classList.add("is-playing");
      });
      window.addEventListener("pagehide", function () {
        if (hlsInstance && typeof hlsInstance.destroy === "function") {
          hlsInstance.destroy();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initImages();
    initHero();
    initSearch();
    initPlayers();
  });
})();
