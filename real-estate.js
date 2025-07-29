// Real Estate Portfolio JavaScript

// Load photo data from photos.json and GitHub releases
let portfolioData = {};

// Fetch photo data on page load
async function loadPhotoData() {
  try {
    const response = await fetch('photos.json');
    if (response.ok) {
      const shootMetadata = await response.json();
      portfolioData = await loadPhotosFromReleases(shootMetadata);
      updatePortfolioGrid();
    } else {
      console.warn('Could not load photos.json, using fallback data');
      portfolioData = getFallbackData();
      updatePortfolioGrid();
    }
  } catch (error) {
    console.warn('Error loading photos.json:', error);
    portfolioData = getFallbackData();
    updatePortfolioGrid();
  }
}

// Load photos from GitHub releases based on shoot metadata
async function loadPhotosFromReleases(shootMetadata) {
  const enrichedData = {};

  for (const [shootId, metadata] of Object.entries(shootMetadata)) {
    enrichedData[shootId] = { ...metadata };

    // If this shoot has a release_tag, fetch photos from GitHub
    if (metadata.release_tag) {
      try {
        const releaseUrl = `https://api.github.com/repos/smithclint/waypoint-media-site/releases/tags/${metadata.release_tag}`;
        const releaseResponse = await fetch(releaseUrl);

        if (releaseResponse.ok) {
          const releaseData = await releaseResponse.json();
          const images = releaseData.assets
            .filter(asset => asset.name.match(/\.(jpg|jpeg|png|webp)$/i))
            .map(asset => ({
              url: asset.browser_download_url,
              caption: generateCaptionFromFilename(asset.name, metadata.shoot_prefix),
            }));

          enrichedData[shootId].images = images;
          console.log(`Loaded ${images.length} photos for ${shootId} from GitHub release`);
        } else {
          console.warn(`Could not fetch release data for ${shootId}`);
          enrichedData[shootId].images = metadata.images || [];
        }
      } catch (error) {
        console.warn(`Error loading photos for ${shootId}:`, error);
        enrichedData[shootId].images = metadata.images || [];
      }
    } else {
      // Use existing images array if no release_tag
      enrichedData[shootId].images = metadata.images || [];
    }
  }

  return enrichedData;
}

// Generate a clean caption from filename
function generateCaptionFromFilename(filename, shootPrefix) {
  // Remove the shoot prefix and file extension
  let caption = filename;
  if (shootPrefix) {
    caption = caption.replace(new RegExp(`^${shootPrefix}-`, 'i'), '');
  }
  caption = caption.replace(/\.(jpg|jpeg|png|webp)$/i, '');

  // Convert hyphens and underscores to spaces, then title case
  caption = caption.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return caption;
}

// Fallback data in case photos.json isn't available
function getFallbackData() {
  return {
    'luxury-estate-florida': {
      title: 'Luxury Waterfront Estate - Florida',
      description: 'Stunning waterfront luxury home with private dock and pool',
      category: 'luxury-homes',
      images: [
        {
          url: 'https://via.placeholder.com/800x600/2c3e50/ffffff?text=Luxury+Estate+Full+1',
          caption: 'Aerial overview of waterfront estate',
        },
        {
          url: 'https://via.placeholder.com/800x600/34495e/ffffff?text=Luxury+Estate+Full+2',
          caption: 'Pool and outdoor entertainment area',
        },
        {
          url: 'https://via.placeholder.com/800x600/2c3e50/ffffff?text=Luxury+Estate+Full+3',
          caption: 'Private dock and water access',
        },
        {
          url: 'https://via.placeholder.com/800x600/34495e/ffffff?text=Luxury+Estate+Full+4',
          caption: 'Landscaping and property boundaries',
        },
      ],
    },
    'office-complex-atlanta': {
      title: 'Modern Office Complex - Atlanta',
      description: 'Commercial office development with ample parking',
      category: 'commercial',
      images: [
        {
          url: 'https://via.placeholder.com/800x600/3498db/ffffff?text=Office+Complex+Full+1',
          caption: 'Office complex overview',
        },
        {
          url: 'https://via.placeholder.com/800x600/2980b9/ffffff?text=Office+Complex+Full+2',
          caption: 'Parking and accessibility',
        },
        {
          url: 'https://via.placeholder.com/800x600/3498db/ffffff?text=Office+Complex+Full+3',
          caption: 'Building architecture details',
        },
      ],
    },
    'suburban-home-orlando': {
      title: 'Family Home - Orlando',
      description: 'Charming suburban home with large backyard',
      category: 'residential',
      images: [
        {
          url: 'https://via.placeholder.com/800x600/e74c3c/ffffff?text=Suburban+Home+Full+1',
          caption: 'Front elevation and curb appeal',
        },
        {
          url: 'https://via.placeholder.com/800x600/c0392b/ffffff?text=Suburban+Home+Full+2',
          caption: 'Backyard and outdoor space',
        },
        {
          url: 'https://via.placeholder.com/800x600/e74c3c/ffffff?text=Suburban+Home+Full+3',
          caption: 'Neighborhood context',
        },
      ],
    },
    'beachfront-condo-miami': {
      title: 'Beachfront Condominium - Miami',
      description: 'Luxury oceanfront condominium with beach access',
      category: 'waterfront',
      images: [
        {
          url: 'https://via.placeholder.com/800x600/1abc9c/ffffff?text=Beachfront+Condo+Full+1',
          caption: 'Oceanfront building overview',
        },
        {
          url: 'https://via.placeholder.com/800x600/16a085/ffffff?text=Beachfront+Condo+Full+2',
          caption: 'Beach access and amenities',
        },
        {
          url: 'https://via.placeholder.com/800x600/1abc9c/ffffff?text=Beachfront+Condo+Full+3',
          caption: 'Coastal views and location',
        },
      ],
    },
  };
}

