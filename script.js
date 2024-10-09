let strategyCount = 0;
const charts = {
    audienceChart: null,
    channelChart: null
};

function saveStrategiesToLocalStorage() {
    const strategies = [];
    document.querySelectorAll('.strategy-section').forEach((strategy, index) => {
        const strategyData = {
            campaignName: strategy.querySelector(`input[name^="campaignName"]`).value,
            budget: strategy.querySelector(`input[name^="budget"]`).value,
            channel: strategy.querySelector(`select[name^="channel"]`).value,
            audience: strategy.querySelector(`select[name^="audience"]`).value,
            additionalInfo: strategy.querySelector(`textarea[name^="strategy"]`).value
        };
        strategies.push(strategyData);
    });

    const totalBudget = document.getElementById('quarterlyBudget').value;
    
    localStorage.setItem('contentStrategies', JSON.stringify({
        strategies: strategies,
        totalBudget: totalBudget,
        strategyCount: strategyCount
    }));
}

function loadStrategiesFromLocalStorage() {
    const savedData = localStorage.getItem('contentStrategies');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Set total budget
        document.getElementById('quarterlyBudget').value = parsedData.totalBudget;
        
        // Clear existing strategies
        document.getElementById('strategyContainer').innerHTML = '';
        strategyCount = 0; // Reset strategy count

        // Recreate strategies
        parsedData.strategies.forEach((strategyData, index) => {
            addStrategy(false); // Pass false to prevent saving during loading
            const strategySection = document.querySelectorAll('.strategy-section')[index];
            
            if (strategySection) {
                strategySection.querySelector('input[name^="campaignName"]').value = strategyData.campaignName || '';
                strategySection.querySelector('input[name^="budget"]').value = strategyData.budget || '0';
                strategySection.querySelector('select[name^="channel"]').value = strategyData.channel || '';
                strategySection.querySelector('select[name^="audience"]').value = strategyData.audience || '';
                strategySection.querySelector('textarea[name^="strategy"]').value = strategyData.additionalInfo || '';
                updateStrategyEstimates(strategySection);
            }
        });

        updateTotalBudget();
        updateCharts();
        updateStrategyList();
    }
}

function addStrategy(shouldSave = true) {
    strategyCount++;
    const container = document.getElementById('strategyContainer');
    const section = document.createElement('div');
    section.className = 'strategy-section';
    section.innerHTML = `
        <div class="strategy-header">
            <h2>Content Strategy #${strategyCount}</h2>
            <button type="button" class="minimize-strategy fas fa-minus" onclick="toggleStrategy(this)"></button>
        </div>
        <div class="strategy-estimates">
            <p class="estimated-impressions">Estimated Impressions: 0</p>
            <p class="estimated-conversions">Estimated Conversions: 0</p>
        </div>
        <div class="strategy-content">
            <button type="button" class="remove-strategy" onclick="removeStrategy(this)">Remove</button>
            <label for="campaignName${strategyCount}">Campaign Name:</label>
            <input type="text" id="campaignName${strategyCount}" name="campaignName${strategyCount}" required oninput="updateStrategyList()">
            
            <label for="budget${strategyCount}">Budget:</label>
            <input type="number" id="budget${strategyCount}" name="budget${strategyCount}" min="0" value="0" oninput="updateBudgetValue(this)">
            
            <label for="channel${strategyCount}">Channel (estimated conversion rate):</label>
            <select id="channel${strategyCount}" name="channel${strategyCount}" required onchange="updateCharts(); updateEstimates();">
                <option value="podcasts">Podcasts (2.2%)</option>
                <option value="social">Social Media (1.8%)</option>
                <option value="blogs">Blogs (2.0%)</option>
                <option value="email">Email Marketing (2.6%)</option>
                <option value="seo">SEO (2.4%)</option>
                <option value="ebooks">eBooks/Research (2.1%)</option>
                <option value="community">Community Building (2.3%)</option>
                <option value="influencer">Influencer Content (2.5%)</option>
            </select>
            
            <label for="audience${strategyCount}">Audience Targeting (estimated conversion rate):</label>
            <select id="audience${strategyCount}" name="audience${strategyCount}" required onchange="updateCharts(); updateEstimates();">
                <option value="small_business">Small Business Owners (2.4%)</option>
                <option value="designers">Professional Designers (2.2%)</option>
                <option value="marketers">Digital Marketers (2.6%)</option>
                <option value="students">Students (1.6%)</option>
                <option value="educators">Educators (2.0%)</option>
                <option value="govt_nonprofit">Govt / Non-Profit Orgs (2.2%)</option>
                <option value="enterprise">Enterprise IT Buyers (2.8%)</option>
                <option value="job_seekers">Job Seekers (1.8%)</option>
            </select>
            
            <label for="strategy${strategyCount}">Additional Information:</label>
            <textarea id="strategy${strategyCount}" name="strategy${strategyCount}" rows="4"></textarea>
        </div>
    `;
    container.appendChild(section);
    updateTotalBudget();
    updateCharts();
    updateStrategyEstimates(section);
    if (shouldSave) {
        saveStrategiesToLocalStorage();
    }

    const channelSelect = section.querySelector(`select[name^="channel"]`);
    const audienceSelect = section.querySelector(`select[name^="audience"]`);
    
    channelSelect.addEventListener('change', () => {
        updateStrategyEstimates(section);
        updateCharts();
        updateEstimates();
        if (shouldSave) saveStrategiesToLocalStorage();
    });
    
    audienceSelect.addEventListener('change', () => {
        updateStrategyEstimates(section);
        updateCharts();
        updateEstimates();
        if (shouldSave) saveStrategiesToLocalStorage();
    });
}

