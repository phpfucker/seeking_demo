/**
 * seek-in（飼育員）プロジェクト
 * 2体の膝形生命体の進化を観察するWebアプリケーション
 * 
 * @file main.js
 * @description 生命体の描画と進化レポートの表示を管理する
 */

// キャンバスとコンテキストの設定
const canvas = document.getElementById('lifeCanvas');
const ctx = canvas.getContext('2d');

// 進化履歴を保存する配列
let evolutionHistory = [];
let currentState = null;

// キャンバスのサイズを設定
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = 400;
}

// 現在の状態を読み込む（current-state.jsonが優先、なければinitial-state.json）
async function loadCurrentState() {
    try {
        // まずcurrent-state.jsonを試す
        let response = await fetch('data/current-state.json');
        if (response.ok) {
            return await response.json();
        }
        
        // current-state.jsonがなければinitial-state.jsonを使用
        response = await fetch('data/initial-state.json');
        if (!response.ok) throw new Error('Failed to load state');
        return await response.json();
    } catch (error) {
        console.error('Error loading current state:', error);
        return null;
    }
}

// 進化履歴を読み込む
async function loadEvolutionHistory() {
    try {
        const response = await fetch('data/evolution-history.json');
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Error loading evolution history:', error);
        return [];
    }
}

// セルを描画する
function drawCell(cell) {
    ctx.fillStyle = `hsl(${cell.color_h}, 80%, 60%)`;
    ctx.beginPath();
    ctx.ellipse(
        cell.x,
        cell.y,
        cell.radius * (1 + cell.shapeFactor),
        cell.radius * (1 - cell.shapeFactor),
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// エンティティを描画する
function drawEntity(cells) {
    cells.forEach(drawCell);
}

// 進化レポートを表示する
function displayReport(entity, entityName, timestamp = null) {
    const report = entity.report;
    const reportElement = document.createElement('div');
    reportElement.className = 'report-card';
    
    const timeText = timestamp ? new Date(timestamp).toLocaleString('ja-JP') : '初期状態';
    
    reportElement.innerHTML = `
        <h4>${entityName} - ${timeText}</h4>
        <h3>現在の姿</h3>
        <p>${report.appearance}</p>
        <h3>進化要因</h3>
        <p>${report.reason}</p>
        <h3>内面</h3>
        <p>${report.thought}</p>
    `;
    
    return reportElement;
}

// 全ての進化レポートを表示する
function displayAllReports() {
    const reportsList = document.getElementById('reportsList');
    reportsList.innerHTML = '';
    
    // 初期状態を表示
    if (currentState) {
        reportsList.appendChild(displayReport(currentState.entityA, 'Entity A'));
        reportsList.appendChild(displayReport(currentState.entityB, 'Entity B'));
    }
    
    // 進化履歴を新しい順に表示
    evolutionHistory.slice().reverse().forEach(step => {
        reportsList.appendChild(displayReport(step.entityA, 'Entity A', step.timestamp));
        reportsList.appendChild(displayReport(step.entityB, 'Entity B', step.timestamp));
    });
}

// UIの状態を更新する
function updateStatus(message) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
}

// 手動進化を実行する
async function executeEvolution() {
    const evolveBtn = document.getElementById('evolveBtn');
    
    if (!currentState) {
        updateStatus('初期状態が読み込まれていません');
        return;
    }
    
    // ボタンを無効化
    evolveBtn.disabled = true;
    updateStatus('進化中...');
    
    try {
        // AI進化を実行
        const nextState = await evolutionEngine.generateNextEvolution(currentState, evolutionHistory);
        
        if (nextState) {
            // 現在の状態を履歴に追加
            evolutionHistory.push({
                ...currentState,
                timestamp: Date.now()
            });
            
            // 新しい状態を設定
            currentState = nextState;
            
            // 描画とレポートの更新
            drawCurrentState();
            displayAllReports();
            
            updateStatus(`進化完了 (ステップ ${evolutionHistory.length})`);
        } else {
            updateStatus('進化に失敗しました');
        }
    } catch (error) {
        console.error('Evolution error:', error);
        updateStatus('進化エラーが発生しました');
    } finally {
        // ボタンを有効化
        evolveBtn.disabled = false;
    }
}

// 現在の状態を描画する
function drawCurrentState() {
    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (currentState) {
        // エンティティを描画
        drawEntity(currentState.entityA.cells);
        drawEntity(currentState.entityB.cells);
    }
}

// メインの初期化処理
async function initialize() {
    // 現在の状態と進化履歴を読み込む
    const state = await loadCurrentState();
    const history = await loadEvolutionHistory();
    
    if (!state) {
        updateStatus('データの読み込みに失敗しました');
        return;
    }

    // 現在の状態と履歴を設定
    currentState = state;
    evolutionHistory = history;
    
    // 初期描画
    drawCurrentState();
    displayAllReports();
    
    updateStatus(`準備完了 (進化ステップ: ${evolutionHistory.length})`);
}

// ウィンドウのリサイズ時にキャンバスを調整
window.addEventListener('resize', () => {
    resizeCanvas();
    drawCurrentState();
});

// 進化ボタンのイベントリスナー
document.addEventListener('DOMContentLoaded', () => {
    const evolveBtn = document.getElementById('evolveBtn');
    if (evolveBtn) {
        evolveBtn.addEventListener('click', executeEvolution);
    }
});

// 初期化
resizeCanvas();
initialize(); 