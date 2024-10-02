// Constants
const BASE_IMPRESSION_RATE = 10;
const BASE_CONVERSION_RATE = 0.02;

// Helper functions
function getChannelMultiplier(channel) {
    const multipliers = {
        'podcasts': 0.8,
        'social': 1.2,
        'blogs': 0.5,
        'email': 0.3,
        'seo': 1.0,
        'ebooks': 0.4,
        'community': 0.7,
        'influencer': 1.5
    };
    return multipliers[channel.toLowerCase()] || 1;
}

function getChannelConversionRate(channel) {
    const rates = {
        'podcasts': 0.022,
        'social': 0.018,
        'blogs': 0.020,
        'email': 0.026,
        'seo': 0.024,
        'ebooks': 0.021,
        'community': 0.023,
        'influencer': 0.025
    };
    return rates[channel.toLowerCase()] || 0.02;
}

function getAudienceMultiplier(audience) {
    const multipliers = {
        'small_business': 1.0,
        'designers': 0.8,
        'marketers': 1.2,
        'students': 1.5,
        'educators': 0.7,
        'govt_nonprofit': 0.6,
        'enterprise': 0.9,
        'job_seekers': 1.1
    };
    return multipliers[audience.toLowerCase()] || 1;
}

function getAudienceConversionRate(audience) {
    const rates = {
        'small_business': 0.024,
        'designers': 0.022,
        'marketers': 0.026,
        'students': 0.016,
        'educators': 0.020,
        'govt_nonprofit': 0.022,
        'enterprise': 0.028,
        'job_seekers': 0.018
    };
    return rates[audience.toLowerCase()] || 0.02;
}

function parseBudget(budgetString) {
    return parseInt(budgetString.replace(/[^0-9]/g, ''));
}

function navigateTo(page) {
    if (page === 'create') {
        window.location.href = 'index.html';
    } else if (page === 'analyze') {
        // Already on the analyze page, do nothing or refresh
        console.log('Already on Analyze page');
    } else if (page === 'learn') {
        window.location.href = 'learn.html';
    } else {
        console.log('Unknown page:', page);
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const contents = e.target.result;
            Papa.parse(contents, {
                header: true,
                complete: function(results) {
                    analyzeResults(results.data);
                }
            });
        };
        reader.readAsText(file);
    }
}

function analyzeResults(data) {
    const results = {
        totalBudget: 0,
        totalActualImpressions: 0,
        totalActualConversions: 0,
        totalEstimatedImpressions: 0,
        totalEstimatedConversions: 0,
        strategies: []
    };

    data.forEach(row => {
        const budget = parseBudget(row['Budget']);
        const actualImpressions = parseInt(row['Actual Impressions'] || 0);
        const actualConversions = parseInt(row['Actual Conversions'] || 0);
        const channel = row['Channel'];
        const audience = row['Audience'];

        const channelMultiplier = getChannelMultiplier(channel);
        const audienceMultiplier = getAudienceMultiplier(audience);
        const channelConversionRate = getChannelConversionRate(channel);
        const audienceConversionRate = getAudienceConversionRate(audience);

        const estimatedImpressions = Math.round(budget * BASE_IMPRESSION_RATE * channelMultiplier * audienceMultiplier);
        const estimatedConversionRate = (channelConversionRate + audienceConversionRate) / 2;
        const estimatedConversions = Math.round(estimatedImpressions * estimatedConversionRate);

        results.totalBudget += budget;
        results.totalActualImpressions += actualImpressions;
        results.totalActualConversions += actualConversions;
        results.totalEstimatedImpressions += estimatedImpressions;
        results.totalEstimatedConversions += estimatedConversions;

        results.strategies.push({
            name: row['Campaign Name'],
            budget,
            channel,
            audience,
            actualImpressions,
            actualConversions,
            estimatedImpressions,
            estimatedConversions,
            channelMultiplier,
            audienceMultiplier,
            estimatedConversionRate
        });
    });

    calculateOverallMetrics(results);
    console.log("Final results:", results);
    displayResults(results);
}

