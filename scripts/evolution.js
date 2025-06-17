/**
 * AI進化機能
 * OpenAI APIを使用して生命体の進化を生成する
 * 
 * @file evolution.js
 * @description AIによる生命体の進化ロジックを管理する
 */

const fs = require('fs').promises;
const path = require('path');

// .envファイルが存在する場合のみ読み込む
try {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        require('dotenv').config();
    }
} catch (error) {
    console.log('Using environment variables directly');
}

const { Configuration, OpenAIApi } = require('openai');

// OpenAI APIの設定
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// 現在の状態を読み込む
async function loadCurrentState() {
    try {
        const data = await fs.readFile(path.join(__dirname, '../data/current-state.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // current-state.jsonがなければinitial-state.jsonを使用
        const data = await fs.readFile(path.join(__dirname, '../data/initial-state.json'), 'utf8');
        return JSON.parse(data);
    }
}

// 進化履歴を読み込む
async function loadEvolutionHistory() {
    try {
        const data = await fs.readFile(path.join(__dirname, '../data/evolution-history.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// 進化履歴を保存する
async function saveEvolutionHistory(history) {
    await fs.writeFile(
        path.join(__dirname, '../data/evolution-history.json'),
        JSON.stringify(history, null, 2)
    );
}

// 現在の状態を保存する
async function saveCurrentState(state) {
    await fs.writeFile(
        path.join(__dirname, '../data/current-state.json'),
        JSON.stringify(state, null, 2)
    );
}

// evolution_prompt.mdからプロンプトを抽出する関数
async function loadPromptFromMarkdown() {
    const promptPath = path.join(__dirname, '../evolution_prompt.md');
    const md = await fs.readFile(promptPath, 'utf8');
    // セクションごとに分割
    const fixedMatch = md.match(/## 固定プロンプト([\s\S]*?)(?=##|$)/);
    const freeMatch = md.match(/## 追加・編集自由プロンプト([\s\S]*?)(?=##|$)/);
    const fixed = fixedMatch ? fixedMatch[1].trim() : '';
    const free = freeMatch ? freeMatch[1].trim() : '';
    return fixed + '\n' + free;
}

// 2体分のSVG＋レポート生成用プロンプト
async function generatePrompt(currentState, history) {
    return await loadPromptFromMarkdown();
}

// 次の進化状態を生成する
async function generateNextEvolution(currentState, history) {
    const prompt = await generatePrompt(currentState, history);
    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an AI that generates the next evolution state for two entities as JSON (SVG+report)."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 2000
        });
        
        // AIの返答内容を出力
        let aiText = response.data.choices[0].message.content;
        console.log('AI JSON response:', aiText);
        // 不要なマークダウン記法を除去
        aiText = aiText.replace(/```json|```svg|```/g, '').trim();
        // JSONパース
        const nextState = JSON.parse(aiText);
        // nameとgenderを必ず引き継ぐ
        nextState.entityA.name = currentState.entityA.name;
        nextState.entityA.gender = currentState.entityA.gender;
        nextState.entityB.name = currentState.entityB.name;
        nextState.entityB.gender = currentState.entityB.gender;
        return nextState;
    } catch (error) {
        console.error('Evolution JSON generation failed:', error);
        return null;
    }
}

// 状態のバリデーション
function validateState(state) {
    const validateCell = (cell) => {
        if (cell.x < 0 || cell.x > 400) throw new Error('Invalid x coordinate');
        if (cell.y < 0 || cell.y > 400) throw new Error('Invalid y coordinate');
        if (cell.radius < 5 || cell.radius > 20) throw new Error('Invalid radius');
        if (cell.color_h < 0 || cell.color_h > 360) throw new Error('Invalid color_h');
        if (cell.shapeFactor < 0 || cell.shapeFactor > 1) throw new Error('Invalid shapeFactor');
    };
    
    state.entityA.cells.forEach(validateCell);
    state.entityB.cells.forEach(validateCell);
}

// メイン処理
async function main() {
    try {
        // 現在の状態と履歴を読み込む
        const currentState = await loadCurrentState();
        const history = await loadEvolutionHistory();
        
        // 次の進化状態を生成
        const nextState = await generateNextEvolution(currentState, history);
        
        if (nextState) {
            // 現在の状態を履歴に追加（SVGも含める）
            history.push({
                ...currentState,
                svg: currentState.svg,
                timestamp: Date.now()
            });
            
            // 履歴を保存
            await saveEvolutionHistory(history);
            
            // 新しい状態を保存
            await saveCurrentState(nextState);
            
            console.log('Evolution completed successfully');
        } else {
            console.error('Evolution generation failed');
        }
    } catch (error) {
        console.error('Error in evolution process:', error);
        process.exit(1);
    }
}

// スクリプトを実行
main(); 