function toggleStrategy(button) {
    const content = button.closest('.strategy-section').querySelector('.strategy-content');
    content.classList.toggle('minimized');
    button.classList.toggle('fa-minus');
    button.classList.toggle('fa-plus');
}

function removeStrategy(button) {
    const section = button.closest('.strategy-section');
    section.parentElement.removeChild(section);
    updateTotalBudget();
    updateCharts();
    saveStrategiesToLocalStorage();
}

function updateBudgetValue(input) {
    updateTotalBudget();
    updateCharts();
    updateStrategyEstimates(input.closest('.strategy-section'));
    saveStrategiesToLocalStorage();
}

function updateStrategyList() {
    const strategyList = document.getElementById('strategyList');
    strategyList.innerHTML = ''; // Clear existing list

    const strategies = document.querySelectorAll('.strategy-section');
    strategies.forEach((strategy, index) => {
        const campaignNameInput = strategy.querySelector('input[name^="campaignName"]');
        const budgetInput = strategy.querySelector('input[name^="budget"]');
        
        const campaignName = campaignNameInput.value || `Strategy #${index + 1}`;
        const budgetValue = parseInt(budgetInput.value) || 0;

        const strategyItem = document.createElement('div');
        strategyItem.className = 'strategy-item';
        strategyItem.innerHTML = `
            <span>${campaignName}:</span>
            <span>$${budgetValue.toLocaleString()}</span>
        `;
        strategyList.appendChild(strategyItem);
    });

    updateCharts();
}

function updateTotalBudget() {
    const totalBudgetElement = document.getElementById('quarterlyBudget');
    const totalBudgetDisplayElement = document.getElementById('totalBudget');
    
    if (!totalBudgetElement || !totalBudgetDisplayElement) return;

    const totalBudget = parseInt(totalBudgetElement.value);
    let allocatedBudget = 0;
    const budgetInputs = document.querySelectorAll('input[name^="budget"]');
    
    budgetInputs.forEach(input => {
        allocatedBudget += parseInt(input.value) || 0;
    });

    const remainingBudget = totalBudget - allocatedBudget;
    totalBudgetDisplayElement.textContent = `Remaining Budget: $${remainingBudget.toLocaleString()}`;
    totalBudgetDisplayElement.className = remainingBudget < 0 ? 'error' : '';

    document.querySelectorAll('.strategy-section').forEach(strategySection => {
        updateStrategyEstimates(strategySection);
    });

    updateStrategyList();
    updateEstimates();
}

