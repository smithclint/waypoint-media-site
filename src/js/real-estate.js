// Real Estate Portfolio JavaScript

// Load photo data from photos.json (S3/CloudFront only)
let portfolioData = {};

// Function to sort images by priority based on filename keywords
function sortImagesByPriority(images) {
  const roomPriority = {
    exterior: 1,
    living: 2,
    kitchen: 3,
    dining: 4,
    family: 5,
    great: 6,
    den: 7,
    office: 8,
    study: 9,
    library: 10,
    master: 11,
    bedroom: 12,
    bathroom: 13,
    garage: 14,
    closet: 15,
    laundry: 16,
    utility: 17,
    pantry: 18,
    storage: 19,
    attic: 20,
    basement: 21,
  };

  return images.sort((a, b) => {
    const aFilename = a.url.split('/').pop().toLowerCase();
    const bFilename = b.url.split('/').pop().toLowerCase();

    let aPriority = 999;
    let bPriority = 999;

    // Check each room type in the filename
    for (let room in roomPriority) {
      if (aFilename.includes(room)) {
        aPriority = Math.min(aPriority, roomPriority[room]);
      }
      if (bFilename.includes(room)) {
        bPriority = Math.min(bPriority, roomPriority[room]);
      }
    }

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // If same priority, sort by filename
    return aFilename.localeCompare(bFilename);
  });
} // Fetch photo data on page load
async function loadPhotoData() {
  try {
    const response = await fetch('../config/photos.json');
    if (response.ok) {
      const shootMetadata = await response.json();
      portfolioData = await buildPortfolioData(shootMetadata);
      updatePortfolioGrid();
    } else {
      console.warn('Could not load config/photos.json, using fallback data');
      portfolioData = getFallbackData();
      updatePortfolioGrid();
    }
  } catch (error) {
    console.warn('Error loading config/photos.json:', error);
    portfolioData = getFallbackData();
    updatePortfolioGrid();
  }
}

// Build portfolio data from photos.json (S3/CloudFront only)
async function buildPortfolioData(shootMetadata) {
  const enrichedData = {};
  const CDN_BASE = 'https://d1fp8ti9bzsng5.cloudfront.net';

  for (const [shootId, metadata] of Object.entries(shootMetadata)) {
    enrichedData[shootId] = { ...metadata };
    const folder = shootId;
    if (Array.isArray(metadata.images)) {
      const images = metadata.images
        .filter(name => name.match(/\.(jpg|jpeg|png|webp)$/i))
        .map(name => ({
          url: `${CDN_BASE}/${folder}/${name}`,
        }));
      enrichedData[shootId].images = sortImagesByPriority(images);
      // Optionally: console.log(`✅ Loaded ${images.length} photos for ${shootId} from CloudFront folder '${folder}'`);
    } else {
      enrichedData[shootId].images = [];
    }
  }
  return enrichedData;
}

// Create fallback images for local testing when GitHub releases are not accessible
function createLocalFallbackImages(shootId) {
  const colors = ['2c3e50', '34495e', '3498db', '2980b9', 'e74c3c', 'c0392b'];
  const roomTypes = ['exterior', 'living', 'kitchen', 'bedroom', 'bathroom'];

  return roomTypes.map((room, index) => ({
    url: `https://via.placeholder.com/800x600/${colors[index % colors.length]}/ffffff?text=${shootId}+${room}+${index + 1}`,
  }));
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
    // Skip if no images available (either from release loading failure or empty static data)
    if (!shoot.images || shoot.images.length === 0) {
      console.warn(`Skipping ${shootId}: no images available`);
      return;
    }

    // Use the featured photo or first image as the preview
    let previewImage;
    if (shoot.featured_photo_index && typeof shoot.featured_photo_index === 'string') {
      // Find image by filename
      previewImage = shoot.images.find(img => img.url.includes(shoot.featured_photo_index));
    } else if (typeof shoot.featured_photo_index === 'number') {
      // Use numeric index (fallback for old format)
      previewImage = shoot.images[shoot.featured_photo_index];
    }
    // Default to first image if featured photo not found
    previewImage = previewImage || shoot.images[0];

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

    const hasCaption = image.caption && image.caption.trim() !== '';

    imageItem.innerHTML = `
      <img src="${image.url}" alt="" loading="lazy" />
      ${hasCaption ? `<div class="image-caption">${image.caption}</div>` : ''}
    `;

    // Add click to enlarge functionality
    imageItem.addEventListener('click', () => {
      enlargeImage(image.url, image.caption || '', shootData.images, index);
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

function enlargeImage(imageUrl, caption, allImages, currentIndex) {
  // Create full-screen image overlay
  const overlay = document.createElement('div');
  overlay.className = 'image-overlay';

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allImages.length - 1;

  overlay.innerHTML = `
    <div class="image-overlay-content">
      <img src="${imageUrl}" alt="" />
      <button class="image-overlay-close">&times;</button>
      <button class="image-overlay-nav image-overlay-prev">‹</button>
      <button class="image-overlay-nav image-overlay-next">›</button>
      <div class="image-overlay-caption"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Get references to elements we'll update
  const overlayImg = overlay.querySelector('img');
  const prevBtn = overlay.querySelector('.image-overlay-prev');
  const nextBtn = overlay.querySelector('.image-overlay-next');
  const captionDiv = overlay.querySelector('.image-overlay-caption');

  // Function to update the current image and navigation state
  const updateImage = newIndex => {
    currentIndex = newIndex;
    const currentImage = allImages[currentIndex];
    overlayImg.src = currentImage.url;

    // Update caption
    const hasCaption = currentImage.caption && currentImage.caption.trim() !== '';
    if (hasCaption) {
      captionDiv.textContent = currentImage.caption;
      captionDiv.style.display = 'block';
    } else {
      captionDiv.style.display = 'none';
    }

    // Update navigation button visibility
    if (prevBtn) {
      prevBtn.style.display = currentIndex > 0 ? 'block' : 'none';
    }
    if (nextBtn) {
      nextBtn.style.display = currentIndex < allImages.length - 1 ? 'block' : 'none';
    }
  };

  // Navigation functions
  const showPrevious = () => {
    if (currentIndex > 0) {
      updateImage(currentIndex - 1);
    }
  };

  const showNext = () => {
    if (currentIndex < allImages.length - 1) {
      updateImage(currentIndex + 1);
    }
  };

  // Add navigation event listeners
  if (prevBtn) prevBtn.addEventListener('click', showPrevious);
  if (nextBtn) nextBtn.addEventListener('click', showNext);

  // Set initial navigation button visibility
  updateImage(currentIndex);

  // Close overlay on click
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target.classList.contains('image-overlay-close')) {
      document.body.removeChild(overlay);
      document.body.style.overflow = 'hidden'; // Keep modal scroll disabled
    }
  });

  // Close on escape key and arrow key navigation
  const handleKeydown = function (e) {
    if (e.key === 'Escape') {
      document.body.removeChild(overlay);
      document.body.style.overflow = 'hidden'; // Keep modal scroll disabled
      document.removeEventListener('keydown', handleKeydown);
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      showPrevious();
    } else if (e.key === 'ArrowRight' && currentIndex < allImages.length - 1) {
      showNext();
    }
  };
  document.addEventListener('keydown', handleKeydown);
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
