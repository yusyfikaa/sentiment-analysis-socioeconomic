// static/js/main.js

// --- Global objects to hold chart instances and configs ---
const chartInstances = {};
const chartConfigs = {};

document.addEventListener('DOMContentLoaded', function () {
    // --- General UI Interactivity ---
    const vizLink = document.querySelector('.has-submenu');
    if (vizLink) {
        vizLink.addEventListener('click', function (e) {
            e.preventDefault();
            const submenu = this.nextElementSibling;
            submenu.classList.toggle('open');
        });
    }

    const sidebarToggle = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    if(sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // --- Page-specific Logic ---
    if (document.querySelector('.dashboard-grid')) {
        loadDashboardData();
    }
    
    const topicGrid = document.querySelector('.topic-grid');
    if (topicGrid) {
        const topic = topicGrid.dataset.topic;
        loadTopicData(topic);
    }
    
   // REPLACE THE OLD 'data-table' BLOCK WITH THIS
if (document.getElementById('comments-container')) {
    loadCommentCards();
    setupCommentFilters();
}
    
    if (document.getElementById('analyse-btn')) {
        setupAnalyser();
    }
    
    // --- Setup for scraper page ---
    if (document.getElementById('scrape-btn')) {
        setupScraper();
    }
    
    // --- Setup Modal Listeners ---
    setupModal();
    
    // --- ADD THIS LOGIC FOR THE PRINT BUTTON ---
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', function () {
            window.print();
        });
    }
});


// --- Chart Colors ---
const chartColors = {
    positive: 'rgb(0, 123, 255)',
    neutral: 'rgb(255, 193, 7)',
    negative: 'rgb(220, 53, 69)',
};

// --- Data Loading Functions ---

async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard_data');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        document.getElementById('positive-count').textContent = data.sentiment_counts.Positive || 0;
        document.getElementById('neutral-count').textContent = data.sentiment_counts.Neutral || 0;
        document.getElementById('negative-count').textContent = data.sentiment_counts.Negative || 0;
        document.getElementById('total-count').textContent = data.total_count || 0;

        createSentimentPieChart('sentiment-pie-chart', data.sentiment_counts);
        createPlatformBarChart('platform-bar-chart', data.platform_dist);
        createTopicBarChart('topic-bar-chart', data.topic_dist);
        
        // Word clouds on dashboard are image placeholders, so no JS needed here.
        // ADD THIS LINE to hide the skeleton and show the content
        document.querySelector('.dashboard-grid').classList.remove('is-loading');


    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

async function loadTopicData(topic) {
    try {
        const response = await fetch(`/api/topic_data/${topic}`);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const data = await response.json();

        document.getElementById('positive-count').textContent = data.sentiment_counts.Positive || 0;
        document.getElementById('neutral-count').textContent = data.sentiment_counts.Neutral || 0;
        document.getElementById('negative-count').textContent = data.sentiment_counts.Negative || 0;
        document.getElementById('total-count').textContent = data.total_count || 0;
        
        createSentimentPieChart('topic-sentiment-pie-chart', data.sentiment_counts);
        createPlatformBarChart('topic-platform-bar-chart', data.platform_dist);
        
        // Check if the word cloud canvases exist before trying to draw on them
        if (document.getElementById('positive-word-cloud')) {
            createWordCloud('positive-word-cloud', data.word_clouds.positive);
        }
        if (document.getElementById('neutral-word-cloud')) {
            createWordCloud('neutral-word-cloud', data.word_clouds.neutral);
        }
        if (document.getElementById('negative-word-cloud')) {
            createWordCloud('negative-word-cloud', data.word_clouds.negative);
        }

    } catch (error) {
        console.error(`Failed to load data for topic ${topic}:`, error);
    }
}

// PASTE THIS NEW CODE IN YOUR main.js FILE

