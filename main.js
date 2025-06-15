// SVG表示用の関数
function displaySVG(svgCode, containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = svgCode;
    }
}

// 進化データの表示
function displayEvolutionData(data) {
    const container = document.getElementById('evolution-container');
    if (!container) return;

    container.innerHTML = '';

    data.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'evolution-card';
        card.innerHTML = `
            <h3>${entry.timestamp}</h3>
            <div class="svg-container">
                <div id="svgA-${entry.timestamp}"></div>
                <div id="svgB-${entry.timestamp}"></div>
            </div>
            <p><strong>Appearance:</strong> ${entry.appearance}</p>
            <p><strong>Reason:</strong> ${entry.reason}</p>
            <p><strong>Thought:</strong> ${entry.thought}</p>
        `;
        container.appendChild(card);

        // SVGを表示
        displaySVG(entry.svgA, `svgA-${entry.timestamp}`);
        displaySVG(entry.svgB, `svgB-${entry.timestamp}`);
    });
}

// 初期表示
fetch('data/evolution-history.json')
    .then(response => response.json())
    .then(data => {
        displayEvolutionData(data);
    })
    .catch(error => {
        console.error('Error loading evolution data:', error);
    }); 