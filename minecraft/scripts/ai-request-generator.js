const fs = require('fs');
const path = require('path');

/**
 * 5.3.1 AI Request Generator
 * ChatGPT API送信用の最適化されたJSONデータを生成する
 * 
 * 機能:
 * - breeding_pairs_result.jsonから親ペア情報を抽出
 * - models_skins_animations.jsonから利用可能エンティティリストを抽出
 * - トークン節約のため不要なデータを除外
 * - 距離順ソートでペア優先度を設定
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */
class AiRequestGenerator {
    
    /**
     * AiRequestGeneratorコンストラクタ
     */
    constructor() {
        this.configDir = path.join(__dirname, '../config');
        this.dataDir = path.join(__dirname, 'data');
    }

    /**
     * 5.3.1.1 breeding_pairs_result.jsonから繁殖ペアの親情報を抽出
     * 
     * @returns {Array} 抽出された親ペア情報の配列
     * @throws {Error} ファイルが見つからない、または構造が不正な場合
     */
    extractBreedingPairInfo() {
        const breedingPairsPath = path.join(this.dataDir, 'breeding_pairs_result.json');
        
        if (!fs.existsSync(breedingPairsPath)) {
            throw new Error(`breeding_pairs_result.json not found: ${breedingPairsPath}`);
        }

        const breedingData = JSON.parse(fs.readFileSync(breedingPairsPath, 'utf8'));
        
        if (!breedingData.uniquePairs || !Array.isArray(breedingData.uniquePairs)) {
            throw new Error('Invalid breeding_pairs_result.json structure: uniquePairs array not found');
        }

        console.log(`[AiRequestGenerator] 繁殖ペアデータを読み込みました: ${breedingData.uniquePairs.length}組のペア`);

        return breedingData.uniquePairs.map(pair => ({
            male: this.extractParentInfo(pair.male),
            female: this.extractParentInfo(pair.female),
            distance: pair.distance
        }));
    }

    /**
     * 5.3.1.2 親データから必要最小限の情報を抽出してトークン節約
     * 
     * 抽出する項目: id, gender, dna, behavior, sociality, lifespan
     * 除外する項目: position, health, age, entity_type, max_health
     * 
     * @param {Object} parentData 親の完全なデータ
     * @returns {Object} ChatGPT送信用に最適化された親データ
     */
    extractParentInfo(parentData) {
        const extracted = {
            id: parentData.id,
            gender: parentData.gender,
            dna: parentData.dna
        };

        // 特性データの抽出（存在する場合のみ）
        if (parentData.behavior) extracted.behavior = parentData.behavior;
        if (parentData.sociality) extracted.sociality = parentData.sociality;
        if (parentData.lifespan) extracted.lifespan = parentData.lifespan;

        return extracted;
    }

    /**
     * 5.3.2.1 models_skins_animations.jsonから利用可能エンティティ名リストを抽出
     * 
     * @returns {Array} エンティティ名のみの配列（トークン節約のため詳細パス情報除外）
     * @throws {Error} ファイルが見つからない、または構造が不正な場合
     */
    extractAvailableEntities() {
        const entitiesPath = path.join(this.configDir, 'models_skins_animations.json');
        
        if (!fs.existsSync(entitiesPath)) {
            throw new Error(`models_skins_animations.json not found: ${entitiesPath}`);
        }

        const entitiesData = JSON.parse(fs.readFileSync(entitiesPath, 'utf8'));
        
        if (!entitiesData.entities || !Array.isArray(entitiesData.entities)) {
            throw new Error('Invalid models_skins_animations.json structure: entities array not found');
        }

        // エンティティ名のみを抽出（model, texture, animationパス情報は除外）
        const entityNames = entitiesData.entities.map(entity => entity.name);
        
        console.log(`[AiRequestGenerator] 利用可能エンティティリストを抽出しました: ${entityNames.length}種類`);
        
        return entityNames;
    }

    /**
     * 5.3.1.3 複数ペア対応した配列構造でのデータ整理
     * 5.3.1.4 距離が近いペアを優先した並び替え機能
     * 
     * @returns {Object} ChatGPT送信用の完全なリクエストデータ
     * @throws {Error} データ生成中にエラーが発生した場合
     */
    generateAiRequestData() {
        console.log('[AiRequestGenerator] === ChatGPT送信用データ生成開始 ===');

        // Step 1: 繁殖ペア情報の抽出
        const breedingPairs = this.extractBreedingPairInfo();
        
        // Step 2: 利用可能エンティティ情報の抽出
        const availableEntities = this.extractAvailableEntities();
        
        // Step 3: 距離順でのソート（近い順）
        const sortedPairs = breedingPairs.sort((a, b) => a.distance - b.distance);
        
        // Step 4: ChatGPT送信用データの構築
        const requestData = {
            breeding_pairs: sortedPairs,
            available_entities: availableEntities,
            genetics_rules: {
                crossover_rate: 0.7,
                mutation_rate: 0.1,
                generation: 2
            },
            metadata: {
                total_pairs: sortedPairs.length,
                entity_types_count: availableEntities.length,
                generated_at: new Date().toISOString()
            }
        };

        console.log('[AiRequestGenerator] === データ生成完了 ===');
        console.log(`[AiRequestGenerator] 繁殖ペア数: ${requestData.breeding_pairs.length}`);
        console.log(`[AiRequestGenerator] 利用可能エンティティ数: ${requestData.available_entities.length}`);
        
        return requestData;
    }

    /**
     * 生成されたリクエストデータをファイルに保存
     * 
     * @param {string} outputPath 出力ファイルパス（オプション）
     * @returns {Object} 保存結果情報
     * @throws {Error} ファイル保存中にエラーが発生した場合
     */
    saveRequestData(outputPath = null) {
        const requestData = this.generateAiRequestData();
        const filePath = outputPath || path.join(this.dataDir, 'ai_request_data.json');
        
        fs.writeFileSync(filePath, JSON.stringify(requestData, null, 2), 'utf8');
        
        console.log(`[AiRequestGenerator] ChatGPT送信用データを保存しました: ${filePath}`);
        console.log(`[AiRequestGenerator] ファイルサイズ: ${this.getFileSizeKB(filePath)} KB`);
        
        return {
            filePath,
            data: requestData,
            sizeKB: this.getFileSizeKB(filePath)
        };
    }

    /**
     * ファイルサイズをKB単位で取得
     * 
     * @param {string} filePath ファイルパス
     * @returns {number} ファイルサイズ（KB、小数点第2位まで）
     */
    getFileSizeKB(filePath) {
        const stats = fs.statSync(filePath);
        return Math.round(stats.size / 1024 * 100) / 100;
    }
}

// メイン実行部分（スクリプトとして直接実行された場合）
if (require.main === module) {
    try {
        const generator = new AiRequestGenerator();
        const result = generator.saveRequestData();
        
        console.log('\n=== 5.3.1 実行結果 ===');
        console.log(`出力ファイル: ${result.filePath}`);
        console.log(`データサイズ: ${result.sizeKB} KB`);
        console.log(`繁殖ペア数: ${result.data.breeding_pairs.length}`);
        console.log(`利用可能エンティティ数: ${result.data.available_entities.length}`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n=== 5.3.1 実行エラー ===');
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = AiRequestGenerator;
