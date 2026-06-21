(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function currentPageName() {
    var path = window.location.pathname.split("/").pop();
    return path || "index.html";
  }

  ready(function () {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector("[data-menu-toggle]");
    if (header && toggle) {
      toggle.addEventListener("click", function () {
        header.classList.toggle("is-open");
      });
    }

    document.querySelectorAll("[data-site-search]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input");
        var value = input ? input.value.trim() : "";
        if (value) {
          window.location.href = "./library.html?q=" + encodeURIComponent(value);
        }
      });
    });

    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    var active = 0;
    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, idx) {
        slide.classList.toggle("is-active", idx === active);
      });
      dots.forEach(function (dot, idx) {
        dot.classList.toggle("is-active", idx === active);
      });
    }
    dots.forEach(function (dot, idx) {
      dot.addEventListener("click", function () {
        showSlide(idx);
      });
    });
    if (slides.length > 1) {
      showSlide(0);
      window.setInterval(function () {
        showSlide(active + 1);
      }, 5200);
    }

    var searchInput = document.querySelector("[data-search-input]");
    var selects = Array.prototype.slice.call(document.querySelectorAll("[data-filter-attr]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
    var empty = document.querySelector("[data-empty]");
    function applyCards() {
      if (!cards.length) {
        return;
      }
      var q = searchInput ? searchInput.value.trim().toLowerCase() : "";
      var visible = 0;
      cards.forEach(function (card) {
        var text = (card.getAttribute("data-search") || "").toLowerCase();
        var ok = !q || text.indexOf(q) !== -1;
        selects.forEach(function (select) {
          var attr = select.getAttribute("data-filter-attr");
          var value = select.value;
          if (value && card.getAttribute("data-" + attr) !== value) {
            ok = false;
          }
        });
        card.hidden = !ok;
        if (ok) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }
    if (searchInput || selects.length) {
      var params = new URLSearchParams(window.location.search);
      var qValue = params.get("q");
      if (qValue && searchInput) {
        searchInput.value = qValue;
      }
      if (searchInput) {
        searchInput.addEventListener("input", applyCards);
      }
      selects.forEach(function (select) {
        select.addEventListener("change", applyCards);
      });
      applyCards();
    }
  });

  window.initMoviePlayer = function (streamUrl, videoId) {
    ready(function () {
      var video = document.getElementById(videoId || "movieVideo");
      var button = document.querySelector("[data-play]");
      if (!video || !streamUrl) {
        return;
      }
      var hlsInstance = null;
      var loaded = false;
      function attach() {
        if (loaded) {
          return;
        }
        loaded = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            maxBufferLength: 30,
            enableWorker: true
          });
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(video);
        } else {
          video.src = streamUrl;
        }
      }
      function play() {
        attach();
        if (button) {
          button.classList.add("is-hidden");
        }
        var promise = video.play();
        if (promise && promise.catch) {
          promise.catch(function () {});
        }
      }
      if (button) {
        button.addEventListener("click", play);
      }
      video.addEventListener("click", function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener("play", function () {
        if (button) {
          button.classList.add("is-hidden");
        }
      });
      window.addEventListener("pagehide", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  };
})();
