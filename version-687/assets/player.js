import { H as Hls } from './hls-dru42stk.js';

document.querySelectorAll('[data-player]').forEach((player) => {
  const video = player.querySelector('video');
  const startButton = player.querySelector('[data-player-start]');
  const status = player.querySelector('[data-player-status]');
  const src = player.dataset.src;
  let initialized = false;

  const setStatus = (message) => {
    if (status) {
      status.textContent = message;
    }
  };

  const initializePlayer = async () => {
    if (!video || !src || initialized) {
      return;
    }

    initialized = true;
    setStatus('正在加载播放源...');

    try {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data && data.fatal) {
            setStatus('播放源加载异常，请刷新后重试。');
          }
        });
      } else {
        setStatus('当前浏览器暂不支持 HLS 播放。');
        return;
      }

      if (startButton) {
        startButton.classList.add('is-hidden');
      }

      await video.play();
      setStatus('正在播放');
    } catch (error) {
      setStatus('浏览器阻止了自动播放，请再次点击播放按钮。');
      if (startButton) {
        startButton.classList.remove('is-hidden');
      }
      initialized = false;
    }
  };

  if (startButton) {
    startButton.addEventListener('click', initializePlayer);
  }

  if (video) {
    video.addEventListener('play', () => {
      if (startButton) {
        startButton.classList.add('is-hidden');
      }
    });
  }
});
