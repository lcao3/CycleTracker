// Storage key for localStorage
const STORAGE_KEY = 'cycleTrackerData';

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    displayEntries();
    generatePredictions();
});

// Add new entry
function addEntry() {
    const periodDate = document.getElementById('periodDate').value;
    const ovulationDate = document.getElementById('ovulationDate').value;
    
    if (!periodDate || !ovulationDate) {
        alert('Please enter both period and ovulation dates');
        return;
    }
    
    // Validate that ovulation date is after period date
    if (new Date(ovulationDate) <= new Date(periodDate)) {
        alert('Ovulation date should be after period start date');
        return;
    }
    
    const entry = {
        id: Date.now(),
        periodDate: periodDate,
        ovulationDate: ovulationDate,
        cycleLength: null // Will be calculated later
    };
    
    let data = loadData();
    data.push(entry);
    
    // Calculate cycle lengths
    calculateCycleLengths(data);
    
    saveData(data);
    displayEntries();
    generatePredictions();
    
    // Clear form
    document.getElementById('periodDate').value = '';
    document.getElementById('ovulationDate').value = '';
}

// Calculate cycle lengths between entries
function calculateCycleLengths(data) {
    data.sort((a, b) => new Date(a.periodDate) - new Date(b.periodDate));
    
    for (let i = 1; i < data.length; i++) {
        const prevDate = new Date(data[i-1].periodDate);
        const currentDate = new Date(data[i].periodDate);
        const diffTime = Math.abs(currentDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        data[i].cycleLength = diffDays;
    }
}

// Display all entries
function displayEntries() {
    const data = loadData();
    const entriesList = document.getElementById('entriesList');
    
    if (data.length === 0) {
        entriesList.innerHTML = '<div class="no-data">No entries yet. Add your first entry above!</div>';
        return;
    }
    
    entriesList.innerHTML = data.map(entry => {
        const periodDate = new Date(entry.periodDate).toLocaleDateString();
        const ovulationDate = new Date(entry.ovulationDate).toLocaleDateString();
        const cycleInfo = entry.cycleLength ? `<div class="cycle-info">Cycle Length: ${entry.cycleLength} days</div>` : '';
        
        return `
            <div class="entry-item">
                <div>
                    <strong>Period:</strong> ${periodDate} | <strong>Ovulation:</strong> ${ovulationDate}
                    ${cycleInfo}
                </div>
                <button class="delete-btn" onclick="deleteEntry(${entry.id})">Delete</button>
            </div>
        `;
    }).join('');
}

// Generate predictions for next 12 months
function generatePredictions() {
    const data = loadData();
    const predictionsList = document.getElementById('predictionsList');
    
    if (data.length < 3) {
        predictionsList.innerHTML = `<div class="no-data">Need at least 3 entries to generate predictions. You have ${data.length} entries.</div>`;
        return;
    }
    
    // Calculate average cycle length and ovulation day
    const cycleLengths = data.filter(entry => entry.cycleLength).map(entry => entry.cycleLength);
    const avgCycleLength = Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length);
    
    // Calculate average days from period to ovulation
    const ovulationDays = data.map(entry => {
        const periodDate = new Date(entry.periodDate);
        const ovulationDate = new Date(entry.ovulationDate);
        const diffTime = Math.abs(ovulationDate - periodDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });
    const avgOvulationDay = Math.round(ovulationDays.reduce((sum, day) => sum + day, 0) / ovulationDays.length);
    
    // Get last period date
    const sortedData = [...data].sort((a, b) => new Date(b.periodDate) - new Date(a.periodDate));
    const lastPeriodDate = new Date(sortedData,[object Object],periodDate);
    
    // Generate 12 months of predictions
    const predictions = [];
    let currentDate = new Date(lastPeriodDate);
    
    for (let i = 0; i < 12; i++) {
        currentDate.setDate(currentDate.getDate() + avgCycleLength);
        const periodDate = new Date(currentDate);
        
        const ovulationDate = new Date(periodDate);
        ovulationDate.setDate(ovulationDate.getDate() + avgOvulationDay);
        
        predictions.push({
            month: i + 1,
            periodDate: periodDate.toLocaleDateString(),
            ovulationDate: ovulationDate.toLocaleDateString(),
            cycleLength: avgCycleLength
        });
    }
    
    predictionsList.innerHTML = `
        <div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 10px;">
            <strong>📊 Your Averages:</strong> Cycle Length: ${avgCycleLength} days | Ovulation Day: ${avgOvulationDay}
        </div>
        ${predictions.map(pred => `
            <div class="prediction-item">
                <div>
                    <strong>Month ${pred.month}:</strong> Period: ${pred.periodDate} | Ovulation: ${pred.ovulationDate}
                    <div class="cycle-info">Predicted cycle length: ${pred.cycleLength} days</div>
                </div>
            </div>
        `).join('')}
    `;
}

// Delete entry
function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        let data = loadData();
        data = data.filter(entry => entry.id !== id);
        calculateCycleLengths(data);
        saveData(data);
        displayEntries();
        generatePredictions();
    }
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        displayEntries();
        generatePredictions();
    }
}

// Load data from localStorage
function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Save data to localStorage
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}