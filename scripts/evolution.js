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
    return `あなたは2体の想像上の生命体（entityA, entityB）の進化を、SVGイラストと進化レポートとして生成するAIです。
以下の要件をすべて満たすJSONを日本語で生成してください：

- entityA, entityBそれぞれについて、<svg ...>...</svg>形式のSVGコードを生成してください
- SVGは必ずviewBox=\"0 0 400 400\"内に全身（体・顔・手足・しっぽ・角・模様など）を大きく中央に描いてください
- 顔だけのキャラクターは禁止。必ず体・手足・しっぽ・角・模様など複数のパーツを含めてください
- 目・口・手足・体・模様・しっぽ・角など各パーツにはidまたはclass属性を付与してください
- フレームや背景は動かさず、生命体のパーツのみを描画してください
- 多様な模様・色・形状・パーツを使い、イラストや写真のような生き物らしさ・複雑さ・有機的な形を重視してください
- 実在の動物・昆虫・魚・空想生物・複合生物（例：ケンタウロス、ユニコーン、馬の足＋魚の頭＋シマウマの模様＋ピカチュウのしっぽ等）を参考にしても構いません
- 進化ごとにパーツ・模様・色・形・大きさ・配置が必ず変化し、前回の特徴を一部引き継ぎつつ新しい特徴を加えてください
- できるだけイラストや写真のような生き物らしい表現を目指してください
- 単純な図形だけでなく、曲線・複雑なパーツ・模様・表情・手足・しっぽ・角などを必ず含めてください
- 参考画像：[BRUTUS生物イラスト例](https://media.brutus.jp/wp-content/uploads/2023/02/8dd59338902d132e8ac8dd69d8ba72d6.jpg)、[Pixivオリジナルモンスター特集](https://embed.pixiv.net/spotlight.php?id=1373&lang=ja)、ポケモン・デジモン・モンスターハンター等

以下のJSON形式で、必ず日本語で出力してください（マークダウンや説明文は不要）：
{
  "entityA": {
    "svg": "<svg ...>...</svg>",
    "report": {
      "appearance": "現在の姿の詳細な日本語説明",
      "reason": "なぜこの進化が起こったのかの日本語理由",
      "thought": "生命体の内面や感情を表す日本語の一言（『』で囲む）"
    }
  },
  "entityB": {
    "svg": "<svg ...>...</svg>",
    "report": {
      "appearance": "現在の姿の詳細な日本語説明",
      "reason": "なぜこの進化が起こったのかの日本語理由",
      "thought": "生命体の内面や感情を表す日本語の一言（『』で囲む）"
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