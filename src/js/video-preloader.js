// Background Video Preloader with True Cross-Page State Persistence
// Maintains download queue, progress, and state across page navigation

class VideoPreloader {
  constructor() {
    // Logging configuration - set to false for production to prevent browser lockup
    // To enable debugging: set this.debug = true; and/or this.verboseLogging = true;
    this.debug = false; // Set to true only for debugging
    this.verboseLogging = false; // Set to true for very detailed logs
    this.preloadQueue = [];
    this.preloadedVideos = new Map();
    this.isPreloading = false;
    this.maxConcurrentPreloads = 4;
    this.currentPreloads = 0;
    this.preloadedBytes = 0;
    this.totalPreloadSize = 0;
    this.observerOptions = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    };
    this.intersectionObserver = null;
    this.initialized = false;
    this.currentPage = this.detectCurrentPage();
    this.stateKey = 'waypoint_preloader_state';
    this.activeDownloads = new Map();

    // Listen for page changes
    window.addEventListener('popstate', () => this.handlePageChange());
    window.addEventListener('pushstate', () => this.handlePageChange());

    // Save state before page unload
    window.addEventListener('beforeunload', () => this.saveState());

    // Restore state from previous session
    this.restoreState();
  }

  // Logging methods to prevent browser lockup from excessive console output
  log(message, ...args) {
    if (this.debug) {
      console.log(message, ...args);
    }
  }

  logVerbose(message, ...args) {
    if (this.debug && this.verboseLogging) {
      console.log(message, ...args);
    }
  }

  logImportant(message, ...args) {
    // Always log important messages (errors, critical info)
    console.log(message, ...args);
  }

  init() {
    if (this.initialized) return;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupPreloader());
    } else {
      this.setupPreloader();
    }

    this.initialized = true;
  }

  detectCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';

    if (filename === 'index.html' || filename === '' || path === '/') {
      return 'index';
    } else if (filename === 'commercial.html') {
      return 'commercial';
    } else if (filename === 'real-estate.html') {
      return 'gallery';
    } else if (filename === 'drone.html') {
      return 'drone';
    }

    return 'index';
  }

  handlePageChange() {
    const newPage = this.detectCurrentPage();
    if (newPage !== this.currentPage) {
      this.log(`📄 Page changed from ${this.currentPage} to ${newPage} - reprioritizing videos`);
      this.currentPage = newPage;
      this.reprioritizeQueue();
    }
  }

  reprioritizeQueue() {
    this.log('🔄 Reprioritizing video queue for current page...');

    this.preloadQueue.forEach(videoData => {
      videoData.priority = this.calculatePageBasedPriority(videoData);
    });

    this.preloadQueue.sort((a, b) => b.priority - a.priority);
    this.saveState();

    if (this.isPreloading) {
      this.log('⚡ Restarting preloader with new priorities');
      this.startPreloading();
    }
  }

  saveState() {
    try {
      const state = {
        queue: this.preloadQueue.map(video => ({
          src: video.src,
          priority: video.priority,
          preloaded: video.preloaded,
          preloadProgress: video.preloadProgress,
          id: video.id,
          isGlobal: video.isGlobal,
          lastAccessed: Date.now(),
        })),
        preloadedVideos: Array.from(this.preloadedVideos.entries()).map(([src, data]) => ({
          src,
          preloadedAt: data.preloadedAt,
          videoId: data.videoData?.id,
        })),
        currentPage: this.currentPage,
        timestamp: Date.now(),
      };

      sessionStorage.setItem(this.stateKey, JSON.stringify(state));
      this.log(`💾 Saved preloader state: ${state.queue.length} videos in queue`);
    } catch (e) {
      console.warn('Failed to save preloader state:', e);
    }
  }

  restoreState() {
    try {
      const savedState = sessionStorage.getItem(this.stateKey);
      if (!savedState) {
        this.log('📭 No saved preloader state found - starting fresh');
        return false;
      }

      const state = JSON.parse(savedState);
      const age = Date.now() - state.timestamp;

      // Only restore state if it's less than 5 minutes old
      if (age > 5 * 60 * 1000) {
        this.log('⏰ Saved state too old - starting fresh');
        sessionStorage.removeItem(this.stateKey);
        return false;
      }

      // Restore queue
      this.preloadQueue = state.queue.map(video => ({
        ...video,
        element: null, // Will be populated when DOM elements are found
      }));

      // Restore preloaded videos map
      state.preloadedVideos.forEach(video => {
        this.preloadedVideos.set(video.src, {
          preloadedAt: video.preloadedAt,
          videoData: { id: video.videoId },
        });
      });

      // Update page if different
      if (state.currentPage !== this.currentPage) {
        this.log(`📄 Page changed from saved state (${state.currentPage} → ${this.currentPage})`);
        this.reprioritizeQueue();
      }

      this.log(
        `📦 Restored preloader state: ${this.preloadQueue.length} videos, ${this.preloadedVideos.size} preloaded`
      );
      return true;
    } catch (e) {
      console.warn('Failed to restore preloader state:', e);
      sessionStorage.removeItem(this.stateKey);
      return false;
    }
  }

  // Resume interrupted downloads
  resumeActiveDownloads() {
    const inProgressVideos = this.preloadQueue.filter(
      video => video.preloadProgress > 0 && video.preloadProgress < 100 && !video.preloaded
    );

    if (inProgressVideos.length > 0) {
      this.log(`🔄 Resuming ${inProgressVideos.length} interrupted downloads`);
      inProgressVideos.forEach(video => {
        this.log(`⏩ Resuming download: ${video.id} (was ${video.preloadProgress}% complete)`);
      });
    }
  }

  setupPreloader() {
    this.cleanupCache();
    this.checkBrowserCacheStatus();
    this.setupIntersectionObserver();
    this.discoverVideos();

    if (window.getAllVideoUrls) {
      this.preloadAllGlobalVideos();
    }

    this.resumeActiveDownloads();
    this.startPreloading();

    this.logImportant('🎬 Video Preloader initialized with persistent state');
    this.log(`📊 Found ${this.preloadQueue.length} videos to potentially preload`);
  }

  checkBrowserCacheStatus() {
    const isLocalDevelopment =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalDevelopment) {
      this.log('🏠 Local development environment detected');
      this.log(
        '💡 CORS Tip: If you see CORS errors with GitHub videos, try using the CORS-enabled server (cors_server.py)'
      );
    }

    setTimeout(() => {
      if (performance.getEntriesByType && performance.getEntriesByType('navigation').length > 0) {
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry.type === 'reload') {
          console.warn(
            '⚠️  Page was reloaded - if videos re-download despite cache, check if "Disable cache" is enabled in DevTools Network tab'
          );
        }
      }

      this.log(
        '💡 Cache Tip: If videos keep re-downloading, ensure "Disable cache" is unchecked in DevTools Network tab'
      );
    }, 1000);
  }

  cleanupCache() {
    try {
      const cacheKey = 'waypoint_video_cache';
      const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      const now = Date.now();
      let cleaned = 0;

      Object.keys(cache).forEach(url => {
        if (cache[url].expires < now) {
          const cachedElement = document.querySelector(
            `video[data-preloaded="true"][src="${url}"]`
          );
          if (cachedElement) {
            cachedElement.remove();
          }
          delete cache[url];
          cleaned++;
        }
      });

      localStorage.setItem(cacheKey, JSON.stringify(cache));

      if (cleaned > 0) {
        this.log(`🧹 Cleaned up ${cleaned} expired video cache entries`);
      }
    } catch (e) {
      console.warn('Could not cleanup cache:', e);
    }
  }

  preloadAllGlobalVideos() {
    this.log(
      `🌍 Preloading ALL videos from all pages (universal preloading) - Current page: ${this.currentPage}`
    );

    const allVideoUrls = window.getAllVideoUrls();
    this.log(`📥 Adding ${allVideoUrls.length} global videos to preload queue`);

    let newVideos = 0;
    let cachedVideos = 0;
    let restoredVideos = 0;

    allVideoUrls.forEach((url, index) => {
      const existingVideo = this.preloadQueue.find(v => v.src === url);
      if (existingVideo) {
        const oldPriority = existingVideo.priority;
        existingVideo.priority = this.calculatePageBasedPriority(existingVideo);
        if (oldPriority !== existingVideo.priority) {
          this.log(
            `🔄 Updated priority for restored video: ${existingVideo.id} (${oldPriority} → ${existingVideo.priority})`
          );
        }
        restoredVideos++;
        return;
      }

      if (this.isVideoCached(url)) {
        this.logVerbose(`💾 Video already cached, skipping: global-video-${index}`);
        cachedVideos++;
        return;
      }

      const videoData = {
        element: null,
        src: url,
        priority: 0,
        preloaded: false,
        preloadProgress: 0,
        id: `global-video-${index}`,
        isGlobal: true,
      };

      videoData.priority = this.calculatePageBasedPriority(videoData);
      this.preloadQueue.push(videoData);
      newVideos++;
    });

    this.preloadQueue.sort((a, b) => b.priority - a.priority);

    this.log(
      `📊 Added ${newVideos} new videos, ${cachedVideos} already cached, ${restoredVideos} restored from state`
    );
    this.log(
      `📋 Queue priorities: ${this.preloadQueue
        .slice(0, 5)
        .map(v => `${v.id}(${v.priority})`)
        .join(', ')}...`
    );

    this.saveState();
  }

  calculatePageBasedPriority(videoData) {
    const config = window.globalVideoConfig;
    if (!config) return 25;

    const currentPageVideos = config[`${this.currentPage}Videos`] || [];
    const isCurrentPageVideo = currentPageVideos.includes(videoData.src);

    if (isCurrentPageVideo) {
      const indexInPage = currentPageVideos.indexOf(videoData.src);
      return 100 - indexInPage; // First video = 100, second = 99, etc.
    } else {
      return 50 - Math.floor(Math.random() * 20); // Random 30-50 to spread load
    }
  }

  setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          this.prioritizeVideo(video);
        }
      });
    }, this.observerOptions);
  }

  discoverVideos() {
    const videos = document.querySelectorAll('video');

    videos.forEach((video, index) => {
      if (this.isVideoInModal(video)) {
        return;
      }

      const src = this.getVideoSource(video);

      // Skip if this video is already in the queue
      if (src && this.preloadQueue.some(v => v.src === src)) {
        return;
      }

      const videoData = {
        element: video,
        src: src,
        priority: this.calculatePriority(video, index),
        preloaded: false,
        preloadProgress: 0,
        id: video.dataset.videoId || `video-${index}-${Date.now()}`,
      };

      if (videoData.src) {
        this.preloadQueue.push(videoData);
        this.intersectionObserver.observe(video);
        this.setPreloadAttribute(video, videoData.priority);
      }
    });

    this.preloadQueue.sort((a, b) => b.priority - a.priority);
  }

  isVideoInModal(video) {
    let parent = video.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (
        style.display === 'none' ||
        parent.classList.contains('modal') ||
        parent.id === 'videoModal'
      ) {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  }

  getVideoSource(video) {
    const source = video.querySelector('source');
    return source ? source.src : video.src;
  }

  calculatePriority(video, index) {
    let priority = 10;

    const rect = video.getBoundingClientRect();
    const isAboveFold = rect.top < window.innerHeight;
    if (isAboveFold) {
      priority += 50;
    }

    priority += Math.max(0, 30 - index * 2);

    if (video.hasAttribute('autoplay')) {
      priority += 100;
    }

    if (video.hasAttribute('poster') && video.poster) {
      priority -= 10;
    }

    return priority;
  }

  setPreloadAttribute(video, priority) {
    if (priority > 50) {
      video.preload = 'auto';
    } else if (priority > 20) {
      video.preload = 'metadata';
    } else {
      video.preload = 'none';
    }
  }

  prioritizeVideo(video) {
    const videoData = this.preloadQueue.find(v => v.element === video);
    if (videoData && !videoData.preloaded) {
      videoData.priority += 20;
      this.log(`🎯 Prioritizing video: ${videoData.id}`);
      this.preloadQueue.sort((a, b) => b.priority - a.priority);
    }
  }

  async startPreloading() {
    if (this.isPreloading) return;
    this.isPreloading = true;

    this.log(
      `🚀 Starting background video preloading with up to ${this.maxConcurrentPreloads} concurrent downloads...`
    );

    while (this.preloadQueue.length > 0 && this.currentPreloads < this.maxConcurrentPreloads) {
      const videoData = this.preloadQueue.find(v => !v.preloaded && v.priority > 0);
      if (!videoData) break;

      this.preloadVideo(videoData);
    }
  }

  async preloadVideo(videoData) {
    if (videoData.preloaded || this.currentPreloads >= this.maxConcurrentPreloads) {
      return;
    }

    // Check if this video is already being preloaded
    if (this.activeDownloads.has(videoData.src)) {
      this.log(`⚠️ Video already being preloaded, skipping: ${videoData.id}`);
      return;
    }

    // Mark this video as being actively downloaded
    this.activeDownloads.set(videoData.src, videoData.id);
    this.currentPreloads++;

    const logPrefix = videoData.isGlobal ? '🌍' : '📥';
    this.log(
      `${logPrefix} Preloading video: ${videoData.id} (Priority: ${videoData.priority}) [${this.currentPreloads}/${this.maxConcurrentPreloads} active]`
    );

    try {
      const preloadVideo = document.createElement('video');
      preloadVideo.style.display = 'none';
      preloadVideo.style.position = 'absolute';
      preloadVideo.style.top = '-9999px';
      preloadVideo.style.left = '-9999px';
      preloadVideo.muted = true;
      preloadVideo.preload = 'auto';
      preloadVideo.src = videoData.src;

      const isLocalDevelopment =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isGitHubVideo = videoData.src.includes('github.com');

      if (isGitHubVideo && !isLocalDevelopment) {
        preloadVideo.setAttribute('crossorigin', 'anonymous');
        this.log(`🔒 Added crossorigin for GitHub video: ${videoData.id}`);
      }

      preloadVideo.setAttribute('data-preloaded', 'true');
      preloadVideo.setAttribute('data-video-id', videoData.id);

      // Progress tracking with state saving
      preloadVideo.addEventListener('progress', () => {
        if (preloadVideo.buffered.length > 0) {
          const loaded = preloadVideo.buffered.end(preloadVideo.buffered.length - 1);
          const total = preloadVideo.duration || 1;
          const newProgress = (loaded / total) * 100;

          if (Math.abs(newProgress - videoData.preloadProgress) > 10) {
            videoData.preloadProgress = newProgress;
            this.saveState();
          } else {
            videoData.preloadProgress = newProgress;
          }
        }
      });

      // Completion handler with state saving
      preloadVideo.addEventListener('canplaythrough', () => {
        const successPrefix = videoData.isGlobal ? '🌍✅' : '✅';
        this.log(
          `${successPrefix} Video preloaded: ${videoData.id} [${this.currentPreloads - 1}/${this.maxConcurrentPreloads} remaining active]`
        );
        videoData.preloaded = true;
        videoData.preloadProgress = 100;

        this.preloadedVideos.set(videoData.src, {
          preloadedAt: Date.now(),
          videoData: videoData,
          element: preloadVideo,
        });

        if (videoData.element) {
          videoData.element.preload = 'auto';
        }

        preloadVideo.style.display = 'none';
        preloadVideo.style.visibility = 'hidden';

        this.storeCacheInfo(videoData.src);
        this.saveState();

        // Remove from active downloads and decrement counter
        this.activeDownloads.delete(videoData.src);
        this.currentPreloads--;
        this.continuePreloading();
      });

      // Error handler
      preloadVideo.addEventListener('error', e => {
        const errorPrefix = videoData.isGlobal ? '🌍❌' : '❌';
        console.warn(`${errorPrefix} Failed to preload video: ${videoData.id}`, e);

        if (videoData.src.includes('github.com')) {
          this.log(`🔄 Attempting link preload for GitHub video: ${videoData.id}`);
          this.tryLinkPreload(videoData);
        }

        videoData.preloaded = false;
        if (preloadVideo.parentElement) {
          document.body.removeChild(preloadVideo);
        }

        // Remove from active downloads and decrement counter
        this.activeDownloads.delete(videoData.src);
        this.currentPreloads--;
        this.continuePreloading();
      });

      document.body.appendChild(preloadVideo);

      // Timeout handler
      setTimeout(() => {
        if (!videoData.preloaded && preloadVideo.parentElement) {
          const timeoutPrefix = videoData.isGlobal ? '🌍⏰' : '⏰';
          console.warn(`${timeoutPrefix} Preload timeout for video: ${videoData.id}`);
          document.body.removeChild(preloadVideo);

          // Remove from active downloads and decrement counter
          this.activeDownloads.delete(videoData.src);
          this.currentPreloads--;
          this.continuePreloading();
        }
      }, 45000);
    } catch (error) {
      const errorPrefix = videoData.isGlobal ? '🌍💥' : '💥';
      console.error(`${errorPrefix} Error preloading video: ${videoData.id}`, error);

      // Remove from active downloads and decrement counter
      this.activeDownloads.delete(videoData.src);
      this.currentPreloads--;
      this.continuePreloading();
    }
  }

  tryLinkPreload(videoData) {
    try {
      const linkPreload = document.createElement('link');
      linkPreload.rel = 'preload';
      linkPreload.as = 'video';
      linkPreload.href = videoData.src;
      linkPreload.setAttribute('data-preload-link', 'true');
      linkPreload.setAttribute('data-video-id', videoData.id);

      document.head.appendChild(linkPreload);

      setTimeout(() => {
        this.log(`🔗 Link preload completed for: ${videoData.id}`);
        videoData.preloaded = true;
        videoData.preloadProgress = 100;

        this.preloadedVideos.set(videoData.src, {
          preloadedAt: Date.now(),
          videoData: videoData,
          linkElement: linkPreload,
        });

        this.storeCacheInfo(videoData.src);
      }, 2000);
    } catch (error) {
      console.warn(`🔗❌ Link preload failed for: ${videoData.id}`, error);
    }
  }

  boostVideoPriority(videoSrc) {
    const videoData = this.preloadQueue.find(v => v.src === videoSrc);
    if (videoData && !videoData.preloaded) {
      const oldPriority = videoData.priority;
      videoData.priority = 999;
      this.log(
        `🚀 PRIORITY BOOST: ${videoData.id} priority: ${oldPriority} → ${videoData.priority} (user started playing)`
      );

      this.saveState();

      if (this.isPreloading) {
        this.log('🔄 Restarting preloader to prioritize playing video...');
        this.continuePreloading();
      }
    }
  }

  storeCacheInfo(videoSrc) {
    try {
      const cacheKey = 'waypoint_video_cache';
      let cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      cache[videoSrc] = {
        cachedAt: Date.now(),
        expires: Date.now() + 24 * 60 * 60 * 1000,
      };
      localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (e) {
      console.warn('Could not store cache info:', e);
    }
  }

  isVideoCached(videoSrc) {
    try {
      // First check if it's in our preloaded videos map
      if (this.preloadedVideos.has(videoSrc)) {
        this.logVerbose(`💾 Video found in preloaded map: ${videoSrc}`);
        return true;
      }

      // Check if currently being downloaded
      if (this.activeDownloads.has(videoSrc)) {
        this.logVerbose(`⬇️ Video currently being downloaded: ${videoSrc}`);
        return true;
      }

      // Then check localStorage cache info
      const cacheKey = 'waypoint_video_cache';
      const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      const cacheInfo = cache[videoSrc];

      if (cacheInfo && cacheInfo.expires > Date.now()) {
        // Also check if there's a preloaded element in the DOM
        const cachedElement = document.querySelector(
          `video[data-preloaded="true"][src="${videoSrc}"]`
        );
        if (cachedElement) {
          this.logVerbose(`💾 Video found in DOM cache: ${videoSrc}`);
          return true;
        }
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  continuePreloading() {
    this.preloadQueue.sort((a, b) => b.priority - a.priority);

    setTimeout(() => {
      this.startPreloading();
    }, 100);
  }

  addVideo(video) {
    if (this.isVideoInModal(video)) {
      return;
    }

    const videoData = {
      element: video,
      src: this.getVideoSource(video),
      priority: this.calculatePriority(video, this.preloadQueue.length),
      preloaded: false,
      preloadProgress: 0,
      id: video.dataset.videoId || `video-${Date.now()}`,
    };

    if (videoData.src) {
      this.preloadQueue.push(videoData);
      this.intersectionObserver.observe(video);
      this.setPreloadAttribute(video, videoData.priority);

      this.preloadQueue.sort((a, b) => b.priority - a.priority);

      this.log(`➕ Added new video to preload queue: ${videoData.id}`);
      this.startPreloading();
    }
  }

  handleModalVideo(video) {
    if (!video) return;

    const videoData = {
      element: video,
      src: this.getVideoSource(video),
      priority: 999, // High priority for modal videos since user actively opened them
      preloaded: false,
      preloadProgress: 0,
      id: video.dataset.videoId || video.id || `modal-video-${Date.now()}`,
      isModal: true,
    };

    if (videoData.src) {
      // Check if this video is already in queue
      const existingVideo = this.preloadQueue.find(v => v.src === videoData.src);
      if (existingVideo) {
        // Boost priority and mark as modal
        existingVideo.priority = 999;
        existingVideo.isModal = true;
        this.log(`🎯 Boosted modal video priority: ${existingVideo.id}`);
      } else {
        // Add new modal video with high priority
        this.preloadQueue.push(videoData);
        this.log(
          `📱 Added modal video to preload queue: ${videoData.id} (Priority: ${videoData.priority})`
        );
      }

      this.preloadQueue.sort((a, b) => b.priority - a.priority);
      this.setPreloadAttribute(video, videoData.priority);
      this.saveState();

      // Start preloading immediately for modal videos
      this.startPreloading();
    }
  }

  getPreloadStatus() {
    const total = this.preloadQueue.length;
    const preloaded = this.preloadQueue.filter(v => v.preloaded).length;
    const inProgress = this.currentPreloads;

    return {
      total,
      preloaded,
      inProgress,
      pending: total - preloaded - inProgress,
      percentage: total > 0 ? Math.round((preloaded / total) * 100) : 100,
    };
  }
}

// Create global instance
window.videoPreloader = new VideoPreloader();

// Auto-initialize when script loads
window.videoPreloader.init();

// Integration with existing video manager
if (window.videoManager) {
  const originalAddVideo = window.videoManager.addVideo.bind(window.videoManager);
  window.videoManager.addVideo = function (video) {
    originalAddVideo(video);
    window.videoPreloader.addVideo(video);
  };
}

// Debug helpers
window.debugVideoPreloader = function () {
  const status = window.videoPreloader.getPreloadStatus();
  const globalVideos = window.videoPreloader.preloadQueue.filter(v => v.isGlobal);
  const localVideos = window.videoPreloader.preloadQueue.filter(v => !v.isGlobal);

  console.log('=== Video Preloader Debug Info (with Persistent State) ===');
  console.log('Overall Status:', status);
  console.log(
    `Global Videos (${globalVideos.length}):`,
    globalVideos.map(v => ({
      id: v.id,
      priority: v.priority,
      preloaded: v.preloaded,
      progress: Math.round(v.preloadProgress) + '%',
    }))
  );
  console.log(
    `Local Videos (${localVideos.length}):`,
    localVideos.map(v => ({
      id: v.id,
      priority: v.priority,
      preloaded: v.preloaded,
      progress: Math.round(v.preloadProgress) + '%',
    }))
  );

  // Show persistent state
  const savedState = sessionStorage.getItem(window.videoPreloader.stateKey);
  if (savedState) {
    const state = JSON.parse(savedState);
    console.log('Persistent State:', {
      queueSize: state.queue.length,
      preloadedCount: state.preloadedVideos.length,
      currentPage: state.currentPage,
      age: Math.round((Date.now() - state.timestamp) / 1000) + 's ago',
    });
  } else {
    console.log('No persistent state found');
  }

  return status;
};

window.clearPreloaderState = function () {
  sessionStorage.removeItem(window.videoPreloader.stateKey);
  localStorage.removeItem('waypoint_video_cache');
  console.log('🧹 Cleared all preloader state');
};