function updateEstimates() {
    let totalImpressions = 0;
    let totalConversions = 0;
    let totalBudget = 0;
    let totalConversionRate = 0;
    const strategies = document.querySelectorAll('.strategy-section');
    
    strategies.forEach(strategy => {
        const budget = parseInt(strategy.querySelector('input[name^="budget"]').value) || 0;
        const channel = strategy.querySelector('select[name^="channel"]').value;
        const audience = strategy.querySelector('select[name^="audience"]').value;
        
        // These are placeholder calculations. Adjust as needed for more accurate estimates.
        let impressionRate = 10; // Base rate: 10 impressions per dollar
        let channelConversionRate = 0.02; // Base rate: 2% conversion rate
        let audienceConversionRate = 0.02; // Base rate: 2% conversion rate
        
        // Adjust rates based on channel
        switch(channel) {
            case 'podcasts':
                impressionRate *= 0.8;
                channelConversionRate = 0.022;
                break;
            case 'social':
                impressionRate *= 1.2;
                channelConversionRate = 0.018;
                break;
            case 'blogs':
                impressionRate *= 0.5;
                channelConversionRate = 0.020;
                break;
            case 'email':
                impressionRate *= 0.3;
                channelConversionRate = 0.026;
                break;
            case 'seo':
                impressionRate *= 1.0;
                channelConversionRate = 0.024;
                break;
            case 'ebooks':
                impressionRate *= 0.4;
                channelConversionRate = 0.021;
                break;
            case 'community':
                impressionRate *= 0.7;
                channelConversionRate = 0.023;
                break;
            case 'influencer':
                impressionRate *= 1.5;
                channelConversionRate = 0.025;
                break;
        }
        
        // Adjust rates based on audience
        switch(audience) {
            case 'small_business':
                impressionRate *= 1.0;
                audienceConversionRate = 0.024;
                break;
            case 'designers':
                impressionRate *= 0.8;
                audienceConversionRate = 0.022;
                break;
            case 'marketers':
                impressionRate *= 1.2;
                audienceConversionRate = 0.026;
                break;
            case 'students':
                impressionRate *= 1.5;
                audienceConversionRate = 0.016;
                break;
            case 'educators':
                impressionRate *= 0.7;
                audienceConversionRate = 0.020;
                break;
            case 'govt_nonprofit':
                impressionRate *= 0.6;
                audienceConversionRate = 0.022;
                break;
            case 'enterprise':
                impressionRate *= 0.9;
                audienceConversionRate = 0.028;
                break;
            case 'job_seekers':
                impressionRate *= 1.1;
                audienceConversionRate = 0.018;
                break;
        }
        
        const strategyConversionRate = (channelConversionRate + audienceConversionRate) / 2;
        const strategyImpressions = Math.floor(budget * impressionRate);
        const strategyConversions = Math.floor(strategyImpressions * strategyConversionRate);
        
        totalImpressions += strategyImpressions;
        totalConversions += strategyConversions;
        totalBudget += budget;
        totalConversionRate += strategyConversionRate;
    });

    document.getElementById('estimatedImpressions').textContent = `Estimated Impressions: ${totalImpressions.toLocaleString()}`;
    document.getElementById('estimatedConversions').textContent = `Estimated Conversions: ${totalConversions.toLocaleString()}`;
    const avgConversionRate = strategies.length > 0 ? (totalConversionRate / strategies.length) * 100 : 0;
    document.getElementById('avgConversionRate').textContent = `Avg Conversion Rate: ${avgConversionRate.toFixed(2)}%`;
}

function updateCharts() {
    const strategies = document.querySelectorAll('.strategy-section');
    const audienceData = {};
    const channelData = {};

    strategies.forEach(strategy => {
        const budget = parseInt(strategy.querySelector('input[name^="budget"]').value) || 0;
        const audience = strategy.querySelector('select[name^="audience"]').value;
        const channel = strategy.querySelector('select[name^="channel"]').value;

        audienceData[audience] = (audienceData[audience] || 0) + budget;
        channelData[channel] = (channelData[channel] || 0) + budget;
    });

    createPieChart('audienceChart', audienceData);
    createPieChart('channelChart', channelData);
}

