(function () {
    var menuButton = document.querySelector('[data-menu-button]');
    var mobilePanel = document.querySelector('[data-mobile-panel]');
    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', function () {
            mobilePanel.classList.toggle('is-open');
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    var prev = document.querySelector('[data-hero-prev]');
    var next = document.querySelector('[data-hero-next]');
    var index = 0;
    function showSlide(nextIndex) {
        if (!slides.length) {
            return;
        }
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, itemIndex) {
            slide.classList.toggle('is-active', itemIndex === index);
        });
        dots.forEach(function (dot, itemIndex) {
            dot.classList.toggle('is-active', itemIndex === index);
        });
    }
    if (slides.length) {
        showSlide(0);
        if (prev) {
            prev.addEventListener('click', function () {
                showSlide(index - 1);
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                showSlide(index + 1);
            });
        }
        dots.forEach(function (dot, itemIndex) {
            dot.addEventListener('click', function () {
                showSlide(itemIndex);
            });
        });
        window.setInterval(function () {
            showSlide(index + 1);
        }, 5800);
    }

    var filterScopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));
    filterScopes.forEach(function (scope) {
        var input = scope.querySelector('[data-filter-input]');
        var select = scope.querySelector('[data-filter-select]');
        var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-card]'));
        var empty = scope.querySelector('[data-no-result]');
        function applyFilter() {
            var term = input ? input.value.trim().toLowerCase() : '';
            var kind = select ? select.value : '';
            var shown = 0;
            cards.forEach(function (card) {
                var pool = (card.getAttribute('data-filter') || '').toLowerCase();
                var cardKind = card.getAttribute('data-kind') || '';
                var matchedText = !term || pool.indexOf(term) !== -1;
                var matchedKind = !kind || cardKind === kind;
                var visible = matchedText && matchedKind;
                card.style.display = visible ? '' : 'none';
                if (visible) {
                    shown += 1;
                }
            });
            if (empty) {
                empty.classList.toggle('is-show', shown === 0);
            }
        }
        if (input) {
            input.addEventListener('input', applyFilter);
        }
        if (select) {
            select.addEventListener('change', applyFilter);
        }
        applyFilter();
    });

    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    players.forEach(function (player) {
        var video = player.querySelector('video');
        var cover = player.querySelector('.player-cover');
        var stream = player.getAttribute('data-stream');
        var ready = false;
        var hls = null;
        function prepare() {
            if (ready || !video || !stream) {
                return;
            }
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = stream;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    maxBufferLength: 45,
                    lowLatencyMode: true
                });
                hls.loadSource(stream);
                hls.attachMedia(video);
            } else {
                video.src = stream;
            }
            video.setAttribute('controls', 'controls');
            ready = true;
        }
        function start() {
            prepare();
            if (cover) {
                cover.classList.add('is-hidden');
            }
            if (video) {
                video.play().catch(function () {});
            }
        }
        if (cover) {
            cover.addEventListener('click', start);
        }
        if (video) {
            video.addEventListener('click', function () {
                if (!ready || video.paused) {
                    start();
                } else {
                    video.pause();
                }
            });
            video.addEventListener('ended', function () {
                if (hls && hls.destroy) {
                    hls.destroy();
                }
            });
        }
    });
})();
