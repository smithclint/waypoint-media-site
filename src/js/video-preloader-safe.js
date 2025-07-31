/**
 * VideoPreloaderSafe - A crash-proof video preloading system
 *
 * This preloader safely manages video preloading without causing browser lockups.
 * By default, it operates silently to prevent console spam that can crash the browser.
 *
 * HOW TO ENABLE DEBUGGING:
 * Edit the constructor flags directly in this file:
 * - this.debug = true;           // Enable basic debugging
 * - this.verboseLogging = true;  // Enable detailed logs
 * - this.performanceLogging = true; // Enable performance metrics
 *
 * Then use debugVideoPreloaderSafe() in console to see status.
 */

// Safe Video Preloader - All logging disabled, performance optimized
// This version prevents browser lockup by completely disabling all console output

class VideoPreloaderSafe {
  constructor() {
    // DEBUGGING CONTROLS - Preloader enabled with debugging
    this.debug = true; // Enable debugging to see what's happening
    this.verboseLogging = false; // Keep detailed logs disabled
    this.performanceLogging = false; // Keep performance metrics disabled
    this.progressLogging = true; // Enable progress logging to see preloading
    this.preloaderDisabled = false; // Enable preloading functionality

    this.preloadQueue = [];
    this.preloadedVideos = new Map();
    this.activeDownloads = new Map();
    this.allVideoUrls = new Set(); // Master set to prevent any duplicates

    this.isPreloading = false;
    this.maxConcurrentPreloads = 12; // Re-enabled - 12 concurrent downloads
    this.currentPreloads = 0;
    this.initialized = false;
    this.currentPage = this.detectCurrentPage();
    this.currentlyPlayingVideo = null; // Track currently playing video
    this.stateKey = 'waypoint_preloader_state';
    this.aggressiveMode = true; // Re-enable aggressive downloading

    // Performance tracking
    this.stats = {
      videosDiscovered: 0,
      videosPreloaded: 0,
      bytesLoaded: 0,
      errors: 0,
      startTime: Date.now(),
    };

    // Simple page change detection
    window.addEventListener('beforeunload', () => {
      this.saveState();
      this.stopProgressLogging();
    });

    this.restoreState();

    // Start progress logging
    if (this.progressLogging) {
      this.startProgressLogging();
    }

    // Setup video event listeners for reprioritization
    this.setupVideoEventListeners();
  }

  // Controlled logging methods - safe for production
  log(message, ...args) {
    if (this.debug) {
      console.log(`[VideoPreloader] ${message}`, ...args);
    }
  }

  logError(message, error) {
    // Always log errors in debug mode
    if (this.debug) {
      console.error(`[VideoPreloader:Error] ${message}`, error);
    }
    this.stats.errors++;
  }

  // Simple progress logging every 2 seconds
  startProgressLogging() {
    this.progressInterval = setInterval(() => {
      if (this.preloadQueue.length > 0) {
        const total = this.allVideoUrls.size;
        const preloaded = this.preloadedVideos.size;
        const active = this.currentPreloads;
        const percent = total > 0 ? Math.round((preloaded / total) * 100) : 0;

        if (this.aggressiveMode) {
          // More detailed progress for aggressive downloading
          if (active > 0) {
            console.log(
              `🚀 [VideoPreloader] Aggressive Download: ${preloaded}/${total} (${percent}%) | Active: ${active}/${this.maxConcurrentPreloads} | Errors: ${this.stats.errors}`
            );
          } else if (preloaded < total) {
            console.log(
              `⏳ [VideoPreloader] Queue: ${total - preloaded} videos remaining | Downloaded: ${preloaded}/${total}`
            );
          } else {
            console.log(
              `✅ [VideoPreloader] Complete: All ${preloaded} videos cached! | Errors: ${this.stats.errors}`
            );
            this.stopProgressLogging();
          }
        } else {
          if (active > 0) {
            console.log(
              `[VideoPreloader] Progress: ${preloaded}/${total} (${percent}%) | Active: ${active}/${this.maxConcurrentPreloads} | Errors: ${this.stats.errors}`
            );
          } else if (preloaded < total) {
            console.log(
              `[VideoPreloader] Waiting... ${total - preloaded} videos remaining | Downloaded: ${preloaded}/${total}`
            );
          } else {
            console.log(
              `[VideoPreloader] Complete: ${preloaded}/${total} videos downloaded | Errors: ${this.stats.errors}`
            );
            this.stopProgressLogging();
          }
        }
      }
    }, 2000);
  }

