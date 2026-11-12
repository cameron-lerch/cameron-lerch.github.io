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

  // Delegated, so it also works on the copies a looping carousel makes of each card.
  function modalTrigger(e) {
    var el = e.target.closest ? e.target.closest('[data-modal]') : null;
    if (!el) return null;
    // the "Details" link on an Experience tile goes to its page instead of opening the pop-up
    if (e.target.closest('.tile-details')) return null;
    return el;
  }
  document.addEventListener('click', function (e) {
    var el = modalTrigger(e);
    if (!el) return;
    e.preventDefault();
    openModal(el.getAttribute('data-modal'), el);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = modalTrigger(e);
    // native buttons and links already turn Enter/Space into a click
    if (!el || el.tagName === 'BUTTON' || el.tagName === 'A') return;
    e.preventDefault();
    openModal(el.getAttribute('data-modal'), el);
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
    // keep the page locked if a pop-up (e.g. a season's details) is still open underneath
    if (!openModals().length) document.body.style.overflow = '';
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
        '<a class="video-yt-link" target="_blank" rel="noopener">Video not playing? Watch on YouTube</a></div>';
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
    var $fc = jQuery('.first-carousel');
    // Owl's own .active class is unreliable with loop + stagePadding, so mark the fully shown cards ourselves.
    function markInView(e) {
      if (!e.item || !e.page) return;
      var $items = $fc.find('.owl-item');
      $items.removeClass('in-view');
      for (var i = e.item.index; i < e.item.index + e.page.size; i++) $items.eq(i).addClass('in-view');
    }
    $fc.on('initialized.owl.carousel changed.owl.carousel refreshed.owl.carousel resized.owl.carousel', function (e) {
      // run after Owl finishes updating its internal state
      setTimeout(function () { markInView(e); }, 0);
    });
    $fc.owlCarousel({
      loop: true,
      margin: 24,
      nav: true,
      navText: ['<i class="ion-chevron-left"></i>', '<i class="ion-chevron-right"></i>'],
      dots: false,
      autoplay: true,
      autoplayTimeout: 6000,
      autoplayHoverPause: true,
      smartSpeed: 700,
      // stagePadding leaves part of the previous/next card visible on each side (faded in CSS)
      responsive: {
        0:    { items: 1, stagePadding: 40 },
        600:  { items: 1, stagePadding: 130 },
        800:  { items: 2, stagePadding: 150 },
        1000: { items: 3, stagePadding: 150 },
        1250: { items: 3, stagePadding: 175 },
        1500: { items: 3, stagePadding: 210 },
        1800: { items: 3, stagePadding: 260 }
      }
    });

    // Clicking a faded (partly visible) card slides it into view instead of activating its links.
    $fc[0].addEventListener('click', function (e) {
      var item = e.target.closest('.owl-item');
      if (!item || item.classList.contains('in-view')) return;
      e.preventDefault();
      e.stopPropagation();
      var stage = $fc[0].getBoundingClientRect();
      var box = item.getBoundingClientRect();
      var leftSide = (box.left + box.width / 2) < (stage.left + stage.width / 2);
      $fc.trigger(leftSide ? 'prev.owl.carousel' : 'next.owl.carousel');
    }, true);
  }

  // ---------------------------------------------------------------------
  // Card tabs (FIRST robot cards): Results / My Contribution.
  // Delegated so it also works on the carousel's copies of each card.
  // ---------------------------------------------------------------------
  document.addEventListener('click', function (e) {
    var tab = e.target.closest ? e.target.closest('.card-tab') : null;
    if (!tab) return;
    var card = tab.closest('.robot-card');
    var name = tab.getAttribute('data-tab');
    // The looping carousel keeps copies of each card and swaps between them while dragging,
    // so apply the choice to every copy of this card (matched by data-card), not just this one.
    var key = card.getAttribute('data-card');
    var cards = key ? document.querySelectorAll('.robot-card[data-card="' + key + '"]') : [card];
    Array.prototype.forEach.call(cards, function (c) {
      c.querySelectorAll('.card-tab').forEach(function (t) {
        var on = t.getAttribute('data-tab') === name;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      c.querySelectorAll('.card-panel').forEach(function (pnl) {
        pnl.classList.toggle('active', pnl.getAttribute('data-panel') === name);
      });
    });
  });

  // ---------------------------------------------------------------------
  // Demo media: <div class="demo-media" data-youtube="VIDEO_ID">
  // Empty data-youtube shows a "media coming soon" placeholder.
  // ---------------------------------------------------------------------
  document.querySelectorAll('.demo-media[data-youtube]').forEach(function (box) {
    var id = (box.getAttribute('data-youtube') || '').trim();
    if (!id) {
      box.innerHTML = '<div class="demo-placeholder"><i class="ion-images"></i>Media coming soon</div>';
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
  // ---------------------------------------------------------------------
  // Image lightbox for project pages: click a gallery (or header) image to view it full size.
  // Arrow keys / buttons step through the page's gallery; Escape or a backdrop click closes.
  // ---------------------------------------------------------------------
  var LB_SELECTOR = '.gallery img, .project-media img';
  if (document.querySelector(LB_SELECTOR)) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML =
      '<button type="button" class="lb-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="lb-prev" aria-label="Previous image"><i class="ion-chevron-left"></i></button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="lb-next" aria-label="Next image"><i class="ion-chevron-right"></i></button>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption');
    var lbList = [], lbIdx = 0, lbTrigger = null;

    function lbShow(i) {
      lbIdx = (i + lbList.length) % lbList.length;
      var img = lbList[lbIdx];
      var fig = img.closest('figure');
      var cap = fig && fig.querySelector('figcaption');
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = cap ? cap.textContent : '';
      lbCap.style.display = lbCap.textContent ? '' : 'none';
      lb.classList.toggle('lb-single', lbList.length < 2);
    }
    function lbOpen(img) {
      // step through the gallery when the image is in it; the header image is shown alone
      lbList = img.closest('.gallery') ? Array.prototype.slice.call(document.querySelectorAll('.gallery img')) : [img];
      lbTrigger = img;
      lbShow(lbList.indexOf(img));
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
    }
    function lbClose() {
      lb.classList.remove('open');
      lbImg.removeAttribute('src');
      document.body.style.overflow = '';
      if (lbTrigger) lbTrigger.focus();
    }

    document.querySelectorAll(LB_SELECTOR).forEach(function (img) {
      img.classList.add('zoomable');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'View larger: ' + (img.alt || 'image'));
      img.addEventListener('click', function () { lbOpen(img); });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lbOpen(img); }
      });
    });
    lb.querySelector('.lb-close').addEventListener('click', lbClose);
    lb.querySelector('.lb-prev').addEventListener('click', function () { lbShow(lbIdx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { lbShow(lbIdx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') lbClose(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') lbClose();
      else if (e.key === 'ArrowLeft' && lbList.length > 1) lbShow(lbIdx - 1);
      else if (e.key === 'ArrowRight' && lbList.length > 1) lbShow(lbIdx + 1);
    });
  }
})();
