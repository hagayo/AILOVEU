document.addEventListener("DOMContentLoaded", function () {
    const ctaButtons = document.querySelectorAll(".cta-button");
    let remainingSeats = 200; // Initial number of seats

    // Countdown Timer for Early-Bird Price
    function updateCountdown() {
        const deadline = new Date("February 21, 2025 23:59:59").getTime();
        const now = new Date().getTime();
        const timeLeft = deadline - now;

        let days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        let hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        document.getElementById("countdown-timer").innerText = `${days} ימים, ${hours} שעות`;
    }
    updateCountdown();
    setInterval(updateCountdown, 60000); // Update every minute

    // Update the remaining seats dynamically
    function updateSeats() {
        remainingSeats = Math.max(remainingSeats - Math.floor(Math.random() * 3), 20);
        document.getElementById("seats-left").innerText = remainingSeats;
    }
    setInterval(updateSeats, 5000); // Update every 5 seconds

    // FAQ Dropdown
    function toggleFAQ(index) {
        const answers = document.querySelectorAll(".faq-answer");
        answers[index].style.display = (answers[index].style.display === "block") ? "none" : "block";
    }
    window.toggleFAQ = toggleFAQ;

    // CTA Button Effects
    ctaButtons.forEach(button => {
        button.addEventListener("mouseover", function () {
            button.style.backgroundColor = "#ffaa00";
        });

        button.addEventListener("mouseout", function () {
            button.style.backgroundColor = "#ffcc00";
        });

        button.addEventListener("click", function () {
            window.location.href = 'YOUR_PAYMENT_PAGE_URL';
        });
    });

    // Share on Facebook
    window.shareOnFacebook = function() {
        const shareUrl = encodeURIComponent(window.location.href);
        const fbShareLink = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        window.open(fbShareLink, '_blank');
    };

    // Share on LinkedIn
    window.shareOnLinkedIn = function() {
        const shareUrl = encodeURIComponent(window.location.href);
        const linkedInShareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        window.open(linkedInShareLink, '_blank');
    };
});
