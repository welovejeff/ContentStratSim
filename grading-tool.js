const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', toggleTheme);

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLightTheme = document.body.classList.contains('light-theme');
    themeToggle.classList.toggle('fa-sun', isLightTheme);
    themeToggle.classList.toggle('fa-moon', !isLightTheme);
    
    // Save the theme preference
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.classList.replace('fa-moon', 'fa-sun');
    }
}

document.addEventListener('DOMContentLoaded', loadSavedTheme);

let strategies = [];
let originalFileName = '';

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        originalFileName = file.name;
        document.getElementById('fileName').textContent = originalFileName;
        const reader = new FileReader();
        reader.onload = function(e) {
            const contents = e.target.result;
            Papa.parse(contents, {
                header: true,
                complete: function(results) {
                    strategies = results.data;
                    displayStrategies();
                }
            });
        };
        reader.readAsText(file);
    }
}

function displayStrategies() {
    const container = document.getElementById('strategyContainer');
    container.innerHTML = '';

    strategies.forEach((strategy, index) => {
        const card = document.createElement('div');
        card.className = 'strategy-card';
        const estimatedImpressions = calculateEstimatedImpressions(strategy);
        const estimatedConversions = calculateEstimatedConversions(strategy);
        card.innerHTML = `
            <h2 class="collapsible" onclick="toggleCollapsible(this)">Strategy ${index + 1}: ${strategy['Campaign Name']} <i class="fas fa-chevron-down"></i></h2>
            <div class="content">
                <p><strong>Budget:</strong> ${strategy['Budget']}</p>
                <p><strong>Channel:</strong> ${strategy['Channel']}</p>
                <p><strong>Audience:</strong> ${strategy['Audience']}</p>
                <p><strong>Additional Information:</strong> ${strategy['Additional Information']}</p>
                <p><strong>Estimated Impressions:</strong> ${estimatedImpressions.toLocaleString()}</p>
                <p><strong>Estimated Conversions:</strong> ${estimatedConversions.toLocaleString()}</p>
                <div class="adjustment-controls">
                    <div>
                        <label>Actual Impressions:</label>
                        <input type="number" value="${strategy['Actual Impressions'] || estimatedImpressions}" onchange="updateActualValue(${index}, 'Actual Impressions', this.value)">
                        <input type="range" min="-50" max="50" value="0" oninput="updatePercentage(${index}, 'Actual Impressions', this.value)">
                        <span class="percentage">0%</span>
                    </div>
                    <div>
                        <label>Actual Conversions:</label>
                        <input type="number" value="${strategy['Actual Conversions'] || estimatedConversions}" onchange="updateActualValue(${index}, 'Actual Conversions', this.value)">
                        <input type="range" min="-50" max="50" value="0" oninput="updatePercentage(${index}, 'Actual Conversions', this.value)">
                        <span class="percentage">0%</span>
                    </div>
                </div>
                <div class="comments-section">
                    <label for="comments${index}">Comments:</label>
                    <textarea id="comments${index}" placeholder="Enter comments for this strategy" onchange="updateComments(${index}, this.value)">${strategy['Comments'] || ''}</textarea>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    document.getElementById('saveButton').style.display = 'block';
    updateTotals();
}

function updateComments(index, value) {
    strategies[index]['Comments'] = value;
}

function calculateEstimatedImpressions(strategy) {
    const budget = parseInt(strategy['Budget'].replace(/[^0-9]/g, ''));
    const channelMultiplier = getChannelMultiplier(strategy['Channel']);
    const audienceMultiplier = getAudienceMultiplier(strategy['Audience']);
    return Math.round(budget * 10 * channelMultiplier * audienceMultiplier);
}

function calculateEstimatedConversions(strategy) {
    const estimatedImpressions = calculateEstimatedImpressions(strategy);
    const channelConversionRate = getChannelConversionRate(strategy['Channel']);
    const audienceConversionRate = getAudienceConversionRate(strategy['Audience']);
    const estimatedConversionRate = (channelConversionRate + audienceConversionRate) / 2;
    return Math.round(estimatedImpressions * estimatedConversionRate);
}

function updateActualValue(index, field, value) {
    strategies[index][field] = value;
    updateTotals();
}

function updatePercentage(index, field, percentage) {
    const estimatedValue = field === 'Actual Impressions' ? calculateEstimatedImpressions(strategies[index]) : calculateEstimatedConversions(strategies[index]);
    const newValue = Math.round(estimatedValue * (1 + percentage / 100));
    strategies[index][field] = newValue;
    const card = document.querySelectorAll('.strategy-card')[index];
    const input = card.querySelector(`input[type="number"][onchange*="${field}"]`);
    input.value = newValue;
    const percentageSpan = card.querySelector(`input[type="range"][oninput*="${field}"]`).nextElementSibling;
    percentageSpan.textContent = `${percentage}%`;
    updateTotals();
}

function updateTotals() {
    let totalBudget = 0;
    let estimatedImpressions = 0;
    let actualImpressions = 0;
    let estimatedConversions = 0;
    let actualConversions = 0;

    strategies.forEach(strategy => {
        totalBudget += parseInt(strategy['Budget'].replace(/[^0-9]/g, ''));
        estimatedImpressions += calculateEstimatedImpressions(strategy);
        actualImpressions += parseInt(strategy['Actual Impressions'] || calculateEstimatedImpressions(strategy));
        estimatedConversions += calculateEstimatedConversions(strategy);
        actualConversions += parseInt(strategy['Actual Conversions'] || calculateEstimatedConversions(strategy));
    });

    document.getElementById('totalBudget').textContent = totalBudget.toLocaleString();
    document.getElementById('estimatedImpressions').textContent = estimatedImpressions.toLocaleString();
    document.getElementById('actualImpressions').textContent = actualImpressions.toLocaleString();
    document.getElementById('estimatedConversions').textContent = estimatedConversions.toLocaleString();
    document.getElementById('actualConversions').textContent = actualConversions.toLocaleString();

    updatePercentageChange('impressions', estimatedImpressions, actualImpressions);
    updatePercentageChange('conversions', estimatedConversions, actualConversions);
}

function updatePercentageChange(metric, estimated, actual) {
    const percentageChange = ((actual - estimated) / estimated) * 100;
    const changeElement = document.getElementById(`${metric}Change`);
    changeElement.textContent = `${percentageChange.toFixed(2)}%`;
    changeElement.classList.remove('positive', 'negative');
    changeElement.classList.add(percentageChange >= 0 ? 'positive' : 'negative');
}

function saveResults() {
    const csvContent = Papa.unparse(strategies);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${originalFileName.replace('.csv', '')}_Results.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function toggleCollapsible(element) {
    element.classList.toggle("active");
    const content = element.nextElementSibling;
    if (content.style.display === "block") {
        content.style.display = "none";
        element.querySelector('i').classList.replace('fa-chevron-up', 'fa-chevron-down');
    } else {
        content.style.display = "block";
        element.querySelector('i').classList.replace('fa-chevron-down', 'fa-chevron-up');
    }
}

// Helper functions (copy these from your existing code)
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