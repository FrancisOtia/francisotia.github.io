document.addEventListener('DOMContentLoaded', () => {
    console.log('Document is ready!');

    // Placeholder for future functionalities
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("year").textContent = new Date().getFullYear();
});
    // For example, you can add event listeners or dynamic content here.
});

// Optional: Smooth scroll for anchor links
const links = document.querySelectorAll('a[href^="#"]');

for (const link of links) {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        target.scrollIntoView({ behavior: 'smooth' });
    });
}