function createPieChart(containerId, data) {
    const ctx = document.getElementById(containerId).getContext('2d');
    
    if (charts[containerId]) {
        charts[containerId].destroy();
    }

    const labels = Object.keys(data);
    const values = Object.values(data);

    charts[containerId] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#4BC0C0'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        const dataset = data.datasets[tooltipItem.datasetIndex];
                        const total = dataset.data.reduce((acc, current) => acc + current, 0);
                        const currentValue = dataset.data[tooltipItem.index];
                        const percentage = ((currentValue / total) * 100).toFixed(2);
                        return `${data.labels[tooltipItem.index]}: $${currentValue.toLocaleString()} (${percentage}%)`;
                    }
                }
            },
            plugins: {
                datalabels: {
                    formatter: (value, ctx) => {
                        const dataset = ctx.chart.data.datasets[0];
                        const total = dataset.data.reduce((acc, data) => acc + data, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `$${value.toLocaleString()}\n(${percentage}%)`;
                    },
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 11
                    }
                }
            }
        }
    });
}

function previewStrategy() {
    const form = document.getElementById('strategyForm');
    const preview = document.getElementById('strategyPreview');
    preview.textContent = '';
    const totalBudget = document.getElementById('quarterlyBudget').value;
    preview.textContent += `Total Quarterly Budget: $${parseInt(totalBudget).toLocaleString()}\n\n`;
    const strategies = document.querySelectorAll('.strategy-section');
    strategies.forEach((strategy, index) => {
        preview.textContent += `Content Strategy #${index + 1}\n`;
        const inputs = strategy.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.name) {
                let value = input.value;
                if (input.name.startsWith('budget')) {
                    value = '$' + parseInt(value).toLocaleString();
                }
                preview.textContent += `${input.name}: ${value}\n`;
            }
        });
        preview.textContent += '\n';
    });
}

function downloadCSV() {
    const totalBudget = document.getElementById('quarterlyBudget').value;
    const strategies = document.querySelectorAll('.strategy-section');
    console.log('Number of strategies found:', strategies.length);
    const data = [];

    strategies.forEach((strategy, index) => {
        console.log('Processing strategy #', index + 1);
        const strategyData = {
            'Strategy Number': index + 1,
            'Total Quarterly Budget': '$' + parseInt(totalBudget).toLocaleString(),
            'Campaign Name': '',
            'Budget': '',
            'Channel': '',
            'Audience': '',
            'Additional Information': ''
        };
        const inputs = strategy.querySelectorAll('input, select, textarea');
        console.log('Number of inputs found:', inputs.length);
        inputs.forEach(input => {
            if (input.name) {
                let value = input.value;
                if (input.name.startsWith('budget')) {
                    value = '$' + parseInt(value).toLocaleString();
                    strategyData['Budget'] = value;
                } else if (input.name.startsWith('campaignName')) {
                    strategyData['Campaign Name'] = value;
                } else if (input.name.startsWith('channel')) {
                    strategyData['Channel'] = value;
                } else if (input.name.startsWith('audience')) {
                    strategyData['Audience'] = value;
                } else if (input.name.startsWith('strategy')) {
                    strategyData['Additional Information'] = value;
                }
                console.log('Input:', input.name, 'Value:', value);
            }
        });
        data.push(strategyData);
    });

    console.log('Final data array:', data);

    if (data.length === 0) {
        alert("No strategies to download. Please add at least one strategy.");
        return;
    }

    try {
        const csv = Papa.unparse(data);
        console.log('Generated CSV:', csv);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'canva_content_strategies.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("Your browser doesn't support downloading CSV files. Please try a different browser.");
        }
    } catch (error) {
        console.error("Error generating CSV:", error);
        alert("An error occurred while generating the CSV file. Please try again.");
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
                    populateStrategiesFromCSV(results.data);
                }
            });
        };
        reader.readAsText(file);
    }
}

