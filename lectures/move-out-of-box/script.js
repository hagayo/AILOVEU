document.addEventListener("DOMContentLoaded", function () {
    let remainingSeats = 150; // Initial number of seats

    // Countdown Timer for Early-Bird Price
    function updateCountdown() {
        const deadline = new Date("March 13, 2025 19:59:59").getTime();
        const now = new Date().getTime();
        const timeLeft = deadline - now;
        const millisecPerDay = 1000 * 60 * 60 * 24;
        
        let days = Math.floor(timeLeft / millisecPerDay);
        let hours = Math.floor((timeLeft % millisecPerDay) / 3600000);
        document.getElementById("countdown-timer").innerText = `${days} ימים, ${hours} שעות`;
    }
    // Update every minute
    updateCountdown();
    setInterval(updateCountdown, 60000);
});