  stopProgressLogging() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupPreloader());
    } else {
      this.setupPreloader();
    }
  }

  detectCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('commercial')) return 'commercial';
    if (path.includes('real-estate')) return 'gallery';
    if (path.includes('drone')) return 'drone';
    return 'index';
  }

  setupVideoEventListeners() {
    // Listen for video play events to track currently playing video
    document.addEventListener(
      'play',
      event => {
        if (event.target.tagName === 'VIDEO') {
          this.currentlyPlayingVideo = event.target;
          const src = this.getVideoSource(event.target);
          this.log(
            `🎬 [Reprioritize] Video started playing: ${src ? src.split('/').pop() : '[unknown src]'}`
          );
          this.reprioritizeQueue();
        }
      },
      true
    );

    // Listen for video pause/ended events
    document.addEventListener(
      'pause',
      event => {
        if (event.target.tagName === 'VIDEO' && event.target === this.currentlyPlayingVideo) {
          this.currentlyPlayingVideo = null;
          this.log(`⏸️ Video paused: ${this.getVideoSource(event.target).split('/').pop()}`);
          this.reprioritizeQueue();
        }
      },
      true
    );

    document.addEventListener(
      'ended',
      event => {
        if (event.target.tagName === 'VIDEO' && event.target === this.currentlyPlayingVideo) {
          this.currentlyPlayingVideo = null;
          this.log(`⏹️ Video ended: ${this.getVideoSource(event.target).split('/').pop()}`);
          this.reprioritizeQueue();
        }
      },
      true
    );

    // Also listen for new videos being added to the DOM
    const observer = new MutationObserver(mutations => {
      let hasNewVideos = false;
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'VIDEO' || node.querySelector('video')) {
              hasNewVideos = true;
            }
          }
        });
      });
      if (hasNewVideos) {
        setTimeout(() => this.discoverVideos(), 100);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  getVideoPage(videoSrc) {
    if (!window.globalVideoConfig) return 'unknown';

    const config = window.globalVideoConfig;

    // Check which page array contains this video
    if (config.indexVideos && config.indexVideos.includes(videoSrc)) return 'index';
    if (config.commercialVideos && config.commercialVideos.includes(videoSrc)) return 'commercial';
    if (config.galleryVideos && config.galleryVideos.includes(videoSrc)) return 'gallery';
    if (config.droneVideos && config.droneVideos.includes(videoSrc)) return 'drone';

    return 'unknown';
  }

  reprioritizeQueue() {
    if (this.preloadQueue.length === 0) return;

    this.log('🔄 Reprioritizing video queue...');

    // Recalculate priorities for all videos
    this.preloadQueue.forEach((videoData, index) => {
      videoData.priority = this.calculateAdvancedPriority(videoData, index);
    });

    // Sort by new priorities
    this.preloadQueue.sort((a, b) => b.priority - a.priority);

    // Debug: Show new priorities with details
    if (this.debug) {
      this.log('📊 New queue priorities:');
      this.preloadQueue.forEach((item, i) => {
        const fileName = item.src ? item.src.split('/').pop() : '[no src]';
        const page = this.getVideoPage(item.src);
        const hasElement = !!item.element;
        let playing = false;
        let playingSrc = null;
        if (this.currentlyPlayingVideo) {
          playingSrc = this.getVideoSource(this.currentlyPlayingVideo);
        }
        if (
          (item.element && item.element === this.currentlyPlayingVideo) ||
          (playingSrc && item.src && item.src === playingSrc)
        ) {
          playing = true;
        }
        this.log(
          `  ${i + 1}. ${fileName} - Priority: ${item.priority} (Page: ${page}) Element: ${hasElement ? 'yes' : 'no'} Playing: ${playing}`
        );
      });
    }

    // Restart preloading with new priorities
    this.startPreloading();
  }

  setupPreloader() {
    if (this.preloaderDisabled) {
      console.log('🚫 Video Preloader is DISABLED - videos will load naturally via browser cache');
      return; // Exit early - no preloading
    }

    console.log('🎬 Initializing Video Preloader (Aggressive Mode) - ENABLED');
    this.discoverVideos();
    if (window.getAllVideoUrls) {
      this.preloadGlobalVideos();
    }
    this.setupVideoEventListeners();

    // Immediately start aggressive downloading of all videos
    this.startAggressivePreloading();

    this.log(`📊 Setup complete: ${this.preloadQueue.length} videos queued for immediate download`);
  }

  setupVideoEventListeners() {
    document.addEventListener(
      'play',
      event => {
        if (event.target.tagName === 'VIDEO') {
          const src = this.getVideoSource(event.target);
          if (src) this.boostVideoPriority(src);
        }
      },
      true
    );

    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => this.reprioritizeQueue(), 500);
    });
  }

  // Centralized method to add videos and prevent duplicates
  addVideoToQueue(videoData) {
    if (
      !videoData.src ||
      !this.isValidVideoUrl(videoData.src) ||
      this.allVideoUrls.has(videoData.src)
    ) {
      return false;
    }
    this.preloadQueue.push(videoData);
    this.allVideoUrls.add(videoData.src);
    return true;
  }

  discoverVideos() {
    try {
      const videos = document.querySelectorAll('video');
      let newVideosAdded = 0;
      videos.forEach((video, index) => {
        const src = this.getVideoSource(video);
        const wasAdded = this.addVideoToQueue({
          element: video,
          src: src,
          priority: this.calculateAdvancedPriority({ element: video, src: src }, index),
          preloaded: false,
          id: `video-${index}-${Date.now()}`,
        });
        if (wasAdded) newVideosAdded++;
      });
      if (newVideosAdded > 0) {
        this.log(`[VideoPreloader] Discovered ${newVideosAdded} new videos.`);
        // Reprioritize after discovering new videos
        this.reprioritizeQueue();
      }
    } catch (error) {
      this.logError('Video discovery failed', error);
    }
  }

  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(
          () => {
            func.apply(this, args);
            lastExecTime = Date.now();
          },
          delay - (currentTime - lastExecTime)
        );
      }
    };
  }

  preloadGlobalVideos() {
    try {
      const urls = window.getAllVideoUrls();
      let newGlobalVideos = 0;
      urls.forEach((url, index) => {
        const wasAdded = this.addVideoToQueue({
          src: url,
          priority: this.calculateAdvancedPriority({ src: url }, index),
          preloaded: false,
          id: `global-${index}`,
        });
        if (wasAdded) newGlobalVideos++;
      });
      if (newGlobalVideos > 0) {
        this.log(`[VideoPreloader] Added ${newGlobalVideos} new global videos.`);
        // Reprioritize after adding global videos
        this.reprioritizeQueue();
      }
    } catch (error) {
      this.logError('Failed to add global videos', error);
    }
  }

  getVideoSource(video) {
    return (
      video.currentSrc ||
      video.src ||
      (video.querySelector('source') && video.querySelector('source').src)
    );
  }

  isValidVideoUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  calculatePriority(video, index) {
    // Use the new advanced priority system
    return this.calculateAdvancedPriority(
      { element: video, src: this.getVideoSource(video) },
      index
    );
  }

  calculateAdvancedPriority(videoData, index) {
    const videoSrc = videoData.src;
    const videoElement = videoData.element;
    const videoPage = this.getVideoPage(videoSrc);
    let priority = 1; // Base priority

    // HIGHEST PRIORITY: Currently playing video (by element or src)
    let playingSrc = null;
    if (this.currentlyPlayingVideo) {
      playingSrc = this.getVideoSource(this.currentlyPlayingVideo);
    }
    const isPlaying =
      (videoElement && videoElement === this.currentlyPlayingVideo) ||
      (playingSrc && videoSrc && videoSrc === playingSrc);
    if (isPlaying) {
      priority = 1000; // Maximum priority for playing video
      this.log(
        `🎯 PLAYING VIDEO: ${videoSrc ? videoSrc.split('/').pop() : '[unknown src]'} - Priority: ${priority}`
      );
      return priority;
    }

    // HIGH PRIORITY: Videos on current page
    if (videoPage === this.currentPage) {
      if (this.aggressiveMode) {
        priority = 800; // High priority for current page in aggressive mode
      } else {
        priority = 50; // Medium-high priority in normal mode
      }

      // Bonus for visible videos on current page
      if (videoElement && this.isVideoVisible(videoElement)) {
        priority += 50;
      }

      // Bonus for first few videos on current page
      if (index < 3) {
        priority += 20;
      }
    } else {
      // LOWER PRIORITY: Videos on other pages
      if (this.aggressiveMode) {
        priority = 200; // Still decent priority in aggressive mode
      } else {
        priority = 10; // Low priority in normal mode
      }

      // Small bonus for visible videos even on other pages
      if (videoElement && this.isVideoVisible(videoElement)) {
        priority += 10;
      }
    }

    return Math.min(priority, 999); // Cap below playing video priority
  }

  calculatePageBasedPriority(videoConfig, pageType = null) {
    // Use the new advanced priority system for global videos too
    return this.calculateAdvancedPriority(videoConfig, 50); // Index 50 for global videos
  }

  isVideoVisible(video) {
    if (!video || !this.isValidDOMElement(video)) return false;
    try {
      const rect = video.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    } catch (error) {
      this.logError('Failed to check video visibility', error);
      return false;
    }
  }

  isValidDOMElement(element) {
    return (
      element &&
      element.nodeType === 1 &&
      element.tagName &&
      typeof element.getBoundingClientRect === 'function' &&
      document.contains(element)
    );
  }

  startPreloading() {
    if (this.currentPreloads >= this.maxConcurrentPreloads) return;

    this.preloadQueue.sort((a, b) => b.priority - a.priority);

    // Debug: Show queue priorities
    if (this.debug) {
      this.log('📊 Queue priorities after sort:');
      this.preloadQueue.slice(0, 5).forEach((item, i) => {
        const fileName = item.src.split('/').pop();
        this.log(`  ${i + 1}. ${fileName} - Priority: ${item.priority}`);
      });
    }

    const availableSlots = this.maxConcurrentPreloads - this.currentPreloads;
    let started = 0;

    for (const videoData of this.preloadQueue) {
      if (started >= availableSlots) break;
      if (!videoData.preloaded && !this.activeDownloads.has(videoData.src)) {
        this.activeDownloads.set(videoData.src, Date.now());
        const fileName = videoData.src.split('/').pop();
        this.log(`[VideoPreloader] Starting: ${fileName} (Priority: ${videoData.priority})`);
        this.preloadVideo(videoData);
        started++;
      }
    }
  }

  // Aggressive preloading - download ALL videos immediately
  startAggressivePreloading() {
    this.log('🚀 Starting aggressive video preloading - downloading all videos');

    // Set all videos to high priority for immediate download
    this.preloadQueue.forEach(videoData => {
      if (!videoData.preloaded) {
        videoData.priority = 100; // High priority for all
      }
    });

    // Start downloading up to max concurrent limit
    this.startPreloading();

    // Continue downloading remaining videos as slots become available
    this.continueAggressivePreloading();
  }

  // Continue aggressive downloading until all videos are preloaded
  continueAggressivePreloading() {
    const unpreloadedVideos = this.preloadQueue.filter(
      v => !v.preloaded && !this.activeDownloads.has(v.src)
    );

    if (unpreloadedVideos.length > 0 && this.currentPreloads < this.maxConcurrentPreloads) {
      // Start more downloads immediately
      setTimeout(() => {
        this.startPreloading();
        this.continueAggressivePreloading();
      }, 50); // Very short delay to keep downloads flowing
    }
  }

  async preloadVideo(videoData) {
    this.currentPreloads++;
    const startTime = Date.now();

    try {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;

      await new Promise((resolve, reject) => {
        video.addEventListener('loadeddata', resolve);
        video.addEventListener('error', reject);
        video.src = videoData.src;
        video.load();
      });

      videoData.preloaded = true;
      this.preloadedVideos.set(videoData.src, video);
      this.stats.videosPreloaded++;
      const duration = Date.now() - startTime;
      const fileName = videoData.src.split('/').pop();
      const cacheStatus = duration < 100 ? '(likely cached)' : '(network)';
      this.log(`[VideoPreloader] ✅ Downloaded: ${fileName} (${duration}ms ${cacheStatus})`);
    } catch (error) {
      this.logError(`Failed to preload: ${videoData.src}`, error);
    } finally {
      this.activeDownloads.delete(videoData.src);
      this.currentPreloads--;
      this.continuePreloading();
    }
  }

  continuePreloading() {
    if (this.currentPreloads < this.maxConcurrentPreloads) {
      if (this.aggressiveMode) {
        // In aggressive mode, immediately continue downloading
        setTimeout(() => {
          this.startPreloading();
          this.continueAggressivePreloading();
        }, 50);
      } else {
        setTimeout(() => this.startPreloading(), 100);
      }
    }
  }

  saveState() {
    try {
      const state = {
        queue: this.preloadQueue
          .filter(v => v.preloaded)
          .slice(0, 20)
          .map(video => ({
            src: video.src,
            priority: video.priority,
            preloaded: video.preloaded,
            id: video.id,
            // Intentionally exclude element reference
          })),
        timestamp: Date.now(),
      };
      sessionStorage.setItem(this.stateKey, JSON.stringify(state));
    } catch (error) {
      this.logError('Failed to save state', error);
    }
  }

  restoreState() {
    try {
      const savedState = sessionStorage.getItem(this.stateKey);
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.queue && Array.isArray(state.queue)) {
          let restoredCount = 0;
          state.queue.forEach(video => {
            video.preloaded = false; // Always reset status
            video.element = null; // Remove element references from restored state
            if (this.addVideoToQueue(video)) {
              restoredCount++;
            }
          });
          if (restoredCount > 0)
            this.log(`[VideoPreloader] Restored ${restoredCount} videos from previous session.`);
        }
      }
    } catch (error) {
      this.logError('Failed to restore state', error);
    }
  }

  boostVideoPriority(src) {
    const videoData = this.preloadQueue.find(v => v.src === src);
    if (videoData) {
      videoData.priority += 10;
      this.startPreloading();
    }
  }

  reprioritizeQueue() {
    this.preloadQueue.forEach(videoData => {
      if (videoData.element && this.isValidDOMElement(videoData.element)) {
        videoData.priority = this.calculatePriority(videoData.element, 0);
      } else if (videoData.element) {
        // Remove invalid element reference and use page-based priority
        videoData.element = null;
        videoData.priority = this.calculatePageBasedPriority(videoData);
      }
    });
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
  }

  // Public method for compatibility with video-manager.js
  addVideo(video) {
    try {
      const src = this.getVideoSource(video);
      const wasAdded = this.addVideoToQueue({
        element: video,
        src: src,
        priority: this.calculateAdvancedPriority({ element: video, src: src }, 0), // Use new priority system
        preloaded: false,
        id: `manual-${Date.now()}`,
      });
      if (wasAdded) {
        this.log(`[VideoPreloader] Manually added via videoManager: ${src.split('/').pop()}`);
        this.reprioritizeQueue(); // Reprioritize after adding
      }
    } catch (error) {
      this.logError('Failed to add video from videoManager', error);
    }
  }
}

