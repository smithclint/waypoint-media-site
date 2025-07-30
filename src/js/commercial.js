// Commercial Portfolio JavaScript
// Handles loading and displaying commercial video projects

// Commercial projects data structure
let commercialProjects = [];
let commercialConfig = {};

// GitHub API configuration
const GITHUB_USERNAME = 'smithclint';
const GITHUB_REPO = 'waypoint-media-site';

// Initialize portfolio
document.addEventListener('DOMContentLoaded', async function () {
  // Initialize modal functionality first
  initializeModal();

  // Load commercial config first, then load projects
  await loadCommercialConfig();
  await loadCommercialProjects();

  // Hide empty state and show projects
  const container = document.getElementById('portfolio-grid');
  const emptyState = document.getElementById('portfolio-empty');
  if (emptyState) emptyState.style.display = 'none';
  if (container) container.style.display = 'grid';
});

async function loadCommercialConfig() {
  try {
    const response = await fetch('../config/commercial.json');
    if (response.ok) {
      commercialConfig = await response.json();
      console.log('Commercial config loaded:', commercialConfig);
    } else {
      console.log('No config/commercial.json found, using default naming');
      commercialConfig = {};
    }
  } catch (error) {
    console.log('Error loading commercial config, using defaults:', error);
    commercialConfig = {};
  }
}