function calculateOverallMetrics(results) {
    results.overallActualCPM = results.totalActualImpressions > 0 ? (results.totalBudget / results.totalActualImpressions) * 1000 : 0;
    results.overallActualCPC = results.totalActualConversions > 0 ? results.totalBudget / results.totalActualConversions : 0;
    results.overallActualConversionRate = results.totalActualImpressions > 0 ? (results.totalActualConversions / results.totalActualImpressions) * 100 : 0;

    results.overallEstimatedCPM = results.totalEstimatedImpressions > 0 ? (results.totalBudget / results.totalEstimatedImpressions) * 1000 : 0;
    results.overallEstimatedCPC = results.totalEstimatedConversions > 0 ? results.totalBudget / results.totalEstimatedConversions : 0;
    results.overallEstimatedConversionRate = results.totalEstimatedImpressions > 0 ? (results.totalEstimatedConversions / results.totalEstimatedImpressions) * 100 : 0;
}

function displayResults(results) {
    const compareValue = (actual, estimated, isCurrency = false, isPercentage = false) => {
        const diff = actual - estimated;
        const percentDiff = estimated !== 0 ? (diff / estimated) * 100 : 0;
        const color = diff >= 0 ? 'green' : 'red';
        const symbol = diff >= 0 ? '▲' : '▼';
        let formattedEstimate = estimated;
        if (isCurrency) {
            formattedEstimate = '$' + estimated.toFixed(2);
        } else if (isPercentage) {
            formattedEstimate = estimated.toFixed(2) + '%';
        } else {
            formattedEstimate = estimated.toLocaleString();
        }
        return `<span style="color: #999; font-size: 0.8em;">${formattedEstimate}</span> <span style="color: ${color}; font-size: 0.8em;">${symbol} ${Math.abs(percentDiff).toFixed(2)}%</span>`;
    };

    const calculateCPM = (budget, impressions) => impressions > 0 ? (budget / impressions) * 1000 : 0;
    const calculateCPC = (budget, conversions) => conversions > 0 ? budget / conversions : 0;

    const resultsContainer = document.getElementById('analysisResults');
    resultsContainer.innerHTML = `
        <h2>Campaign Analysis Results</h2>
        <p>Total Budget: $${results.totalBudget.toLocaleString()}</p>
        <p>Total Impressions: ${results.totalActualImpressions.toLocaleString()} ${compareValue(results.totalActualImpressions, results.totalEstimatedImpressions)}</p>
        <p>Total Conversions: ${results.totalActualConversions.toLocaleString()} ${compareValue(results.totalActualConversions, results.totalEstimatedConversions)}</p>
        <p>Overall CPM: $${results.overallActualCPM.toFixed(2)} ${compareValue(results.overallActualCPM, results.overallEstimatedCPM, true)}</p>
        <p>Overall CPC: $${results.overallActualCPC.toFixed(2)} ${compareValue(results.overallActualCPC, results.overallEstimatedCPC, true)}</p>
        <p>Overall Conversion Rate: ${results.overallActualConversionRate.toFixed(2)}% ${compareValue(results.overallActualConversionRate, results.overallEstimatedConversionRate, false, true)}</p>
        <h3>Strategy Performance</h3>
        <table id="strategyTable">
            <thead>
                <tr>
                    <th>Campaign Name</th>
                    <th>Budget</th>
                    <th>Channel</th>
                    <th>Audience</th>
                    <th>Impressions</th>
                    <th>Conversions</th>
                    <th>CPM</th>
                    <th>CPC</th>
                </tr>
            </thead>
            <tbody>
                ${results.strategies.map(strategy => {
                    const actualCPM = calculateCPM(strategy.budget, strategy.actualImpressions);
                    const estimatedCPM = calculateCPM(strategy.budget, strategy.estimatedImpressions);
                    const actualCPC = calculateCPC(strategy.budget, strategy.actualConversions);
                    const estimatedCPC = calculateCPC(strategy.budget, strategy.estimatedConversions);
                    return `
                    <tr>
                        <td>${strategy.name}</td>
                        <td>$${strategy.budget.toLocaleString()}</td>
                        <td>${strategy.channel}</td>
                        <td>${strategy.audience}</td>
                        <td>${strategy.actualImpressions.toLocaleString()} ${compareValue(strategy.actualImpressions, strategy.estimatedImpressions)}</td>
                        <td>${strategy.actualConversions.toLocaleString()} ${compareValue(strategy.actualConversions, strategy.estimatedConversions)}</td>
                        <td>$${actualCPM.toFixed(2)} ${compareValue(actualCPM, estimatedCPM, true)}</td>
                        <td>$${actualCPC.toFixed(2)} ${compareValue(actualCPC, estimatedCPC, true)}</td>
                    </tr>
                `}).join('')}
            </tbody>
        </table>
    `;

    createPerformanceCharts(results);
}

