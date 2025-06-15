/**
 * AI進化機能
 * OpenAI APIを使用して生命体の進化を生成する
 * 
 * @file evolution.js
 * @description AIによる生命体の進化ロジックを管理する
 */

const fs = require('fs').promises;
const path = require('path');
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

// 2体分のSVG＋レポート生成用プロンプト
function generatePrompt(currentState, history) {
    return `You are an AI that generates the evolution of two imaginary life forms (entityA, entityB) as SVG illustrations and evolution reports.
Please generate JSON that meets the following requirements:

- For each entityA and entityB, generate SVG code (<svg ...>...</svg>)
- Each SVG must be drawn within a 400x400 viewBox, and the entire body (body, face, arms, legs, tail, horns, etc.) must be large and centered within the viewBox (0-400, 0-400)
- Characters with only a face are prohibited. The SVG must always include body, arms, legs, tail, horns, or other parts in addition to the face
- Each part (eyes, mouth, arms, legs, body, patterns, tail, horns, etc.) must have id or class attributes for easy animation control
- Do not animate or move the frame or background; only the lifeform parts should move
- Use a variety of patterns and colors
- You may reference real animals, insects, fish, or create completely original creatures
- With each evolution, parts, patterns, colors, shapes, and sizes should change gradually, inheriting features from the previous form (continuity)
- The body size may also change
- Aim for as organic and biological a shape as possible
- It is acceptable for the overall appearance to change significantly with each evolution, but always inherit some features from the previous form
- Reference images: [BRUTUS creature illustration example](https://media.brutus.jp/wp-content/uploads/2023/02/8dd59338902d132e8ac8dd69d8ba72d6.jpg), [Pixiv original monster feature](https://embed.pixiv.net/spotlight.php?id=1373&lang=ja), creatures like Pokemon, Digimon, Monster Hunter
- Do not use only simple shapes; use lines, curves, complex parts, patterns, facial expressions, arms, legs, tails, horns, etc. to make it look like an illustration or character

Return the following JSON format (no markdown or explanations):
{
  "entityA": {
    "svg": "<svg ...>...</svg>",
    "report": {
      "appearance": "Description of current appearance",
      "reason": "Reason for this evolution",
      "thought": "Description of inner thoughts"
    }
  },
  "entityB": {
    "svg": "<svg ...>...</svg>",
    "report": {
      "appearance": "Description of current appearance",
      "reason": "Reason for this evolution",
      "thought": "Description of inner thoughts"
    }
  }
}`;
}

// 次の進化状態を生成する
async function generateNextEvolution(currentState, history) {
    const prompt = generatePrompt(currentState, history);
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