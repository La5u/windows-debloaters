import repoUrls from './reposList.js'; // Import the repository URLs

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

async function fetchStars() {
    let starCounts = [];
    const now = Date.now();

    // Check if the cache exists and is still valid
    const cachedData = localStorage.getItem('starCounts');
    const cachedTimestamp = localStorage.getItem('cacheTimestamp');

    if (cachedData && cachedTimestamp && (now - cachedTimestamp < CACHE_DURATION)) {
        starCounts = JSON.parse(cachedData);
    } else {
        // If cache is empty or expired, fetch from GitHub API
        starCounts = await Promise.all(repoUrls.map(async (url) => {
            const response = await fetch(`https://api.github.com/repos/${url.split('/').slice(-2).join('/')}`);
            console.log("requested")
            const data = await response.json();
            const name = url.split('/').pop(); // Get the last part of the URL as the name
            const archived = data.archived ? " (Archived)" : ""; // Check if the repo is archived
            return { name, url, stars: data.stargazers_count, archived };
        }));

        // Sort the repositories by the number of stars in descending order
        starCounts.sort((a, b) => b.stars - a.stars);

        // Save the new data to localStorage
        localStorage.setItem('starCounts', JSON.stringify(starCounts));
        localStorage.setItem('cacheTimestamp', now);
    }

    const repoContainer = document.getElementById('repos');
    starCounts.forEach(repo => {
        const repoElement = document.createElement('div');
        // Format the star count to ensure consistent spacing
        const starsFormatted = repo.stars.toString().padStart(6, ' '); // Adjust the number 6 for desired width
        repoElement.innerHTML = `${starsFormatted} ★ - <a href="${repo.url}">${repo.name}</a> ${repo.archived}`;
        repoContainer.appendChild(repoElement);
    });
}

// Call the fetchStars function to display the repositories
fetchStars(); 