function populateStrategiesFromCSV(data) {
    // Clear existing strategies
    document.getElementById('strategyContainer').innerHTML = '';
    strategyCount = 0;

    // Set the total quarterly budget
    const totalBudget = data[0]['Total Quarterly Budget'].replace(/[^0-9]/g, '');
    document.getElementById('quarterlyBudget').value = totalBudget;

    // Add strategies from CSV
    data.forEach((row, index) => {
        addStrategy();
        const strategySection = document.querySelectorAll('.strategy-section')[index];
        
        Object.keys(row).forEach(key => {
            if (key !== 'Strategy Number' && key !== 'Total Quarterly Budget') {
                let inputName = key.replace(/\s+/g, '').toLowerCase();
                if (inputName === 'campaignname') inputName = 'campaignName';
                if (inputName === 'additionalinformation') inputName = 'strategy';
                const input = strategySection.querySelector(`[name="${inputName}${index + 1}"]`);
                if (input) {
                    if (key === 'Budget') {
                        input.value = row[key].replace(/[^0-9]/g, '');
                    } else {
                        input.value = row[key];
                    }
                }
            }
        });
    });

    updateTotalBudget();
    updateCharts();
}

function navigateTo(page) {
    switch(page) {
        case 'create':
            window.location.href = 'index.html';
            break;
        case 'analyze':
            window.location.href = 'analyze.html';
            break;
        case 'learn':
            window.location.href = 'learn.html';
            break;
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.className = document.body.classList.contains('light-theme') ? 'fas fa-sun' : 'fas fa-moon';
    
    // Save theme preference
    const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    localStorage.setItem('theme', theme);
}

function addInputChangeListeners() {
    document.getElementById('strategyContainer').addEventListener('input', (event) => {
        if (event.target.matches('input, select, textarea')) {
            saveStrategiesToLocalStorage();
        }
    });

    document.getElementById('quarterlyBudget').addEventListener('change', saveStrategiesToLocalStorage);
}

// Add these functions at the end of your script.js file

function showResetModal() {
    document.getElementById('resetModal').style.display = 'block';
}

function hideResetModal() {
    document.getElementById('resetModal').style.display = 'none';
}

function resetAllStrategies() {
    // Clear localStorage
    localStorage.removeItem('contentStrategies');

    // Clear strategy container
    document.getElementById('strategyContainer').innerHTML = '';

    // Reset strategy count
    strategyCount = 0;

    // Reset total budget to default value
    document.getElementById('quarterlyBudget').value = '5000000';

    // Add one empty strategy
    addStrategy();

    // Update UI
    updateTotalBudget();
    updateCharts();

    // Hide modal
    hideResetModal();
}

// Modify the DOMContentLoaded event listener to include the new reset functionality
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

    // Load saved strategies
    loadStrategiesFromLocalStorage();

    // If no strategies were loaded, add one
    if (document.querySelectorAll('.strategy-section').length === 0) {
        addStrategy();
    }

    // Update UI
    updateTotalBudget();
    updateCharts();
    updateStrategyList();

    // Add input change listeners
    addInputChangeListeners();

    // Minimize toggle functionality
    const minimizeToggle = document.getElementById('minimizeToggle');
    const floatingBudget = document.getElementById('floatingBudget');
    if (minimizeToggle && floatingBudget) {
        minimizeToggle.addEventListener('click', () => {
            floatingBudget.classList.toggle('minimized');
            minimizeToggle.className = floatingBudget.classList.contains('minimized') ? 'fas fa-plus' : 'fas fa-minus';
        });
    }

    // Add reset button functionality
    const resetButton = document.getElementById('resetButton');
    const confirmResetButton = document.getElementById('confirmReset');
    const cancelResetButton = document.getElementById('cancelReset');

    resetButton.addEventListener('click', showResetModal);
    confirmResetButton.addEventListener('click', resetAllStrategies);
    cancelResetButton.addEventListener('click', hideResetModal);

    // Close modal if user clicks outside of it
    window.addEventListener('click', function(event) {
        if (event.target == document.getElementById('resetModal')) {
            hideResetModal();
        }
    });
});