// Create global instance with error handling
try {
  window.videoPreloaderSafe = new VideoPreloaderSafe();
  window.videoPreloaderSafe.init();

  // Provide compatibility with existing video manager
  if (window.videoManager) {
    const originalAddVideo = window.videoManager.addVideo.bind(window.videoManager);
    window.videoManager.addVideo = function (video) {
      originalAddVideo(video);
      if (window.videoPreloaderSafe) {
        window.videoPreloaderSafe.addVideo(video);
      }
    };
  }
} catch (error) {
  // Silent error handling - preloader fails safely
}

// Simple debug function
window.debugVideoPreloaderSafe = function () {
  if (!window.videoPreloaderSafe) {
    console.log('❌ VideoPreloaderSafe not initialized');
    return;
  }

  const preloader = window.videoPreloaderSafe;
  const stats = preloader.stats;
  const runtime = Date.now() - stats.startTime;

  console.log('=== 🎬 VideoPreloaderSafe Debug Info ===');
  console.log('📊 Statistics:', {
    discovered: stats.videosDiscovered,
    preloaded: stats.videosPreloaded,
    errors: stats.errors,
    runtime: `${Math.round(runtime / 1000)}s`,
  });
  console.log('🔧 Configuration:', {
    debug: preloader.debug,
    verboseLogging: preloader.verboseLogging,
    performanceLogging: preloader.performanceLogging,
    maxConcurrentPreloads: preloader.maxConcurrentPreloads,
  });
  console.log('📋 Queue Status:', {
    queueSize: preloader.preloadQueue.length,
    activeDownloads: preloader.currentPreloads,
    preloadedVideos: preloader.preloadedVideos.size,
  });
  console.log('📍 Current Page:', preloader.currentPage);

  // Show additional debug info
  console.log('🔍 Additional Info:', {
    isPreloading: preloader.isPreloading,
    initialized: preloader.initialized,
    hasGlobalVideoConfig: !!window.globalVideoConfig,
    hasGetAllVideoUrls: !!window.getAllVideoUrls,
  });

  // Show queue details
  console.log(
    '📝 Queue Details:',
    preloader.preloadQueue.map(v => ({
      src: v.src.substring(0, 60) + '...',
      priority: v.priority,
      preloaded: v.preloaded,
      id: v.id,
    }))
  );

  return {
    stats,
    config: {
      debug: preloader.debug,
      verboseLogging: preloader.verboseLogging,
      performanceLogging: preloader.performanceLogging,
    },
    queue: preloader.preloadQueue.length,
    active: preloader.currentPreloads,
    preloaded: preloader.preloadedVideos.size,
  };
};