// Update the portfolio grid with loaded data
function updatePortfolioGrid() {
  const portfolioGrid = document.getElementById('portfolioGrid');
  if (!portfolioGrid) return;

  // Clear existing placeholder items
  portfolioGrid.innerHTML = '';

  // Generate portfolio items from data
  Object.keys(portfolioData).forEach(shootId => {
    const shoot = portfolioData[shootId];
    if (!shoot.images || shoot.images.length === 0) return;

    // Use the first image as the preview
    const previewImage = shoot.images[0];

    const portfolioItem = document.createElement('div');
    portfolioItem.className = 'portfolio-item';
    portfolioItem.setAttribute('data-category', shoot.category);
    portfolioItem.setAttribute('data-shoot', shootId);

    portfolioItem.innerHTML = `
      <div class="portfolio-image">
        <img src="${previewImage.url}" alt="${shoot.title}" loading="lazy" />
        <div class="portfolio-overlay">
          <h3>${shoot.title}</h3>
          <p>${shoot.description}</p>
          <button class="view-shoot-btn" data-shoot="${shootId}">View Full Shoot</button>
        </div>
      </div>
    `;

    portfolioGrid.appendChild(portfolioItem);
  });

  // Re-attach event listeners to new buttons
  attachViewShootListeners();
}

// DOM elements
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('shootModal');
const modalTitle = document.getElementById('modalTitle');
const modalGallery = document.getElementById('modalGallery');
const closeBtn = document.querySelector('.close');

// Initialize the portfolio
document.addEventListener('DOMContentLoaded', function () {
  loadPhotoData().then(() => {
    initializePortfolio();
  });
});

function initializePortfolio() {
  // Set up filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const filter = this.getAttribute('data-filter');
      filterPortfolio(filter);

      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Set up modal close
  closeBtn.addEventListener('click', closeModal);
  window.addEventListener('click', function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Set up escape key to close modal
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

function attachViewShootListeners() {
  // Attach listeners to dynamically created buttons
  const viewShootBtns = document.querySelectorAll('.view-shoot-btn');
  viewShootBtns.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const shootId = this.getAttribute('data-shoot');
      openShootModal(shootId);
    });
  });
}

function filterPortfolio(filter) {
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  portfolioItems.forEach(item => {
    const category = item.getAttribute('data-category');

    if (filter === 'all' || category === filter) {
      item.style.display = 'block';
      // Add animation
      item.style.opacity = '0';
      setTimeout(() => {
        item.style.opacity = '1';
      }, 100);
    } else {
      item.style.display = 'none';
    }
  });
}

function openShootModal(shootId) {
  const shootData = portfolioData[shootId];
  if (!shootData) return;

  modalTitle.textContent = shootData.title;

  // Clear existing gallery
  modalGallery.innerHTML = '';

  // Add shoot description
  const description = document.createElement('div');
  description.className = 'shoot-description';
  description.innerHTML = `<p>${shootData.description}</p>`;
  modalGallery.appendChild(description);

  // Add images
  const imageGrid = document.createElement('div');
  imageGrid.className = 'shoot-image-grid';

  shootData.images.forEach((image, index) => {
    const imageItem = document.createElement('div');
    imageItem.className = 'shoot-image-item';
    imageItem.innerHTML = `
      <img src="${image.url}" alt="${image.caption}" loading="lazy" />
      <div class="image-caption">${image.caption}</div>
    `;

    // Add click to enlarge functionality
    imageItem.addEventListener('click', () => {
      enlargeImage(image.url, image.caption);
    });

    imageGrid.appendChild(imageItem);
  });

  modalGallery.appendChild(imageGrid);
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

function enlargeImage(imageUrl, caption) {
  // Create full-screen image overlay
  const overlay = document.createElement('div');
  overlay.className = 'image-overlay';
  overlay.innerHTML = `
    <div class="image-overlay-content">
      <img src="${imageUrl}" alt="${caption}" />
      <div class="image-overlay-caption">${caption}</div>
      <button class="image-overlay-close">&times;</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Close overlay on click
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target.classList.contains('image-overlay-close')) {
      document.body.removeChild(overlay);
      document.body.style.overflow = 'hidden'; // Keep modal scroll disabled
    }
  });

  // Close on escape key
  const closeOnEscape = function (e) {
    if (e.key === 'Escape') {
      document.body.removeChild(overlay);
      document.body.style.overflow = 'hidden'; // Keep modal scroll disabled
      document.removeEventListener('keydown', closeOnEscape);
    }
  };
  document.addEventListener('keydown', closeOnEscape);
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  });
});

// Add scroll-to-top functionality
window.addEventListener('scroll', function () {
  const scrollTop = document.createElement('button');
  scrollTop.className = 'scroll-to-top';
  scrollTop.innerHTML = '<i class="fas fa-chevron-up"></i>';

  if (window.pageYOffset > 300) {
    if (!document.querySelector('.scroll-to-top')) {
      document.body.appendChild(scrollTop);
      scrollTop.addEventListener('click', function () {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      });
    }
  } else {
    const existingBtn = document.querySelector('.scroll-to-top');
    if (existingBtn) {
      document.body.removeChild(existingBtn);
    }
  }
});

// Lazy loading enhancement
const observerOptions = {
  threshold: 0.1,
  rootMargin: '50px',
};

const imageObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    }
  });
}, observerOptions);

// Observe all images with data-src
document.querySelectorAll('img[data-src]').forEach(img => {
  imageObserver.observe(img);
});