// Instead, add these event listeners to save when changes are made
document.getElementById('strategyContainer').addEventListener('input', saveStrategiesToLocalStorage);
document.getElementById('quarterlyBudget').addEventListener('change', saveStrategiesToLocalStorage);

function updateStrategyEstimates(strategySection) {
    const budget = parseInt(strategySection.querySelector('input[name^="budget"]').value) || 0;
    const channel = strategySection.querySelector('select[name^="channel"]').value;
    const audience = strategySection.querySelector('select[name^="audience"]').value;
    
    let impressionRate = 10; // Base rate: 10 impressions per dollar
    let channelConversionRate = 0.02; // Base rate: 2% conversion rate
    let audienceConversionRate = 0.02; // Base rate: 2% conversion rate
    
    // Adjust rates based on channel
    switch(channel) {
        case 'podcasts':
            impressionRate *= 0.8;
            channelConversionRate = 0.022;
            break;
        case 'social':
            impressionRate *= 1.2;
            channelConversionRate = 0.018;
            break;
        case 'blogs':
            impressionRate *= 0.5;
            channelConversionRate = 0.020;
            break;
        case 'email':
            impressionRate *= 0.3;
            channelConversionRate = 0.026;
            break;
        case 'seo':
            impressionRate *= 1.0;
            channelConversionRate = 0.024;
            break;
        case 'ebooks':
            impressionRate *= 0.4;
            channelConversionRate = 0.021;
            break;
        case 'community':
            impressionRate *= 0.7;
            channelConversionRate = 0.023;
            break;
        case 'influencer':
            impressionRate *= 1.5;
            channelConversionRate = 0.025;
            break;
    }
    
    // Adjust rates based on audience
    switch(audience) {
        case 'small_business':
            impressionRate *= 1.0;
            audienceConversionRate = 0.024;
            break;
        case 'designers':
            impressionRate *= 0.8;
            audienceConversionRate = 0.022;
            break;
        case 'marketers':
            impressionRate *= 1.2;
            audienceConversionRate = 0.026;
            break;
        case 'students':
            impressionRate *= 1.5;
            audienceConversionRate = 0.016;
            break;
        case 'educators':
            impressionRate *= 0.7;
            audienceConversionRate = 0.020;
            break;
        case 'govt_nonprofit':
            impressionRate *= 0.6;
            audienceConversionRate = 0.022;
            break;
        case 'enterprise':
            impressionRate *= 0.9;
            audienceConversionRate = 0.028;
            break;
        case 'job_seekers':
            impressionRate *= 1.1;
            audienceConversionRate = 0.018;
            break;
    }
    
    const strategyConversionRate = (channelConversionRate + audienceConversionRate) / 2;
    const strategyImpressions = Math.floor(budget * impressionRate);
    const strategyConversions = Math.floor(strategyImpressions * strategyConversionRate);

    strategySection.querySelector('.estimated-impressions').textContent = `Estimated Impressions: ${strategyImpressions.toLocaleString()}`;
    strategySection.querySelector('.estimated-conversions').textContent = `Estimated Conversions: ${strategyConversions.toLocaleString()}`;
}

function loadStrategiesFromLocalStorage() {
    const savedData = localStorage.getItem('contentStrategies');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Set total budget
        document.getElementById('quarterlyBudget').value = parsedData.totalBudget;
        
        // Clear existing strategies
        document.getElementById('strategyContainer').innerHTML = '';
        strategyCount = 0; // Reset strategy count

        // Recreate strategies
        parsedData.strategies.forEach((strategyData, index) => {
            addStrategy(false); // Pass false to prevent saving during loading
            const strategySection = document.querySelectorAll('.strategy-section')[index];
            
            if (strategySection) {
                strategySection.querySelector('input[name^="campaignName"]').value = strategyData.campaignName || '';
                strategySection.querySelector('input[name^="budget"]').value = strategyData.budget || '0';
                strategySection.querySelector('select[name^="channel"]').value = strategyData.channel || '';
                strategySection.querySelector('select[name^="audience"]').value = strategyData.audience || '';
                strategySection.querySelector('textarea[name^="strategy"]').value = strategyData.additionalInfo || '';
                updateStrategyEstimates(strategySection);
            }
        });

        updateTotalBudget();
        updateCharts();
        updateStrategyList();
    }
}

