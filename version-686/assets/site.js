(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initMobileMenu() {
    var button = document.querySelector('.mobile-menu-toggle');
    var menu = document.getElementById('mobile-nav');

    if (!button || !menu) {
      return;
    }

    button.addEventListener('click', function () {
      var expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      menu.hidden = expanded;
      button.textContent = expanded ? '☰' : '×';
    });
  }

  function initHeroSlider() {
    var slider = document.querySelector('[data-hero-slider]');

    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    var activeIndex = 0;
    var timer = null;

    function activate(index) {
      activeIndex = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === activeIndex);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === activeIndex);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        activate(activeIndex + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        activate(index);
        start();
      });
    });

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    start();
  }

  function initFilterPanel() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-filter-card]'));
    var keywordInput = document.querySelector('[data-filter-input]');
    var categorySelect = document.querySelector('[data-filter-category]');
    var yearSelect = document.querySelector('[data-filter-year]');
    var resetButton = document.querySelector('[data-filter-reset]');
    var countNode = document.querySelector('[data-filter-count]');
    var emptyNode = document.querySelector('[data-filter-empty]');

    if (!cards.length || !keywordInput) {
      return;
    }

    function normalize(value) {
      return String(value || '').toLowerCase().trim();
    }

    function applyFilters() {
      var keyword = normalize(keywordInput.value);
      var category = categorySelect ? categorySelect.value : '';
      var year = yearSelect ? yearSelect.value : '';
      var visibleCount = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.dataset.title,
          card.dataset.category,
          card.dataset.region,
          card.dataset.year,
          card.dataset.genre,
          card.dataset.tags
        ].join(' '));
        var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchesCategory = !category || card.dataset.category === category;
        var matchesYear = !year || card.dataset.year === year;
        var visible = matchesKeyword && matchesCategory && matchesYear;

        card.hidden = !visible;
        if (visible) {
          visibleCount += 1;
        }
      });

      if (countNode) {
        countNode.textContent = '当前显示 ' + visibleCount + ' 部影片';
      }

      if (emptyNode) {
        emptyNode.hidden = visibleCount !== 0;
      }
    }

    keywordInput.addEventListener('input', applyFilters);

    if (categorySelect) {
      categorySelect.addEventListener('change', applyFilters);
    }

    if (yearSelect) {
      yearSelect.addEventListener('change', applyFilters);
    }

    if (resetButton) {
      resetButton.addEventListener('click', function () {
        keywordInput.value = '';

        if (categorySelect) {
          categorySelect.value = '';
        }

        if (yearSelect) {
          yearSelect.value = '';
        }

        applyFilters();
      });
    }

    applyFilters();
  }

  function initPlayer() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

    players.forEach(function (container) {
      var video = container.querySelector('video');
      var button = container.querySelector('[data-play-button]');
      var status = container.querySelector('[data-player-status]');
      var sidePlay = document.querySelector('[data-side-play]');
      var source = video ? video.dataset.src : '';
      var hlsInstance = null;
      var started = false;

      if (!video || !source || !button) {
        return;
      }

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function playVideo() {
        var playPromise = video.play();

        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            setStatus('浏览器阻止了自动播放，请再次点击视频播放。');
          });
        }
      }

      function startPlayer() {
        if (started) {
          playVideo();
          return;
        }

        started = true;
        video.setAttribute('controls', 'controls');
        setStatus('正在加载播放源...');

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });

          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            container.classList.add('is-playing');
            setStatus('播放源已就绪。');
            playVideo();
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (!data || !data.fatal) {
              return;
            }

            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              setStatus('网络加载异常，正在重新尝试。');
              hlsInstance.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              setStatus('媒体解码异常，正在恢复。');
              hlsInstance.recoverMediaError();
            } else {
              setStatus('播放源暂时无法加载，请刷新后重试。');
              hlsInstance.destroy();
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.addEventListener('loadedmetadata', function () {
            container.classList.add('is-playing');
            setStatus('播放源已就绪。');
            playVideo();
          }, { once: true });
        } else {
          video.src = source;
          container.classList.add('is-playing');
          setStatus('当前浏览器未启用 HLS.js，已尝试直接加载播放源。');
          playVideo();
        }
      }

      button.addEventListener('click', startPlayer);

      if (sidePlay) {
        sidePlay.addEventListener('click', function (event) {
          event.preventDefault();
          window.scrollTo({ top: container.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
          startPlayer();
        });
      }

      video.addEventListener('play', function () {
        container.classList.add('is-playing');
      });

      video.addEventListener('pause', function () {
        if (!video.ended) {
          container.classList.remove('is-playing');
        }
      });
    });
  }

  function movieCardHtml(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return [
      '<article class="movie-card">',
      '  <a href="' + escapeHtml(movie.page) + '" class="movie-card-link">',
      '    <div class="movie-poster-wrap">',
      '      <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + ' 海报" class="movie-poster" loading="lazy">',
      '      <div class="movie-poster-overlay"><span class="play-chip">▶ 立即播放</span></div>',
      '    </div>',
      '    <div class="movie-card-body">',
      '      <div class="movie-meta-line"><span>' + escapeHtml(movie.category) + '</span><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span></div>',
      '      <h3>' + escapeHtml(movie.title) + '</h3>',
      '      <p>' + escapeHtml(movie.oneLine) + '</p>',
      '      <div class="movie-tags">' + tags + '</div>',
      '    </div>',
      '  </a>',
      '</article>'
    ].join('');
  }

  function initSearchPage() {
    var results = document.querySelector('[data-search-results]');
    var summary = document.querySelector('[data-search-summary]');
    var input = document.querySelector('[data-search-page-input]');
    var suggestions = document.querySelector('[data-search-suggestions]');

    if (!results || !window.MOVIES) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';

    if (input) {
      input.value = query;
    }

    if (!query.trim()) {
      return;
    }

    var normalizedQuery = query.toLowerCase().trim();
    var matched = window.MOVIES.filter(function (movie) {
      var haystack = [
        movie.title,
        movie.oneLine,
        movie.category,
        movie.region,
        movie.year,
        movie.genre,
        (movie.tags || []).join(' ')
      ].join(' ').toLowerCase();

      return haystack.indexOf(normalizedQuery) !== -1;
    });

    if (summary) {
      summary.textContent = '“' + query + '” 找到 ' + matched.length + ' 个相关视频';
    }

    if (suggestions) {
      suggestions.hidden = true;
    }

    if (matched.length) {
      results.innerHTML = matched.slice(0, 200).map(movieCardHtml).join('');
    } else {
      results.innerHTML = '<div class="empty-state">未找到相关影片，换个关键词试试。</div>';
    }
  }

  ready(function () {
    initMobileMenu();
    initHeroSlider();
    initFilterPanel();
    initPlayer();
    initSearchPage();
  });
}());
