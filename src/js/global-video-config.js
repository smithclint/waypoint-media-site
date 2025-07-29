// Global Video URLs Configuration
// Add this to a new file: global-video-config.js

window.globalVideoConfig = {
  // Index page videos (Featured Work + Recent Work sections)
  indexVideos: [
    // Featured Work section
    'https://github.com/smithclint/resume/releases/download/videos/bluffton.mp4',
    'https://github.com/smithclint/resume/releases/download/videos/heart-field.mp4',
    'https://github.com/smithclint/resume/releases/download/videos/hideaway.mp4',
    'https://github.com/smithclint/resume/releases/download/videos/kentucky-cinematic-views.mp4',
    // Recent Work section
    'https://github.com/smithclint/waypoint-media-site/releases/download/commercial-boxdrop-furniture-store/Selects.30.fps.Trimmed_HD_H264.mp4',
    'https://github.com/smithclint/waypoint-media-site/releases/download/commercial-boxdrop-furniture-store/Selects.30.fps_HD_H264.mp4',
  ],

  // Gallery page videos (same as index, could skip duplicates)
  galleryVideos: [
    'https://github.com/smithclint/resume/releases/download/videos/bluffton.mp4',
    'https://github.com/smithclint/resume/releases/download/videos/heart-field.mp4',
    'https://github.com/smithclint/resume/releases/download/videos/hideaway.mp4',
    'https://github.com/smithclint/resume/releases/download/videos/kentucky-cinematic-views.mp4',
  ],

  // Commercial page videos
  commercialVideos: [
    'https://github.com/smithclint/waypoint-media-site/releases/download/commercial-boxdrop-furniture-store/Selects.30.fps.Trimmed_HD_H264.mp4',
    'https://github.com/smithclint/waypoint-media-site/releases/download/commercial-boxdrop-furniture-store/Selects.30.fps_HD_H264.mp4',
    'https://github.com/smithclint/waypoint-media-site/releases/download/commercial-hideaway-campground/hideaway-commercial.mp4',
    'https://github.com/smithclint/waypoint-media-site/releases/download/commercial-hideaway-campground/hideaway-social.mp4',
  ],

  // Drone page videos (add yours here)
  droneVideos: [
    // Add drone video URLs when you have them
  ],
};

// Function to get all unique video URLs
window.getAllVideoUrls = function () {
  const config = window.globalVideoConfig;
  const allUrls = [
    ...config.indexVideos,
    ...config.galleryVideos,
    ...config.commercialVideos,
    ...config.droneVideos,
  ];

  // Remove duplicates
  return [...new Set(allUrls)];
};
