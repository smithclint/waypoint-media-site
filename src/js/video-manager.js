// Minimal Video Manager: Pause all other videos when one is played
// Ensures only one video plays at a time on the page
document.querySelectorAll('video').forEach(function (vid) {
  vid.addEventListener('play', function () {
    document.querySelectorAll('video').forEach(function (other) {
      if (other !== vid) other.pause();
    });
  });
});
