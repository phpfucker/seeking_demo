/**
 * seek-in（飼育員）プロジェクト
 * 2体の膝形生命体の進化を観察するWebアプリケーション
 * 
 * @file main.js
 * @description 生命体の描画と進化レポートの表示を管理する
 */

// 進化履歴を保存する配列
let evolutionHistory = [];
let currentState = null;

let svgAnimationFrame = null;
let svgAnimationAngle = 0;

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

// SVGコードを描画する
function drawSVG(svgCode, containerId) {
    const svgContainer = document.getElementById(containerId);
    // SVGにidを付与（既存idがなければ）
    let svgWithId = svgCode.replace('<svg ', `<svg id="${containerId}-svg" `);
    svgContainer.innerHTML = svgWithId;
}

// 現在の状態を描画する
function drawCurrentState() {
    // entityA, entityBのSVGをそれぞれ描画
    if (currentState && currentState.entityA && currentState.entityB) {
        drawSVG(currentState.entityA.svg, 'svgContainerA');
        drawSVG(currentState.entityB.svg, 'svgContainerB');
        // アニメーション開始（削除）
        // animateSVG('svgContainerA');
        // animateSVG('svgContainerB');
    }
}

// 進化レポートを表示する
function displayReport(entity, entityName, timestamp = null) {
    if (!entity || !entity.report) return document.createElement('div');
    const report = entity.report;
    const reportElement = document.createElement('div');
    reportElement.className = 'report-card';
    const timeText = timestamp ? new Date(timestamp).toLocaleString('ja-JP') : '初期状態';
    let svgHtml = '';
    if (entity.svg) {
        svgHtml = `<div class="report-svg-thumb">${entity.svg}</div>`;
    }
    reportElement.innerHTML = `
        ${svgHtml}
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
    if (currentState && currentState.entityA && currentState.entityB) {
        reportsList.appendChild(displayReport(currentState.entityA, 'Entity A'));
        reportsList.appendChild(displayReport(currentState.entityB, 'Entity B'));
    }
    evolutionHistory.slice().reverse().forEach(step => {
        if (step.entityA && step.entityB) {
            reportsList.appendChild(displayReport(step.entityA, 'Entity A', step.timestamp));
            reportsList.appendChild(displayReport(step.entityB, 'Entity B', step.timestamp));
        }
    });
}

// ステータス表示を削除
function updateStatus(message) {}

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

function startSVGAnimation() {
    // 完全削除
}

function stopSVGAnimation() {
    // 完全削除
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
initialize();

// ページ遷移や再描画時にアニメーション停止
window.addEventListener('beforeunload', () => {}); 