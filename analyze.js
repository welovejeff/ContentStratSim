function navigateTo(page) {
    if (page === 'create') {
        window.location.href = 'index.html';
    } else if (page === 'analyze') {
        // Already on the analyze page, do nothing or refresh
        console.log('Already on Analyze page');
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
        totalImpressions: 0,
        totalConversions: 0,
        strategies: []
    };

    data.forEach(row => {
        const budget = parseInt(row['Budget'].replace(/[^0-9]/g, ''));
        const impressions = parseInt(row['Actual Impressions'] || 0);
        const conversions = parseInt(row['Actual Conversions'] || 0);

        results.totalBudget += budget;
        results.totalImpressions += impressions;
        results.totalConversions += conversions;

        results.strategies.push({
            name: row['Campaign Name'],
            budget: budget,
            channel: row['Channel'],
            audience: row['Audience'],
            impressions: impressions,
            conversions: conversions,
            cpi: impressions > 0 ? budget / impressions : 0,
            cpc: conversions > 0 ? budget / conversions : 0,
            conversionRate: impressions > 0 ? (conversions / impressions) * 100 : 0
        });
    });

    results.overallCPI = results.totalImpressions > 0 ? results.totalBudget / results.totalImpressions : 0;
    results.overallCPC = results.totalConversions > 0 ? results.totalBudget / results.totalConversions : 0;
    results.overallConversionRate = results.totalImpressions > 0 ? (results.totalConversions / results.totalImpressions) * 100 : 0;

    displayResults(results);
}

function displayResults(results) {
    const resultsContainer = document.createElement('div');
    resultsContainer.innerHTML = `
        <h2>Campaign Analysis Results</h2>
        <p>Total Budget: $${results.totalBudget.toLocaleString()}</p>
        <p>Total Impressions: ${results.totalImpressions.toLocaleString()}</p>
        <p>Total Conversions: ${results.totalConversions.toLocaleString()}</p>
        <p>Overall CPI: $${results.overallCPI.toFixed(2)}</p>
        <p>Overall CPC: $${results.overallCPC.toFixed(2)}</p>
        <p>Overall Conversion Rate: ${results.overallConversionRate.toFixed(2)}%</p>
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
                    <th>CPI</th>
                    <th>CPC</th>
                    <th>Conversion Rate</th>
                </tr>
            </thead>
            <tbody>
                ${results.strategies.map(strategy => `
                    <tr>
                        <td>${strategy.name}</td>
                        <td>$${strategy.budget.toLocaleString()}</td>
                        <td>${strategy.channel}</td>
                        <td>${strategy.audience}</td>
                        <td>${strategy.impressions.toLocaleString()}</td>
                        <td>${strategy.conversions.toLocaleString()}</td>
                        <td>$${strategy.cpi.toFixed(2)}</td>
                        <td>$${strategy.cpc.toFixed(2)}</td>
                        <td>${strategy.conversionRate.toFixed(2)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.querySelector('.main-content').appendChild(resultsContainer);
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
                label: 'Conversion Rate (%)',
                data: strategies.map(s => s.conversionRate),
                backgroundColor: '#36A2EB'
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
