import { repoUrls } from './reposList.js'; // Change to named import

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Function to format date as YYYY-MM-DD
function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    const parts = date.toLocaleDateString('en-CA', options).split('/');
    return parts[0]; // Format as YYYY-MM-DD
}

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
            try {
                const response = await fetch(`https://api.github.com/repos/${url.split('/').slice(-2).join('/')}`);
                console.log("requested");
                const data = await response.json();

                const name = url.split('/').pop(); // Get the last part of the URL as the name
                const archived = data.archived ? " (Archived)" : ""; // Check if the repo is archived

                // Fetch the last commit date
                const commitsResponse = await fetch(`https://api.github.com/repos/${url.split('/').slice(-2).join('/')}/commits`);
                const commitsData = await commitsResponse.json();
                const lastCommitDate = commitsData.length > 0 ? formatDate(commitsData[0].commit.author.date) : "N/A"; // Get the last commit date

                return { name, url, stars: data.stargazers_count, archived, lastCommitDate }; // Include last commit date
            } catch (error) {
                console.error(`Error fetching data for ${url}:`, error);
                return { name: url.split('/').pop(), url, stars: 0, archived: " (Error fetching)", lastCommitDate: "N/A" }; // Fallback data
            }
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
        const starsFormatted = repo.stars.toString().padStart(5, ' '); // Access the stars property
        const commitDate = formatDate(repo.lastCommitDate) // Use the last commit date directly
        repoElement.innerHTML = `${starsFormatted}★ - ${commitDate} - <a href="${repo.url}">${repo.name}</a> ${repo.archived}`; // Display last commit date
        repoContainer.appendChild(repoElement);
    });
}

// Call the fetchStars function to display the repositories
fetchStars(); 