// Modify the DOMContentLoaded event listener
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

    // Load saved strategies
    loadStrategiesFromLocalStorage();

    // If no strategies were loaded, add one
    if (document.querySelectorAll('.strategy-section').length === 0) {
        addStrategy();
    }

    // Update UI
    updateTotalBudget();
    updateCharts();
    updateStrategyList();

    // Add input change listeners
    addInputChangeListeners();

    // Minimize toggle functionality
    const minimizeToggle = document.getElementById('minimizeToggle');
    const floatingBudget = document.getElementById('floatingBudget');
    if (minimizeToggle && floatingBudget) {
        minimizeToggle.addEventListener('click', () => {
            floatingBudget.classList.toggle('minimized');
            minimizeToggle.className = floatingBudget.classList.contains('minimized') ? 'fas fa-plus' : 'fas fa-minus';
        });
    }

    // Add reset button functionality
    const resetButton = document.getElementById('resetButton');
    const confirmResetButton = document.getElementById('confirmReset');
    const cancelResetButton = document.getElementById('cancelReset');

    resetButton.addEventListener('click', showResetModal);
    confirmResetButton.addEventListener('click', resetAllStrategies);
    cancelResetButton.addEventListener('click', hideResetModal);

    // Close modal if user clicks outside of it
    window.addEventListener('click', function(event) {
        if (event.target == document.getElementById('resetModal')) {
            hideResetModal();
        }
    });
});

function showStrategyOverview() {
    const container = document.getElementById('strategyOverviewContainer');
    container.innerHTML = '';
    
    const strategies = document.querySelectorAll('.strategy-section');
    strategies.forEach((strategy, index) => {
        const campaignName = strategy.querySelector('input[name^="campaignName"]').value || `Strategy #${index + 1}`;
        const budget = parseInt(strategy.querySelector('input[name^="budget"]').value) || 0;
        const channel = strategy.querySelector('select[name^="channel"]').value;
        const audience = strategy.querySelector('select[name^="audience"]').value;
        const additionalInfo = strategy.querySelector('textarea[name^="strategy"]').value;
        
        const impressions = strategy.querySelector('.estimated-impressions').textContent;
        const conversions = strategy.querySelector('.estimated-conversions').textContent;
        
        const card = document.createElement('div');
        card.className = 'strategy-card';
        card.innerHTML = `
            <h3>${campaignName}</h3>
            <p><strong>Budget:</strong> $${budget.toLocaleString()}</p>
            <p><strong>Channel:</strong> ${channel}</p>
            <p><strong>Audience:</strong> ${audience}</p>
            <p>${impressions}</p>
            <p>${conversions}</p>
            <p><strong>Additional Info:</strong> ${additionalInfo}</p>
        `;
        container.appendChild(card);
    });
    
    document.getElementById('strategyOverviewModal').style.display = 'block';
}

function downloadStrategyOverviewPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Strategy Overview", 20, 20);
    
    let yPosition = 40;
    const strategies = document.querySelectorAll('.strategy-card');
    
    strategies.forEach((strategy, index) => {
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(strategy.querySelector('h3').textContent, 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        strategy.querySelectorAll('p').forEach(p => {
            if (yPosition > 280) {
                doc.addPage();
                yPosition = 20;
            }
            doc.text(p.textContent, 20, yPosition);
            yPosition += 10;
        });
        
        yPosition += 10;
    });
    
    doc.save("strategy_overview.pdf");
}

function hideStrategyOverview() {
    document.getElementById('strategyOverviewModal').style.display = 'none';
}

// Add this to the existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...

    // Close strategy overview modal if user clicks outside of it
    window.addEventListener('click', function(event) {
        if (event.target == document.getElementById('strategyOverviewModal')) {
            hideStrategyOverview();
        }
    });
});
