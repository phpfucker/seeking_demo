const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');

// .envファイルを読み込む
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

class ChatGPTEvolutionProcessor {
    constructor(options = {}) {
        if (options.mockOpenAI) {
            this.openai = options.mockOpenAI;
        } else {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
    }

    validateRequestData(data) {
        // 必須フィールドの存在チェック
        const requiredFields = ['breeding_pairs', 'available_entities', 'genetics_rules'];
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`${field} is required`);
            }
        }

        // breeding_pairsの構造チェック
        if (!Array.isArray(data.breeding_pairs)) {
            throw new Error('breeding_pairs must be an array');
        }

        for (const pair of data.breeding_pairs) {
            if (!pair.male || !pair.female) {
                throw new Error('Each breeding pair must have male and female');
            }

            // 親の必須フィールドチェック
            const parentFields = ['id', 'dna', 'behavior', 'sociality', 'lifespan'];
            for (const field of parentFields) {
                if (!pair.male[field] || !pair.female[field]) {
                    throw new Error(`Parent must have ${field}`);
                }
            }
        }
    }

    validateResponseData(response) {
        if (!response.breeding_results || !Array.isArray(response.breeding_results)) {
            throw new Error('Response must have breeding_results array');
        }

        for (const result of response.breeding_results) {
            if (!result.children || !Array.isArray(result.children)) {
                throw new Error('Each breeding result must have children array');
            }

            for (const child of result.children) {
                const requiredFields = [
                    'entity_id',
                    'name',
                    'gender',
                    'parent_ids',
                    'generation',
                    'dna',
                    'selected_entity',
                    'behavior',
                    'sociality',
                    'lifespan'
                ];

                for (const field of requiredFields) {
                    if (!child[field]) {
                        throw new Error(`Required field missing in response: ${field}`);
                    }
                }

                // 特定フィールドの型チェック
                if (!Array.isArray(child.dna)) {
                    throw new Error('DNA must be an array');
                }
                if (!Array.isArray(child.parent_ids)) {
                    throw new Error('parent_ids must be an array');
                }
                if (typeof child.generation !== 'number') {
                    throw new Error('generation must be a number');
                }
            }
        }
    }

    async processEvolution(requestData) {
        try {
            // リクエストデータの検証
            this.validateRequestData(requestData);

            // ChatGPT APIに送信するメッセージを構築
            const messages = [
                {
                    role: "system",
                    content: `あなたは生命進化シミュレーターです。以下のルールに従って子孫を生成してください：

1. 親のDNAを組み合わせて新しいDNAを生成（配列形式）
2. 親の特性（behavior, sociality, lifespan）を考慮して子の特性を決定
3. 利用可能なエンティティタイプから適切なものを選択
4. 管理者からの指示がある場合はそれに従う

必ず以下のJSON形式で応答してください：
{
  "breeding_results": [
    {
      "children": [
        {
          "entity_id": "child_001",
          "name": "子供の名前",
          "gender": "male または female",
          "parent_ids": ["親1のID", "親2のID"],
          "generation": 世代番号,
          "dna": ["A","T","G","C",...],
          "selected_entity": "エンティティタイプ",
          "behavior": "行動特性",
          "sociality": "社会性",
          "lifespan": 寿命の数値
        }
      ]
    }
  ]
}

他の形式での応答は無効です。JSONのみで応答してください。`
                },
                {
                    role: "user",
                    content: JSON.stringify(requestData)
                }
            ];

            // ChatGPT APIを呼び出し
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            });

            // レスポンスをパース
            const responseContent = completion.choices[0].message.content;
            console.log('Raw ChatGPT response:', responseContent);
            
            let response;
            try {
                response = JSON.parse(responseContent);
            } catch (parseError) {
                throw new Error(`Failed to parse ChatGPT response as JSON: ${parseError.message}\nResponse: ${responseContent}`);
            }

            // レスポンスデータの検証
            this.validateResponseData(response);

            return response;

        } catch (error) {
            if (error.error) {
                throw new Error(`OpenAI API error: ${error.error.message}`);
            } else {
                throw error;
            }
        }
    }

    async saveEvolutionResult(result) {
        try {
            // 保存先ディレクトリの確認と作成
            const dataDir = path.join(__dirname, 'data');
            await fs.mkdir(dataDir, { recursive: true });

            // 結果をファイルに保存
            await fs.writeFile(
                path.join(dataDir, 'evolution_result.json'),
                JSON.stringify(result, null, 2),
                'utf8'
            );
        } catch (error) {
            throw new Error(`Failed to save evolution result: ${error.message}`);
        }
    }
}

module.exports = { ChatGPTEvolutionProcessor }; 