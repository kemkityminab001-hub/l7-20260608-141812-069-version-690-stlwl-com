(function () {
    function setupVideo(shell) {
        var video = shell.querySelector('video');
        if (!video || video.getAttribute('data-ready') === '1') {
            return video;
        }

        var url = video.getAttribute('data-url');
        if (!url) {
            return video;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
        } else if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });
            hls.loadSource(url);
            hls.attachMedia(video);
            video.hlsInstance = hls;
        } else {
            video.src = url;
        }

        video.setAttribute('data-ready', '1');
        return video;
    }

    function play(shell) {
        var video = setupVideo(shell);
        if (!video) {
            return;
        }

        shell.classList.add('playing');
        var request = video.play();
        if (request && typeof request.catch === 'function') {
            request.catch(function () {
                shell.classList.remove('playing');
            });
        }
    }

    document.querySelectorAll('[data-video-shell]').forEach(function (shell) {
        var button = shell.querySelector('[data-play-button]');
        var video = shell.querySelector('video');

        if (button) {
            button.addEventListener('click', function () {
                play(shell);
            });
        }

        if (video) {
            video.addEventListener('click', function () {
                if (video.paused) {
                    play(shell);
                }
            });
            video.addEventListener('play', function () {
                shell.classList.add('playing');
            });
            video.addEventListener('pause', function () {
                if (video.currentTime === 0) {
                    shell.classList.remove('playing');
                }
            });
        }
    });
})();