async function loadCommercialProjects() {
  try {
    console.log('Loading commercial projects...');

    // Fetch GitHub releases
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/releases`
    );
    const releases = await response.json();

    // Filter for commercial releases (those that start with "commercial-")
    const commercialReleases = releases.filter(release =>
      release.tag_name.startsWith('commercial-')
    );

    console.log(`Found ${commercialReleases.length} commercial releases`);

    // Process each commercial release
    commercialProjects = [];
    for (const release of commercialReleases) {
      const project = await processCommercialRelease(release);
      if (project) {
        commercialProjects.push(project);
      }
    }

    // Sort projects by date (newest first)
    commercialProjects.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log(`Processed ${commercialProjects.length} commercial projects`);

    // Update UI
    updateProjectCount();
    renderProjects();
  } catch (error) {
    console.error('Error loading commercial projects:', error);
    showEmptyState();
  }
}

async function processCommercialRelease(release) {
  try {
    // Extract project info from release
    const tagName = release.tag_name;
    const config = commercialConfig[tagName] || {};

    // Use config title if available, otherwise format from tag name
    const title =
      config.title || release.name || tagName.replace('commercial-', '').replace(/-/g, ' ');
    const description = config.description || release.body || `Commercial video project: ${title}`;

    // Get video files from release assets
    const videoAssets = release.assets.filter(asset =>
      asset.name.match(/\.(mp4|mov|avi|mkv|webm)$/i)
    );

    if (videoAssets.length === 0) {
      console.log(`No video files found in release: ${tagName}`);
      return null;
    }

    // Use the first video as the main video
    const mainVideo = videoAssets[0];
    const videoUrl = mainVideo.browser_download_url;

    // Extract project type from tag name (everything after "commercial-")
    const projectType = tagName.replace('commercial-', '').split('-')[0];

    // Process all videos with custom naming if available
    const allVideos = videoAssets.map(asset => {
      const videoConfig = config.videos && config.videos[asset.name];
      return {
        name: asset.name,
        url: asset.browser_download_url,
        size: asset.size,
        title: videoConfig
          ? videoConfig.title
          : asset.name.replace(/\.[^/.]+$/, '').replace(/-/g, ' '),
        description: videoConfig ? videoConfig.description : '',
      };
    });

    return {
      id: tagName,
      title: title,
      description: description,
      type: projectType,
      category: config.category || 'general',
      date: release.published_at,
      videoUrl: videoUrl,
      videoCount: videoAssets.length,
      allVideos: allVideos,
      releaseUrl: release.html_url,
    };
  } catch (error) {
    console.error('Error processing release:', release.tag_name, error);
    return null;
  }
}

function updateProjectCount() {
  const countElement = document.getElementById('project-count');
  if (countElement) {
    countElement.textContent = commercialProjects.length;
  }
}

function renderProjects() {
  const container = document.getElementById('portfolio-grid');
  const emptyState = document.getElementById('portfolio-empty');

  if (commercialProjects.length === 0) {
    showEmptyState();
    return;
  }

  // Hide empty state and show projects
  if (emptyState) emptyState.style.display = 'none';
  if (container) container.style.display = 'grid';

  container.innerHTML = commercialProjects
    .map(
      project => `
        <div class="portfolio-item" data-project-id="${project.id}">
            <div class="video-container">
                <video
                    poster="${generateVideoPoster(project.videoUrl)}"
                    preload="metadata"
                    onclick="openVideoModal('${project.id}')"
                >
                    <source src="${project.videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div class="video-overlay">
                    <div class="play-button">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
            </div>
            <div class="project-info">
                <h3>${project.title}</h3>
                <p class="project-description">${project.description}</p>
                <div class="project-meta">
                    <span class="project-type">
                        <i class="fas fa-tag"></i> ${formatProjectType(project.type)}
                    </span>
                    <span class="project-date">
                        <i class="fas fa-calendar"></i> ${formatDate(project.date)}
                    </span>
                    ${
                      project.videoCount > 1
                        ? `
                        <span class="video-count">
                            <i class="fas fa-video"></i> ${project.videoCount} videos
                        </span>
                    `
                        : ''
                    }
                </div>
                <button class="view-project-btn" onclick="openVideoModal('${project.id}')">
                    ${project.videoCount > 1 ? 'View' : '<i class="fas fa-play"></i> Watch Video'}
                </button>
            </div>
        </div>
    `
    )
    .join('');
}

function showEmptyState() {
  const container = document.getElementById('portfolio-grid');
  const emptyState = document.getElementById('portfolio-empty');

  if (container) container.style.display = 'none';
  if (emptyState) emptyState.style.display = 'block';
}

function generateVideoPoster(videoUrl) {
  // For now, return empty string - could implement thumbnail generation later
  return '';
}

function formatProjectType(type) {
  return type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// View controls (grid/list view)
function initializeViewControls() {
  const viewBtns = document.querySelectorAll('.view-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const view = this.dataset.view;
      switchView(view);

      // Update active button
      viewBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

function switchView(view) {
  const container = document.getElementById('portfolio-grid');
  if (!container) return;

  container.className = view === 'list' ? 'portfolio-list' : 'portfolio-grid';
}

// Modal functionality
function initializeModal() {
  const modal = document.getElementById('videoModal');
  const closeBtn = document.querySelector('.close');
  const modalVideo = document.getElementById('modal-video');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeVideoModal);
  }

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeVideoModal();
      }
    });
  }

  // Pause video when modal closes
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeVideoModal();
    }
  });
}

function openVideoModal(projectId) {
  const project = commercialProjects.find(p => p.id === projectId);
  if (!project) return;

  const modal = document.getElementById('videoModal');
  const modalTitle = document.getElementById('modal-title');
  const modalDescription = document.getElementById('modal-description');
  const modalType = document.getElementById('modal-type');
  const modalDate = document.getElementById('modal-date');

  const singleVideoContainer = document.getElementById('single-video-container');
  const multipleVideosContainer = document.getElementById('multiple-videos-container');
  const videoGallery = document.getElementById('video-gallery');

  // Update modal content
  if (modalTitle) modalTitle.textContent = project.title;
  if (modalDescription) modalDescription.textContent = project.description;
  if (modalType)
    modalType.innerHTML = `<i class="fas fa-tag"></i> ${formatProjectType(project.type)}`;
  if (modalDate)
    modalDate.innerHTML = `<i class="fas fa-calendar"></i> ${formatDate(project.date)}`;

  // Handle single vs multiple videos
  if (project.videoCount === 1) {
    // Show single video
    const modalVideo = document.getElementById('modal-video');
    const modalVideoSource = document.getElementById('modal-video-source');

    if (modalVideoSource && modalVideo) {
      modalVideoSource.src = project.videoUrl;
      modalVideo.load();
    }

    singleVideoContainer.style.display = 'block';
    multipleVideosContainer.style.display = 'none';
  } else {
    // Show multiple videos gallery
    if (videoGallery) {
      videoGallery.innerHTML = project.allVideos
        .map(
          (video, index) => `
            <div class="video-gallery-item">
              <div class="gallery-video-container">
                <video controls preload="metadata" onloadedmetadata="handleVideoAspectRatio(this)">
                  <source src="${video.url}" type="video/mp4">
                  Your browser does not support the video tag.
                </video>
                <div class="video-overlay-info">
                  <h4>${video.title}</h4>
                  ${video.description ? `<p class="video-description">${video.description}</p>` : ''}
                </div>
              </div>
            </div>
          `
        )
        .join('');
    }

    singleVideoContainer.style.display = 'none';
    multipleVideosContainer.style.display = 'block';
  }

  // Show modal
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Refresh video manager to pick up any new videos in the modal
    if (window.videoManager) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        window.videoManager.refresh();

        // Also handle video preloading for modal videos
        if (window.videoPreloader) {
          const modalVideo = document.getElementById('modal-video');
          if (modalVideo) {
            window.videoPreloader.handleModalVideo(modalVideo);
          }

          // Handle gallery videos in modal
          const galleryVideos = document.querySelectorAll('#video-gallery video');
          galleryVideos.forEach(video => {
            window.videoPreloader.addVideo(video);
          });
        }
      }, 100);
    }
  }
}

function closeVideoModal() {
  const modal = document.getElementById('videoModal');
  const modalVideo = document.getElementById('modal-video');
  const videoGallery = document.getElementById('video-gallery');

  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
  }

  // Use video manager to pause all videos if available
  if (window.videoManager) {
    window.videoManager.pauseAllVideos();
  } else {
    // Fallback to manual pausing
    // Pause single video
    if (modalVideo) {
      modalVideo.pause();
      modalVideo.currentTime = 0;
    }

    // Pause all gallery videos
    if (videoGallery) {
      const galleryVideos = videoGallery.querySelectorAll('video');
      galleryVideos.forEach(video => {
        video.pause();
        video.currentTime = 0;
      });
    }
  }
}

// Utility function to refresh portfolio (useful for debugging)
window.refreshCommercialPortfolio = function () {
  console.log('Refreshing commercial portfolio...');
  loadCommercialProjects();
};

// Handle video aspect ratio for better display
window.handleVideoAspectRatio = function (video) {
  video.addEventListener('loadedmetadata', function () {
    const aspectRatio = this.videoWidth / this.videoHeight;

    // If portrait video (height > width), add special class
    if (aspectRatio < 1) {
      this.classList.add('portrait-video');
      this.style.maxHeight = '250px';
      this.style.width = 'auto';
      this.style.margin = '0 auto';
      this.style.display = 'block';
    }
  });
};
