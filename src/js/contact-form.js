// Lead Form Handler
document.addEventListener('DOMContentLoaded', function () {
  const leadForm = document.getElementById('leadForm');

  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(leadForm);
      const data = {};

      for (let [key, value] of formData.entries()) {
        data[key] = value;
      }

      // For now, just create a mailto link with the form data
      const subject = encodeURIComponent(
        `New Project Inquiry - ${data['project-type'] || 'General'}`
      );
      const body = encodeURIComponent(`
New project inquiry from your website:

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}
Project Type: ${data['project-type'] || 'Not specified'}
Location: ${data.location || 'Not specified'}
Timeline: ${data.timeline || 'Not specified'}
Budget: ${data.budget || 'Not specified'}

Project Details:
${data.details || 'No additional details provided'}

---
This inquiry was submitted through the website contact form.
            `);

      // Open email client with pre-filled data
      window.location.href = `mailto:clint@waypointmediapro.com?subject=${subject}&body=${body}`;

      // Show success message
      showSuccessMessage();
    });
  }
});

function showSuccessMessage() {
  const submitBtn = document.querySelector('.submit-btn');
  const originalText = submitBtn.innerHTML;

  submitBtn.innerHTML = '<i class="fas fa-check"></i> Thank you! Opening your email client...';
  submitBtn.style.background = 'linear-gradient(135deg, #27ae60, #219a52)';

  setTimeout(() => {
    submitBtn.innerHTML = originalText;
    submitBtn.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
  }, 3000);
}
