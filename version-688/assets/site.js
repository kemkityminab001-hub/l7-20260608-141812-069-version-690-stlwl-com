(function () {
    'use strict';

    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function initMenu() {
        var toggle = document.querySelector('[data-menu-toggle]');
        var nav = document.querySelector('[data-mobile-nav]');
        if (!toggle || !nav) {
            return;
        }

        toggle.addEventListener('click', function () {
            nav.classList.toggle('open');
            document.body.classList.toggle('menu-open', nav.classList.contains('open'));
        });
    }

    function initHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }

        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                show(index);
                start();
            });
        });

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function initFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));
        panels.forEach(function (panel) {
            var scope = panel.parentElement || document;
            var search = panel.querySelector('[data-search-input]');
            var year = panel.querySelector('[data-year-filter]');
            var type = panel.querySelector('[data-type-filter]');
            var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));

            function filter() {
                var keyword = search ? search.value.trim().toLowerCase() : '';
                var yearValue = year ? year.value : '';
                var typeValue = type ? type.value : '';

                cards.forEach(function (card) {
                    var text = [
                        card.getAttribute('data-title') || '',
                        card.getAttribute('data-region') || '',
                        card.getAttribute('data-type') || '',
                        card.getAttribute('data-tags') || ''
                    ].join(' ').toLowerCase();
                    var matchedKeyword = !keyword || text.indexOf(keyword) !== -1;
                    var matchedYear = !yearValue || card.getAttribute('data-year') === yearValue;
                    var cardType = card.getAttribute('data-type') || '';
                    var matchedType = !typeValue || cardType.indexOf(typeValue) !== -1;
                    card.hidden = !(matchedKeyword && matchedYear && matchedType);
                });
            }

            if (search) {
                search.addEventListener('input', filter);
            }
            if (year) {
                year.addEventListener('change', filter);
            }
            if (type) {
                type.addEventListener('change', filter);
            }
        });
    }

    function initPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
        players.forEach(function (wrapper) {
            var video = wrapper.querySelector('video');
            var playButton = wrapper.querySelector('[data-play-button]');
            var message = wrapper.querySelector('[data-player-message]');
            var hlsInstance = null;
            var sourceLoaded = false;

            if (!video) {
                return;
            }

            function setMessage(text) {
                if (!message) {
                    return;
                }
                message.textContent = text || '';
                message.classList.toggle('show', Boolean(text));
            }

            function loadSource() {
                var src = video.getAttribute('data-src');
                if (sourceLoaded) {
                    return Promise.resolve();
                }
                if (!src) {
                    setMessage('播放源暂不可用');
                    return Promise.reject(new Error('missing source'));
                }
                sourceLoaded = true;

                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 60
                    });
                    hlsInstance.loadSource(src);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            setMessage('视频加载失败，请刷新后重试');
                        }
                    });
                    return Promise.resolve();
                }

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = src;
                    return Promise.resolve();
                }

                setMessage('当前浏览器不支持此播放源');
                return Promise.reject(new Error('unsupported hls'));
            }

            function play() {
                loadSource()
                    .then(function () {
                        return video.play();
                    })
                    .then(function () {
                        if (playButton) {
                            playButton.classList.add('hidden');
                        }
                        setMessage('');
                    })
                    .catch(function () {
                        if (playButton) {
                            playButton.classList.remove('hidden');
                        }
                    });
            }

            if (playButton) {
                playButton.addEventListener('click', play);
            }

            video.addEventListener('play', function () {
                if (playButton) {
                    playButton.classList.add('hidden');
                }
            });

            video.addEventListener('pause', function () {
                if (video.currentTime === 0 && playButton) {
                    playButton.classList.remove('hidden');
                }
            });

            window.addEventListener('pagehide', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                    hlsInstance = null;
                }
            });
        });
    }

    ready(function () {
        initMenu();
        initHero();
        initFilters();
        initPlayers();
    });
})();