// Live Video Preloader Dashboard
window.startVideoPreloaderDashboard = function () {
  if (!window.videoPreloaderSafe) {
    console.log('❌ VideoPreloaderSafe not initialized');
    return;
  }

  // Clear any existing dashboard
  if (window.preloaderDashboardInterval) {
    clearInterval(window.preloaderDashboardInterval);
  }

  console.log('🚀 Starting Video Preloader Live Dashboard (updates every 5 seconds)');
  console.log('📝 Use stopVideoPreloaderDashboard() to stop');

  function displayDashboard() {
    const preloader = window.videoPreloaderSafe;
    const stats = preloader.stats;
    const runtime = Date.now() - stats.startTime;

    console.clear();
    console.log('🎬 ═══════════════════════════════════════════════════════════════');
    console.log('🎬           WAYPOINT MEDIA - VIDEO PRELOADER DASHBOARD');
    console.log('🎬 ═══════════════════════════════════════════════════════════════');

    // System Status
    console.log(`\n📊 SYSTEM STATUS (Runtime: ${Math.round(runtime / 1000)}s)`);
    console.log(`   📍 Current Page: ${preloader.currentPage}`);
    console.log(`   🔧 Max Concurrent: ${preloader.maxConcurrentPreloads}`);
    console.log(
      `   🔄 Currently Active: ${preloader.currentPreloads}/${preloader.maxConcurrentPreloads}`
    );
    console.log(`   ⚡ Is Preloading: ${preloader.isPreloading ? '✅ YES' : '❌ NO'}`);

    // Statistics - Fix calculation errors
    const queuePreloaded = preloader.preloadQueue.filter(v => v.preloaded).length;
    const actualPreloaded = preloader.preloadedVideos.size;
    const successRate =
      stats.videosDiscovered > 0 ? Math.round((actualPreloaded / stats.videosDiscovered) * 100) : 0;

    console.log(`\n📈 STATISTICS`);
    console.log(`   🔍 Videos Discovered: ${stats.videosDiscovered}`);
    console.log(`   ✅ Videos Preloaded: ${actualPreloaded} (${queuePreloaded} in queue)`);
    console.log(`   ❌ Errors: ${stats.errors}`);
    console.log(`   📋 Queue Size: ${preloader.preloadQueue.length}`);
    console.log(`   🎯 Success Rate: ${successRate}%`);

    // Progress Bar - Use actual preloaded count
    const totalVideos = preloader.preloadQueue.length;
    const preloadedCount = queuePreloaded;
    const progressPercent = totalVideos > 0 ? Math.round((preloadedCount / totalVideos) * 100) : 0;
    const progressBar =
      '█'.repeat(Math.floor(progressPercent / 5)) +
      '░'.repeat(20 - Math.floor(progressPercent / 5));

    console.log(`\n📊 OVERALL PROGRESS`);
    console.log(`   [${progressBar}] ${progressPercent}% (${preloadedCount}/${totalVideos})`);

    // Video Details
    console.log(`\n🎥 VIDEO QUEUE DETAILS`);
    preloader.preloadQueue
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10) // Show top 10
      .forEach((video, index) => {
        const status = video.preloaded ? '✅' : preloader.currentPreloads > 0 ? '⏳' : '⏸️';
        const fileName = video.src.split('/').pop() || 'unknown';
        const shortName = fileName.length > 30 ? fileName.substring(0, 27) + '...' : fileName;
        const priorityStr = `[P:${video.priority}]`;

        console.log(`   ${index + 1}. ${status} ${priorityStr} ${shortName}`);
      });

    if (preloader.preloadQueue.length > 10) {
      console.log(`   ... and ${preloader.preloadQueue.length - 10} more videos`);
    }

    // Current Activity - Show more accurate download status
    if (preloader.currentPreloads > 0) {
      console.log(`\n⏳ CURRENTLY DOWNLOADING (${preloader.currentPreloads} active)`);
      const downloadingVideos = preloader.preloadQueue
        .filter(v => !v.preloaded && v.priority > 0)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, Math.max(preloader.currentPreloads, 3)); // Show at least 3 or actual count

      downloadingVideos.forEach((video, index) => {
        const fileName = video.src.split('/').pop() || 'unknown';
        const shortName = fileName.length > 40 ? fileName.substring(0, 37) + '...' : fileName;
        const priorityStr = `[P:${video.priority}]`;
        console.log(`   🔄 ${priorityStr} ${shortName}`);
      });
    } else if (preloader.preloadQueue.some(v => !v.preloaded)) {
      console.log(`\n⏸️ DOWNLOAD QUEUE PAUSED - Next videos ready to download:`);
      preloader.preloadQueue
        .filter(v => !v.preloaded)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3)
        .forEach((video, index) => {
          const fileName = video.src.split('/').pop() || 'unknown';
          const shortName = fileName.length > 40 ? fileName.substring(0, 37) + '...' : fileName;
          const priorityStr = `[P:${video.priority}]`;
          console.log(`   ⏳ ${priorityStr} ${shortName}`);
        });
    }

    // Recent Errors
    if (stats.errors > 0) {
      console.log(`\n❌ ERROR COUNT: ${stats.errors}`);
      console.log(`   💡 Check verbose logs for error details`);
    }

    console.log(`\n🔄 Dashboard will refresh in 5 seconds...`);
    console.log(
      `📝 Commands: stopVideoPreloaderDashboard() | debugVideoPreloaderSafe() | kickstartDownloads()`
    );
  }

  // Initial display
  displayDashboard();

  // Set up interval
  window.preloaderDashboardInterval = setInterval(displayDashboard, 5000);

  return 'Dashboard started! Use stopVideoPreloaderDashboard() to stop.';
};