function createPerformanceCharts(results) {
    const chartContainer = document.createElement('div');
    chartContainer.innerHTML = `
        <div class="chart-container">
            <canvas id="budgetAllocationChart"></canvas>
        </div>
        <div class="chart-container">
            <canvas id="conversionRateChart"></canvas>
        </div>
    `;
    document.querySelector('.main-content').appendChild(chartContainer);

    createBudgetAllocationChart(results.strategies);
    createConversionRateChart(results.strategies);
}

function createBudgetAllocationChart(strategies) {
    const ctx = document.getElementById('budgetAllocationChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: strategies.map(s => s.name),
            datasets: [{
                data: strategies.map(s => s.budget),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#4BC0C0'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: 'Budget Allocation by Strategy'
            }
        }
    });
}

function createConversionRateChart(strategies) {
    const ctx = document.getElementById('conversionRateChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: strategies.map(s => s.name),
            datasets: [{
                label: 'Actual Conversion Rate (%)',
                data: strategies.map(s => (s.actualConversions / s.actualImpressions) * 100),
                backgroundColor: '#36A2EB'
            }, {
                label: 'Estimated Conversion Rate (%)',
                data: strategies.map(s => s.estimatedConversionRate * 100),
                backgroundColor: '#FF6384'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: 'Conversion Rate by Strategy'
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }]
            }
        }
    });
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.className = document.body.classList.contains('light-theme') ? 'fas fa-sun' : 'fas fa-moon';
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Add theme toggle event listener
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', toggleTheme);

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.className = 'fas fa-sun';
    }

    // Add event listener for theme changes
    document.body.addEventListener('classChange', function() {
        const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        localStorage.setItem('theme', theme);
    });
});

function displayAnalysisResults(data) {
    const resultsDiv = document.getElementById('analysisResults');
    resultsDiv.innerHTML = '';

    data.forEach(campaign => {
        const campaignDiv = document.createElement('div');
        campaignDiv.className = 'campaign-result';
        campaignDiv.innerHTML = `
            <h2>${campaign.name}</h2>
            <p>Actual Impressions: ${campaign.actualImpressions.toLocaleString()} 
               (Estimated: ${campaign.estimatedImpressions.toLocaleString()}, 
               ${calculatePercentageDiff(campaign.estimatedImpressions, campaign.actualImpressions)}% difference)</p>
            <p>Actual Conversions: ${campaign.actualConversions.toLocaleString()} 
               (Estimated: ${campaign.estimatedConversions.toLocaleString()}, 
               ${calculatePercentageDiff(campaign.estimatedConversions, campaign.actualConversions)}% difference)</p>
            <p>Cost per Conversion: $${(campaign.cost / campaign.actualConversions).toFixed(2)}</p>
            <canvas id="chart-${campaign.name}"></canvas>
        `;
        resultsDiv.appendChild(campaignDiv);

        // ... (rest of the function remains unchanged)
    });
}

// Add this helper function if it doesn't exist
function calculatePercentageDiff(estimated, actual) {
    return (((actual - estimated) / estimated) * 100).toFixed(2);
}
