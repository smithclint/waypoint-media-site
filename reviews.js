// Reviews loader - dynamically loads and displays reviews from JSON files
// Will hide the reviews section if no reviews are found

class ReviewsLoader {
  constructor(jsonPath, sectionId = 'reviews-section', gridId = 'reviews-grid') {
    this.jsonPath = jsonPath;
    this.sectionId = sectionId;
    this.gridId = gridId;
    this.reviews = [];
  }

  async loadReviews() {
    try {
      const response = await fetch(this.jsonPath);
      if (!response.ok) {
        console.log(`No reviews file found at ${this.jsonPath}`);
        this.hideSection();
        return;
      }

      const data = await response.json();
      this.reviews = data.reviews || [];

      if (this.reviews.length === 0) {
        console.log('No reviews found in JSON file');
        this.hideSection();
        return;
      }

      this.renderReviews();
      this.showSection();
    } catch (error) {
      console.error('Error loading reviews:', error);
      this.hideSection();
    }
  }

  renderReviews() {
    const grid = document.getElementById(this.gridId);
    if (!grid) {
      console.error(`Reviews grid element not found: ${this.gridId}`);
      return;
    }

    grid.innerHTML = this.reviews.map(review => this.createReviewCard(review)).join('');
  }

  createReviewCard(review) {
    const stars = this.generateStars(review.rating);
    return `
      <div class="review-card" data-review-id="${review.id}">
        <div class="review-content">
          <div class="stars">
            ${stars}
          </div>
          <p>"${review.text}"</p>
          <div class="review-author">
            <strong>${review.author}</strong>
            <span>${review.company}</span>
            ${review.verified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars += '<i class="fas fa-star"></i>';
      } else {
        stars += '<i class="far fa-star"></i>';
      }
    }
    return stars;
  }

  showSection() {
    const section = document.getElementById(this.sectionId);
    if (section) {
      section.style.display = 'block';
    }
  }

  hideSection() {
    const section = document.getElementById(this.sectionId);
    if (section) {
      section.style.display = 'none';
    }
  }
}

// Auto-initialize based on page
document.addEventListener('DOMContentLoaded', function () {
  const path = window.location.pathname;
  let reviewsLoader;

  if (path.includes('real-estate.html') || path.includes('real-estate')) {
    reviewsLoader = new ReviewsLoader('reviews/real-estate.json');
  } else if (path.includes('commercial.html') || path.includes('commercial')) {
    reviewsLoader = new ReviewsLoader('reviews/commercial.json');
  }

  if (reviewsLoader) {
    reviewsLoader.loadReviews();
  }
});