window.stopVideoPreloaderDashboard = function () {
  if (window.preloaderDashboardInterval) {
    clearInterval(window.preloaderDashboardInterval);
    window.preloaderDashboardInterval = null;
    console.log('🛑 Video Preloader Dashboard stopped');
  } else {
    console.log('ℹ️ Dashboard is not currently running');
  }
};

// Manual download kickstart function
window.kickstartDownloads = function () {
  if (!window.videoPreloaderSafe) {
    console.log('❌ VideoPreloaderSafe not initialized');
    return;
  }

  const preloader = window.videoPreloaderSafe;
  console.log('🚀 Manually kickstarting video downloads...');
  console.log(
    `📊 Before: ${preloader.currentPreloads}/${preloader.maxConcurrentPreloads} active downloads`
  );

  // Clean invalid URLs from queue
  const cleanedCount = preloader.cleanInvalidUrls();
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} invalid URLs from queue`);
  }

  // Reset flags that might be blocking downloads
  preloader.isPreloading = false;

  // Force start new downloads
  preloader.startPreloading();

  console.log(
    `📊 After: ${preloader.currentPreloads}/${preloader.maxConcurrentPreloads} active downloads`
  );
  console.log('✅ Kickstart complete - check dashboard for progress');

  return {
    activeDownloads: preloader.currentPreloads,
    maxConcurrent: preloader.maxConcurrentPreloads,
    queueLength: preloader.preloadQueue.length,
    unpreloadedCount: preloader.preloadQueue.filter(v => !v.preloaded).length,
    cleanedUrls: cleanedCount,
  };
};

// Cache analysis function
window.analyzeCacheStatus = function () {
  if (!window.videoPreloaderSafe) {
    console.log('❌ VideoPreloaderSafe not initialized');
    return;
  }

  const preloader = window.videoPreloaderSafe;
  console.log('🔍 ═══════════════════════════════════════════════════════════════');
  console.log('🔍           BROWSER CACHE ANALYSIS');
  console.log('🔍 ═══════════════════════════════════════════════════════════════');

  console.log(`\n📊 CACHE STATUS:`);
  console.log(`   💾 Videos in Memory: ${preloader.preloadedVideos.size}`);
  console.log(`   📋 Videos in Queue: ${preloader.preloadQueue.length}`);
  console.log(`   🔄 Active Downloads: ${preloader.currentPreloads}`);
  console.log(`   📡 Tracking Downloads: ${preloader.activeDownloads.size}`);

  // Show which videos are in memory cache
  console.log(`\n💾 VIDEOS IN MEMORY CACHE:`);
  preloader.preloadedVideos.forEach((video, url) => {
    const fileName = url.split('/').pop() || 'unknown';
    const shortName = fileName.length > 50 ? fileName.substring(0, 47) + '...' : fileName;
    console.log(`   ✅ ${shortName}`);
  });

  // Show which videos are being tracked as downloading
  if (preloader.activeDownloads.size > 0) {
    console.log(`\n🔄 CURRENTLY DOWNLOADING:`);
    preloader.activeDownloads.forEach((startTime, url) => {
      const fileName = url.split('/').pop() || 'unknown';
      const shortName = fileName.length > 50 ? fileName.substring(0, 47) + '...' : fileName;
      const duration = Date.now() - startTime;
      console.log(`   ⏳ ${shortName} (${duration}ms elapsed)`);
    });
  }

  // Show duplicate analysis
  const urlCounts = {};
  preloader.preloadQueue.forEach(video => {
    const fileName = video.src.split('/').pop() || 'unknown';
    urlCounts[fileName] = (urlCounts[fileName] || 0) + 1;
  });

  const duplicates = Object.entries(urlCounts).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log(`\n⚠️ DUPLICATE VIDEOS IN QUEUE:`);
    duplicates.forEach(([fileName, count]) => {
      console.log(`   🔁 ${fileName}: ${count} instances`);
    });
  } else {
    console.log(`\n✅ NO DUPLICATES: All videos in queue are unique`);
  }

  return {
    memoryCache: preloader.preloadedVideos.size,
    queueSize: preloader.preloadQueue.length,
    activeDownloads: preloader.currentPreloads,
    trackingDownloads: preloader.activeDownloads.size,
    duplicates: duplicates.length,
  };
};
