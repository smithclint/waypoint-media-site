// Global Video Manager
// Ensures only one video plays at a time across the entire site

class VideoManager {
  constructor() {
    this.currentlyPlaying = null;
    this.allVideos = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupVideoManagement());
    } else {
      this.setupVideoManagement();
    }

    this.initialized = true;
  }

  setupVideoManagement() {
    // Find all video elements on the page
    this.discoverVideos();

    // Set up event listeners for all videos
    this.setupVideoListeners();

    // Set up observer for dynamically added videos (like in modals)
    this.setupVideoObserver();

    console.log(`Video Manager initialized with ${this.allVideos.length} videos`);
  }

  discoverVideos() {
    // Get all video elements currently in the DOM
    const videos = document.querySelectorAll('video');
    this.allVideos = Array.from(videos);
  }

  setupVideoListeners() {
    this.allVideos.forEach((video, index) => {
      // Add unique identifier if not present
      if (!video.dataset.videoId) {
        video.dataset.videoId = `video-${index}-${Date.now()}`;
      }

      // Remove any existing listeners to prevent duplicates
      video.removeEventListener('play', this.handleVideoPlay.bind(this));
      video.removeEventListener('pause', this.handleVideoPause.bind(this));
      video.removeEventListener('ended', this.handleVideoEnded.bind(this));

      // Add event listeners
      video.addEventListener('play', this.handleVideoPlay.bind(this));
      video.addEventListener('pause', this.handleVideoPause.bind(this));
      video.addEventListener('ended', this.handleVideoEnded.bind(this));
    });
  }

  setupVideoObserver() {
    // Create observer to watch for new video elements added to the DOM
    const observer = new MutationObserver(mutations => {
      let newVideosAdded = false;

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a video or contains videos
            if (node.tagName === 'VIDEO') {
              this.addVideo(node);
              newVideosAdded = true;
            } else if (node.querySelectorAll) {
              const videos = node.querySelectorAll('video');
              if (videos.length > 0) {
                videos.forEach(video => this.addVideo(video));
                newVideosAdded = true;
              }
            }
          }
        });
      });

      if (newVideosAdded) {
        console.log(`Video Manager discovered ${this.allVideos.length} total videos`);
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  addVideo(video) {
    // Check if video is already managed
    if (this.allVideos.includes(video)) {
      return;
    }

    // Add to our collection
    this.allVideos.push(video);

    // Add unique identifier
    if (!video.dataset.videoId) {
      video.dataset.videoId = `video-${this.allVideos.length}-${Date.now()}`;
    }

    // Set up listeners for the new video
    video.addEventListener('play', this.handleVideoPlay.bind(this));
    video.addEventListener('pause', this.handleVideoPause.bind(this));
    video.addEventListener('ended', this.handleVideoEnded.bind(this));
  }

  handleVideoPlay(event) {
    const playingVideo = event.target;
    const videoId = playingVideo.dataset.videoId;

    console.log(`Video started playing: ${videoId}`);

    // Boost priority in preloader for this video
    if (window.videoPreloader) {
      // Get video source (either from src attribute or source element)
      let videoSrc = playingVideo.src || playingVideo.currentSrc;
      if (!videoSrc) {
        const sourceElement = playingVideo.querySelector('source');
        if (sourceElement) {
          videoSrc = sourceElement.src;
        }
      }

      if (videoSrc) {
        window.videoPreloader.boostVideoPriority(videoSrc);
      }
    }

    // If there's already a video playing, pause it
    if (this.currentlyPlaying && this.currentlyPlaying !== playingVideo) {
      console.log(`Pausing previous video: ${this.currentlyPlaying.dataset.videoId}`);
      this.currentlyPlaying.pause();
    }

    // Set this video as currently playing
    this.currentlyPlaying = playingVideo;
  }

  handleVideoPause(event) {
    const pausedVideo = event.target;
    const videoId = pausedVideo.dataset.videoId;

    console.log(`Video paused: ${videoId}`);

    // Clear currently playing if this was the playing video
    if (this.currentlyPlaying === pausedVideo) {
      this.currentlyPlaying = null;
    }
  }

  handleVideoEnded(event) {
    const endedVideo = event.target;
    const videoId = endedVideo.dataset.videoId;

    console.log(`Video ended: ${videoId}`);

    // Clear currently playing if this was the playing video
    if (this.currentlyPlaying === endedVideo) {
      this.currentlyPlaying = null;
    }
  }

  // Public method to pause all videos
  pauseAllVideos() {
    console.log('Pausing all videos');
    this.allVideos.forEach(video => {
      if (!video.paused) {
        video.pause();
      }
    });
    this.currentlyPlaying = null;
  }

  // Public method to get currently playing video
  getCurrentlyPlaying() {
    return this.currentlyPlaying;
  }

  // Public method to get all managed videos
  getAllVideos() {
    return this.allVideos;
  }

  // Method to refresh video discovery (useful for dynamic content)
  refresh() {
    console.log('Refreshing video discovery...');
    this.discoverVideos();
    this.setupVideoListeners();
  }
}

// Create global instance
window.videoManager = new VideoManager();

// Auto-initialize when script loads
window.videoManager.init();

// Also provide a way to manually initialize if needed
window.initVideoManager = function () {
  window.videoManager.init();
};

// Debug helpers
window.debugVideoManager = function () {
  const vm = window.videoManager;
  console.log('=== Video Manager Debug Info ===');
  console.log('Total videos managed:', vm.getAllVideos().length);
  console.log('Currently playing:', vm.getCurrentlyPlaying()?.dataset.videoId || 'None');
  console.log(
    'All videos:',
    vm.getAllVideos().map(v => ({
      id: v.dataset.videoId,
      src: v.currentSrc || v.src,
      paused: v.paused,
      currentTime: v.currentTime,
    }))
  );
};