// This function fetches data and calls the function to build cards
async function loadCommentCards() {
    try {
        // This fetch URL matches your old function
        const response = await fetch('/api/get_all_data'); 
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Your API returns a direct array, so we use it directly
        const data = await response.json();
        displayCommentsAsCards(data); 
    } catch (error) {
        console.error("Could not fetch data:", error);
        const container = document.getElementById('comments-container');
        if (container) {
            container.innerHTML = '<p style="color: red; text-align: center;">Failed to load data.</p>';
        }
    }
}

// This function builds the HTML for each card
function displayCommentsAsCards(data) {
    const container = document.getElementById('comments-container');
    if (!container) return;
    container.innerHTML = ''; // Clear previous content

    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align: center;">No data available to display.</p>';
        return;
    }

    data.forEach(item => {
        // Using property names from your original main.js file
        const sentiment = item.Sentiment ? item.Sentiment.toLowerCase() : 'neutral';
        const avatarLetter = item.socio_topic ? item.socio_topic.charAt(0).toUpperCase() : 'A';
        
        const card = document.createElement('div');
        card.className = 'comment-card';
        card.setAttribute('data-sentiment', sentiment);
        
        card.innerHTML = `
            <div class="card-left">
                <div class="avatar ${sentiment}">${avatarLetter}</div>
            </div>
            <div class="card-right">
                <div class="card-header">
                    <span class="username">u/${item.socio_topic || 'Anonymous'}</span>
                    <span class="timestamp">${item.date_posted}</span>
                    <span class="sentiment-tag ${sentiment}">${item.Sentiment || 'NEUTRAL'}</span>
                </div>
                <div class="card-body">
                    <p>${item.comment}</p>
                </div>
                <div class="card-footer">
                    <span>Replies</span>
                    <span>Share</span>
                    <span>Save</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// This function handles the filter button clicks
function setupCommentFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const cardsContainer = document.getElementById('comments-container');

    if (!cardsContainer || filterButtons.length === 0) return;

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Set active class on button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.dataset.filter;
            const cards = cardsContainer.querySelectorAll('.comment-card');

            cards.forEach(card => {
                if (filter === 'all' || card.dataset.sentiment === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}


// --- Generic and Reusable Chart Creation Functions ---

function createOrUpdateChart(canvasId, config) {
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }
    
    // Store a deep copy of the config for the modal, only if it's not the modal chart itself
    if (canvasId !== 'modal-chart-canvas') {
        chartConfigs[canvasId] = JSON.parse(JSON.stringify(config));
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    chartInstances[canvasId] = new Chart(ctx, config);
}


function createTrendChart(canvasId, trendData) {
    const config = {
        type: 'line',
        data: { labels: trendData.labels, datasets: [
            { label: 'Positive', data: trendData.positive, borderColor: chartColors.positive, fill: false },
            { label: 'Neutral', data: trendData.neutral, borderColor: chartColors.neutral, fill: false },
            { label: 'Negative', data: trendData.negative, borderColor: chartColors.negative, fill: false }
        ]},
    };
    createOrUpdateChart(canvasId, config);
}

function createSentimentPieChart(canvasId, sentimentCounts) {
    const config = {
        type: 'doughnut',
        data: { labels: ['Positive', 'Neutral', 'Negative'], datasets: [{
            data: [ sentimentCounts.Positive || 0, sentimentCounts.Neutral || 0, sentimentCounts.Negative || 0 ],
            backgroundColor: [chartColors.positive, chartColors.neutral, chartColors.negative],
        }]},
        options: { 
            plugins: { 
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                            const percentage = total ? ((value / total) * 100).toFixed(2) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    };
    createOrUpdateChart(canvasId, config);
}

function createSentimentBarChart(canvasId, sentimentCounts) {
    const config = {
        type: 'bar',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                label: 'Sentiment Count',
                data: [
                    sentimentCounts.Positive || 0,
                    sentimentCounts.Neutral || 0,
                    sentimentCounts.Negative || 0
                ],
                backgroundColor: [
                    chartColors.positive,
                    chartColors.neutral,
                    chartColors.negative,
                ],
            }]
        },
        options: {
            indexAxis: 'y', // Make it a horizontal bar chart
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                            const percentage = total ? ((value / total) * 100).toFixed(2) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    };
    createOrUpdateChart(canvasId, config);
}


function createPlatformBarChart(canvasId, platformDist) {
    const platforms = Object.keys(platformDist);
    const config = {
        type: 'bar',
        data: { labels: platforms, datasets: [
            { label: 'Positive', data: platforms.map(p => platformDist[p]?.Positive || 0), backgroundColor: chartColors.positive },
            { label: 'Neutral', data: platforms.map(p => platformDist[p]?.Neutral || 0), backgroundColor: chartColors.neutral },
            { label: 'Negative', data: platforms.map(p => platformDist[p]?.Negative || 0), backgroundColor: chartColors.negative }
        ]},
        options: { 
            plugins: { legend: { display: false } }, 
            scales: { x: { stacked: false }, y: { stacked: false } } 
        }
    };
    createOrUpdateChart(canvasId, config);
}

function createTopicBarChart(canvasId, topicDist) {
    const topics = Object.keys(topicDist);
    const config = {
        type: 'bar',
        data: { labels: topics, datasets: [
            { label: 'Positive', data: topics.map(t => topicDist[t]?.Positive || 0), backgroundColor: chartColors.positive },
            { label: 'Neutral', data: topics.map(t => topicDist[t]?.Neutral || 0), backgroundColor: chartColors.neutral },
            { label: 'Negative', data: topics.map(t => topicDist[t]?.Negative || 0), backgroundColor: chartColors.negative }
        ]},
        options: { 
            indexAxis: 'y', 
            scales: { x: { stacked: true }, y: { stacked: true } } 
        }
    };
    createOrUpdateChart(canvasId, config);
}

function createWordCloud(canvasId, textData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !textData || textData.trim() === '') {
        return;
    }
    
    const words = textData.split(/\s+/).reduce((acc, word) => {
        if(word.length > 3) { acc[word.toLowerCase()] = (acc[word.toLowerCase()] || 0) + 1; }
        return acc;
    }, {});
    const wordList = Object.keys(words).map(key => ({
        key: key, value: words[key]
    })).sort((a,b) => b.value - a.value).slice(0, 40);
    if (wordList.length === 0) return;

    const config = {
        type: 'wordCloud',
        data: { labels: wordList.map(w => w.key), datasets: [{
            label: '', data: wordList.map(w => 10 + w.value * 10)
        }]},
        options: { 
            plugins: { legend: { display: false } } 
        }
    };
    createOrUpdateChart(canvasId, config);
}

// --- Modal Logic ---
function setupModal() {
    const modal = document.getElementById('chart-modal');
    const closeBtn = document.getElementById('modal-close-btn');

    if (!modal || !closeBtn) return;

    document.body.addEventListener('click', function(event) {
        const enlargeBtn = event.target.closest('.enlarge-chart-btn');
        if (enlargeBtn) {
            const chartId = enlargeBtn.dataset.chartId;
            const originalConfig = chartConfigs[chartId];
            if (originalConfig) {
                modal.classList.add('visible');
                const modalConfig = JSON.parse(JSON.stringify(originalConfig));
                modalConfig.options.responsive = true;
                modalConfig.options.maintainAspectRatio = false; // This is correct for the modal
                
                createOrUpdateChart('modal-chart-canvas', modalConfig);
            }
        }
    });

    const closeModal = () => {
        modal.classList.remove('visible');
        if (chartInstances['modal-chart-canvas']) {
            chartInstances['modal-chart-canvas'].destroy();
        }
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}


// --- Analyser Page Logic ---
function setupAnalyser() {
    const analyseBtn = document.getElementById('analyse-btn');
    const clearBtn = document.getElementById('clear-btn');
    const textArea = document.getElementById('text-to-analyze');
    const resultDiv = document.getElementById('analyser-result');

    analyseBtn.addEventListener('click', async () => {
        const text = textArea.value.trim();
        if (!text) {
            resultDiv.innerHTML = '<p style="color: red;">Please enter text to analyze.</p>';
            return;
        }
        
        resultDiv.innerHTML = 'Analyzing...';
        
        try {
            const response = await fetch('/api/analyze_text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });
            const result = await response.json();
            
            if (result.error) {
                 resultDiv.innerHTML = `<p style="color: red;">Error: ${result.error}</p>`;
            } else {
                 // Dynamically create the result grid
                 resultDiv.innerHTML = `
                    <div class="result-grid">
                        <div class="result-item">
                            <h4>Sentiment</h4>
                            <p id="result-sentiment" class="${result.sentiment.toLowerCase()}">${result.sentiment}</p>
                        </div>
                        <div class="result-item">
                            <h4>Confidence Score</h4>
                            <p id="result-confidence">${result.confidence_score}</p>
                        </div>
                    </div>
                 `;
            }

        } catch (error) {
             resultDiv.innerHTML = '<p style="color: red;">Failed to connect to the server.</p>';
             console.error('Analysis failed:', error);
        }
    });

    clearBtn.addEventListener('click', () => {
        textArea.value = '';
        // Restore the initial placeholder
        resultDiv.innerHTML = '<img src="https://img.icons8.com/ios/100/CCCCCC/combo-chart--v1.png" alt="chart icon" class="placeholder-icon"/>';
    });
}

// --- Scraper Page Logic ---
function setupScraper() {
    const scrapeBtn = document.getElementById('scrape-btn');
    const clearBtn = document.getElementById('clear-scrape-btn');
    const linkInput = document.getElementById('scrape-link');
    const resultsContainer = document.getElementById('scrape-results-container');
    const resultsBody = document.getElementById('scrape-results-body');
    const placeholder = document.getElementById('scrape-placeholder');

    scrapeBtn.addEventListener('click', async () => {
        const link = linkInput.value.trim();
        if (!link) {
            alert('Please enter a link to analyze.');
            return;
        }
        
        placeholder.textContent = 'Analyzing... This may take a moment.';
        placeholder.style.display = 'block';
        resultsContainer.style.display = 'none';
        resultsBody.innerHTML = '';


        try {
            const response = await fetch('/api/scrape_and_analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ link: link })
            });
            const data = await response.json();

            if (data.error) {
                placeholder.textContent = `Error: ${data.error}`;
            } else if (!data.table_data || data.table_data.length === 0) {
                 placeholder.textContent = 'No comments found to analyze.';
            } else {
                placeholder.style.display = 'none';
                resultsContainer.style.display = 'block';
                
                document.getElementById('scrape-total-count').textContent = data.summary.total_count || 0;
                document.getElementById('scrape-positive-count').textContent = data.summary.sentiment_counts.Positive || 0;
                document.getElementById('scrape-negative-count').textContent = data.summary.sentiment_counts.Negative || 0;
                document.getElementById('scrape-neutral-count').textContent = data.summary.sentiment_counts.Neutral || 0;

                createSentimentBarChart('scrape-bar-chart', data.summary.sentiment_counts);
                createSentimentPieChart('scrape-pie-chart', data.summary.sentiment_counts);

                data.table_data.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${row.author}</td>    
                        <td>${row.comment}</td>
                        <td class="${row.sentiment.toLowerCase()}">${row.sentiment}</td>
                        <td>${row.score}</td>
                    `;
                    resultsBody.appendChild(tr);
                });
            }
        } catch(error) {
            placeholder.textContent = 'Failed to connect to the server.';
            console.error('Scraping failed:', error);
        }
    });
    
    clearBtn.addEventListener('click', () => {
        linkInput.value = '';
        resultsBody.innerHTML = '';
        placeholder.textContent = 'Enter a Reddit URL and click "Analyze" to see results.';
        placeholder.style.display = 'block';
        resultsContainer.style.display = 'none';
        if(chartInstances['scrape-bar-chart']){
            chartInstances['scrape-bar-chart'].destroy();
        }
        if(chartInstances['scrape-pie-chart']){
            chartInstances['scrape-pie-chart'].destroy();
        }
    });

    
}
