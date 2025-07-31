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
    console.log('Loading commercial projects from config/commercial.json...');
    const response = await fetch('../config/commercial.json');
    if (!response.ok) throw new Error('Failed to load commercial.json');
    const data = await response.json();
    // Transform data to expected structure
    commercialProjects = Object.entries(data).map(([id, project]) => {
      const videoEntries = project.videos ? Object.entries(project.videos) : [];
      const allVideos = videoEntries.map(([filename, meta]) => ({
        name: filename,
        url: `https://d1fp8ti9bzsng5.cloudfront.net/${id}/${filename}`,
        title: meta.title || filename,
        description: meta.description || '',
      }));
      return {
        id,
        title: project.title || id,
        description: project.description || '',
        type: project.category || 'general',
        category: project.category || 'general',
        date: project.date || '',
        videoUrl: allVideos[0] ? allVideos[0].url : '',
        videoCount: allVideos.length,
        allVideos,
      };
    });
    // Sort projects by title (or date if available)
    commercialProjects.sort((a, b) => a.title.localeCompare(b.title));
    updateProjectCount();
    renderProjects();
  } catch (error) {
    console.error('Error loading commercial projects:', error);
    showEmptyState();
  }
}

// processCommercialRelease is no longer needed

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

    // Pause all other videos when a new one is played in the modal
    setTimeout(() => {
      const modalVideos = document.querySelectorAll('#videoModal video');
      modalVideos.forEach(video => {
        video.addEventListener('play', function () {
          modalVideos.forEach(v => {
            if (v !== video) v.pause();
          });
        });
      });
    }, 100);
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

  // Pause all videos in the modal when closing
  if (modalVideo) {
    modalVideo.pause();
    modalVideo.currentTime = 0;
  }
  if (videoGallery) {
    const galleryVideos = videoGallery.querySelectorAll('video');
    galleryVideos.forEach(video => {
      video.pause();
      video.currentTime = 0;
    });
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
