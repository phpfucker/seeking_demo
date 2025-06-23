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
5. 名前は英語の人名（例：Alex, Emma, Charlie, Sophie等）を使用してください

必ず以下のJSON形式で応答してください：
{
  "breeding_results": [
    {
      "children": [
        {
          "entity_id": "child_001",
          "name": "英語の人名（例：Alex, Charlie, Emma等）",
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
                // ChatGPTが返すJSONコードブロック（```json ... ```）を除去
                let cleanedContent = responseContent.trim();
                
                // コードブロックのマーカーを除去
                if (cleanedContent.startsWith('```json')) {
                    cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (cleanedContent.startsWith('```')) {
                    cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                
                console.log('Cleaned ChatGPT response:', cleanedContent);
                response = JSON.parse(cleanedContent);
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

/**
 * 本番実行用クラス
 */
class ChatGPTEvolutionRunner {
    constructor() {
        this.processor = new ChatGPTEvolutionProcessor();
        this.dataDir = path.join(__dirname, 'data');
    }

    async loadRequestData() {
        try {
            const filePath = path.join(this.dataDir, 'ai_request_data.json');
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Failed to load request data: ${error.message}`);
        }
    }

    async execute() {
        console.log('🚀 === ChatGPT Evolution Processing Start ===');
        
        try {
            // 1. リクエストデータの読み込み
            console.log('📁 Loading AI request data...');
            const requestData = await this.loadRequestData();
            console.log(`✅ Loaded data with ${requestData.breeding_pairs.length} breeding pairs`);

            // 2. ChatGPTとの連携実行
            console.log('🤖 Processing evolution with ChatGPT...');
            const startTime = Date.now();
            
            const result = await this.processor.processEvolution(requestData);
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`✅ ChatGPT processing completed in ${duration}s`);

            // 3. 結果の保存
            console.log('💾 Saving evolution result...');
            await this.processor.saveEvolutionResult(result);
            console.log('✅ Result saved to data/evolution_result.json');

            // 4. 結果サマリーの表示
            this.displayResultSummary(result);

            console.log('\n🎉 === ChatGPT Evolution Processing Complete ===');
            return result;

        } catch (error) {
            console.error('❌ ChatGPT evolution processing failed:', error.message);
            process.exit(1);
        }
    }

    displayResultSummary(result) {
        console.log('\n📊 === Evolution Results Summary ===');
        
        if (result.breeding_results && result.breeding_results.length > 0) {
            let totalChildren = 0;
            
            result.breeding_results.forEach((breedingResult, index) => {
                const children = breedingResult.children || [];
                totalChildren += children.length;
                
                console.log(`\nBreeding Pair ${index + 1}:`);
                children.forEach((child, childIndex) => {
                    console.log(`  Child ${childIndex + 1}:`);
                    console.log(`    - ID: ${child.entity_id}`);
                    console.log(`    - Name: ${child.name}`);
                    console.log(`    - Gender: ${child.gender}`);
                    console.log(`    - Entity Type: ${child.selected_entity}`);
                    console.log(`    - Behavior: ${child.behavior}`);
                    console.log(`    - Sociality: ${child.sociality}`);
                    console.log(`    - Lifespan: ${child.lifespan}`);
                    console.log(`    - Parents: ${child.parent_ids.join(', ')}`);
                    console.log(`    - Generation: ${child.generation}`);
                    console.log(`    - DNA Length: ${child.dna.length}`);
                });
            });
            
            console.log(`\nTotal new entities created: ${totalChildren}`);
        } else {
            console.log('No breeding results found');
        }
    }

    async checkEnvironment() {
        const checks = [];
        
        // OpenAI API Keyチェック
        if (process.env.OPENAI_API_KEY) {
            checks.push('✅ OPENAI_API_KEY is set');
        } else {
            checks.push('❌ OPENAI_API_KEY is missing');
        }
        
        // リクエストデータファイルチェック
        try {
            const filePath = path.join(this.dataDir, 'ai_request_data.json');
            await fs.access(filePath);
            checks.push('✅ ai_request_data.json exists');
        } catch {
            checks.push('❌ ai_request_data.json is missing');
        }
        
        // .envファイルチェック
        try {
            const envPath = path.join(__dirname, '..', '.env');
            await fs.access(envPath);
            checks.push('✅ .env file exists');
        } catch {
            checks.push('❌ .env file is missing');
        }
        
        console.log('🔍 === Environment Check ===');
        checks.forEach(check => console.log(check));
        
        const hasErrors = checks.some(check => check.startsWith('❌'));
        if (hasErrors) {
            console.log('\n❌ Environment check failed. Please fix the issues above.');
            process.exit(1);
        }
        
        console.log('✅ Environment check passed\n');
    }
}

// 直接実行された場合
if (require.main === module) {
    const runner = new ChatGPTEvolutionRunner();
    
    // 環境チェック後に実行
    runner.checkEnvironment()
        .then(() => runner.execute())
        .catch(error => {
            console.error('Fatal error:', error.message);
            process.exit(1);
        });
}

module.exports = { ChatGPTEvolutionProcessor, ChatGPTEvolutionRunner }; 