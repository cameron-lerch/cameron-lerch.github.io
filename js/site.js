/* Site-specific behaviour: generic modals and YouTube embeds. */
(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Modals: any element with data-modal="id" opens <div id="id" class="modal">
  // ---------------------------------------------------------------------
  var lastTrigger = null;

  function openModal(id, trigger) {
    var modal = document.getElementById(id);
    if (!modal) return;
    lastTrigger = trigger || null;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    var close = modal.querySelector('.close');
    if (close) close.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    // stop any playing media inside the modal
    modal.querySelectorAll('video').forEach(function (v) { v.pause(); });
    modal.querySelectorAll('iframe').forEach(function (f) { f.src = f.src; });
    if (lastTrigger) lastTrigger.focus();
  }

  function openModals() {
    return Array.prototype.filter.call(document.querySelectorAll('.modal'), function (m) {
      return m.style.display === 'block' && !m.classList.contains('video-modal');
    });
  }

  document.querySelectorAll('[data-modal]').forEach(function (el) {
    el.addEventListener('click', function () { openModal(el.getAttribute('data-modal'), el); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(el.getAttribute('data-modal'), el);
      }
    });
  });

  document.querySelectorAll('.modal').forEach(function (modal) {
    var close = modal.querySelector('.close');
    if (close) {
      close.setAttribute('tabindex', '0');
      close.setAttribute('role', 'button');
      close.addEventListener('click', function () { closeModal(modal); });
      close.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeModal(modal); }
      });
    }
    // click on the dimmed backdrop closes
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal(modal);
    });
    // links inside a modal that jump elsewhere on the page close it first
    modal.querySelectorAll('[data-close-modal]').forEach(function (a) {
      a.addEventListener('click', function () { lastTrigger = null; closeModal(modal); });
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') openModals().forEach(closeModal);
  });

  // ---------------------------------------------------------------------
  // Video pop-ups: <button class="video-link" data-video="YOUTUBE_ID" data-video-title="...">
  // One shared modal; the iframe is created on open and removed on close so playback stops.
  // ---------------------------------------------------------------------
  var videoModal = null;

  function closeVideoModal() {
    if (!videoModal) return;
    videoModal.style.display = 'none';
    videoModal.querySelector('.demo-media').innerHTML = '';
    document.body.style.overflow = '';
    if (lastTrigger) lastTrigger.focus();
  }

  function openVideoModal(id, title, trigger, external, poster) {
    if (!videoModal) {
      videoModal = document.createElement('div');
      videoModal.className = 'modal video-modal';
      videoModal.setAttribute('role', 'dialog');
      videoModal.setAttribute('aria-modal', 'true');
      videoModal.innerHTML =
        '<div class="modal-content">' +
        '<span class="close" role="button" tabindex="0" aria-label="Close">&times;</span>' +
        '<div class="demo-media"></div>' +
        '<a class="video-yt-link" target="_blank" rel="noopener">Video not playing? Watch on YouTube <i class="ion-android-open"></i></a></div>';
      document.body.appendChild(videoModal);
      var x = videoModal.querySelector('.close');
      x.addEventListener('click', closeVideoModal);
      x.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeVideoModal(); }
      });
      videoModal.addEventListener('click', function (e) { if (e.target === videoModal) closeVideoModal(); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && videoModal.style.display === 'block') closeVideoModal();
      });
    }
    lastTrigger = trigger || null;
    videoModal.querySelector('.video-yt-link').href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
    var media = videoModal.querySelector('.demo-media');
    var ytUrl = 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
    videoModal.querySelector('.video-yt-link').style.display = external ? 'none' : '';
    if (external) {
      // YouTube blocks this video outside youtube.com: show the photo and a button instead of a broken player.
      media.innerHTML =
        '<div class="video-external"' + (poster ? ' style="background-image:url(\'' + poster + '\')"' : '') + '>' +
        '<div class="video-external-inner"><p>This video can only be played on YouTube.</p>' +
        '<a class="button" target="_blank" rel="noopener" href="' + ytUrl + '"><i class="ion-social-youtube"></i>&nbsp; Watch on YouTube</a></div></div>';
      videoModal.style.display = 'block';
      document.body.style.overflow = 'hidden';
      videoModal.querySelector('.close').focus();
      return;
    }
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
    iframe.title = title || 'Video';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    media.appendChild(iframe);
    videoModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    videoModal.querySelector('.close').focus();
  }

  // Delegated so it also works on the copies a looping carousel makes of each card.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.video-link[data-video]') : null;
    if (!btn) return;
    e.preventDefault();
    openVideoModal(btn.getAttribute('data-video'), btn.getAttribute('data-video-title'), btn,
                   btn.hasAttribute('data-video-external'), btn.getAttribute('data-video-poster'));
  });

  // ---------------------------------------------------------------------
  // FIRST Robotics carousel (Owl Carousel, already loaded on the home page)
  // ---------------------------------------------------------------------
  if (window.jQuery && jQuery.fn.owlCarousel && document.querySelector('.first-carousel')) {
    jQuery('.first-carousel').owlCarousel({
      loop: true,
      margin: 24,
      nav: true,
      navText: ['<i class="ion-chevron-left"></i>', '<i class="ion-chevron-right"></i>'],
      dots: true,
      autoWidth: true,   // card widths come from CSS (Notable Awards is wider)
      autoplay: true,
      autoplayTimeout: 6000,
      autoplayHoverPause: true,
      smartSpeed: 700,
      responsive: { 0: { items: 1 }, 700: { items: 2 }, 1100: { items: 3 } }
    });
  }

  // ---------------------------------------------------------------------
  // Demo media: <div class="demo-media" data-youtube="VIDEO_ID">
  // Empty data-youtube shows a "video coming soon" placeholder.
  // ---------------------------------------------------------------------
  document.querySelectorAll('.demo-media[data-youtube]').forEach(function (box) {
    var id = (box.getAttribute('data-youtube') || '').trim();
    if (!id) {
      box.innerHTML = '<div class="demo-placeholder"><i class="ion-ios-videocam-outline"></i>Video coming soon</div>';
      return;
    }
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?rel=0';
    iframe.title = 'Demo video';
    iframe.loading = 'lazy';
    // YouTube rejects embeds without a Referer (error 153); send the origin explicitly.
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    box.appendChild(iframe);
  });
})();
