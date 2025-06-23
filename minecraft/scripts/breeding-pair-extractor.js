/**
 * Breeding Pair Extractor (5.2)
 * 繁殖条件を満たしたユニークペアの抽出
 * 
 * 要件:
 * 5.2.1 5.1.2.2で整形されたリアルタイム状態データを利用し、繁殖条件判定の入力とする
 * 5.2.2 読み込んだデータから、各個体の「性別」が「オスとメスのペア」であることを判定するロジックを実装
 * 5.2.3 対象となるオスとメスのペアの「ワールド内座標」を比較し、事前に定義された「接近度（一定距離内）」を満たすかを判定するロジックを実装
 * 5.2.4 上記2つの条件（性別と接近度）を両方満たすペアの中から、重複しないユニークなペア（例: 一度ペアになった個体は、そのサイクルでは他のペアにはならない）を抽出する機能の実装
 */

const fs = require('fs');
const path = require('path');

class BreedingPairExtractor {
    constructor(options = {}) {
        this.dataDir = options.dataDir || './data';
        this.configDir = options.configDir || './config';
        this.defaultBreedingDistance = options.defaultBreedingDistance || 20.0; // デフォルト20ブロック
        this.formattedDataCache = null;
    }

    /**
     * 5.2.1 - 整形されたリアルタイム状態データを読み込む
     * @param {Object} data - 外部から渡されるデータ、またはnullの場合はファイルから読み込み
     * @returns {Object} 読み込まれたデータ
     */
    loadFormattedData(data = null) {
        if (data) {
            // テスト用または外部から渡されたデータを使用
            this.formattedDataCache = data;
            return data;
        }

        // ファイルから読み込み
        const filePath = path.join(this.dataDir, 'formatted_status_data.json');
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`Formatted data file not found: ${filePath}`);
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(fileContent);
        
        this.formattedDataCache = parsedData;
        return parsedData;
    }

    /**
     * 5.2.2 - 性別判定ロジック（オスとメスのペア）
     * @param {Array} entities - エンティティリスト
     * @returns {Array} 性別的に有効なペアの配列
     */
    findGenderValidPairs(entities) {
        const males = entities.filter(entity => entity.gender === 'male');
        const females = entities.filter(entity => entity.gender === 'female');
        
        const pairs = [];
        
        for (const male of males) {
            for (const female of females) {
                pairs.push({ male, female });
            }
        }
        
        return pairs;
    }

    /**
     * 5.2.3 - 接近度判定ロジック
     * @param {Object} pos1 - 位置1 {x, y, z}
     * @param {Object} pos2 - 位置2 {x, y, z}
     * @returns {Number} 2点間の距離
     */
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * ペアが繁殖距離内にいるかを判定
     * @param {Object} pair - {male, female}のペア
     * @param {Number} maxDistance - 最大距離
     * @returns {Boolean} 距離内にいるかどうか
     */
    isWithinBreedingDistance(pair, maxDistance) {
        const distance = this.calculateDistance(pair.male.position, pair.female.position);
        return distance <= maxDistance;
    }

    /**
     * 5.2.4 - ユニークペア抽出機能
     * @param {Array} entities - エンティティリスト
     * @param {Number} maxDistance - 繁殖可能最大距離
     * @returns {Array} ユニークなペアの配列
     */
    extractUniqueBreedingPairs(entities, maxDistance = this.defaultBreedingDistance) {
        // 5.2.2: 性別的に有効なペアを取得
        const genderValidPairs = this.findGenderValidPairs(entities);
        
        // 5.2.3: 距離でフィルタリング
        const distanceValidPairs = genderValidPairs.filter(pair => 
            this.isWithinBreedingDistance(pair, maxDistance)
        );

        // 距離を計算して追加
        const pairsWithDistance = distanceValidPairs.map(pair => ({
            ...pair,
            distance: this.calculateDistance(pair.male.position, pair.female.position)
        }));

        // 距離でソート（近い順）
        pairsWithDistance.sort((a, b) => a.distance - b.distance);

        // 5.2.4: 重複しないユニークなペアを抽出
        const usedMaleIds = new Set();
        const usedFemaleIds = new Set();
        const uniquePairs = [];

        for (const pair of pairsWithDistance) {
            const maleId = pair.male.id;
            const femaleId = pair.female.id;

            // 既に使用されている個体はスキップ
            if (usedMaleIds.has(maleId) || usedFemaleIds.has(femaleId)) {
                continue;
            }

            // ペアとして採用
            uniquePairs.push(pair);
            usedMaleIds.add(maleId);
            usedFemaleIds.add(femaleId);
        }

        return uniquePairs;
    }

    /**
     * 5.2.5.1 - current_entity_status.jsonから特性データを取得
     * @returns {Object} エンティティID をキーとした特性データマップ
     */
    loadCharacteristicsData() {
        const filePath = path.join(this.configDir, 'current_entity_status.json');
        
        if (!fs.existsSync(filePath)) {
            console.warn(`Warning: Current entity status file not found: ${filePath}`);
            return {};
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const entityStatusData = JSON.parse(fileContent);
            
            // データ構造を判定（配列またはentitiesプロパティを持つオブジェクト）
            let entityStatusList;
            if (Array.isArray(entityStatusData)) {
                entityStatusList = entityStatusData;
            } else if (entityStatusData.entities && Array.isArray(entityStatusData.entities)) {
                entityStatusList = entityStatusData.entities;
            } else {
                console.warn('Warning: Invalid entity status data structure');
                return {};
            }
            
            // IDをキーとしたマップに変換
            const characteristicsMap = {};
            entityStatusList.forEach(entity => {
                if (entity.entity_id) {
                    characteristicsMap[entity.entity_id] = {
                        behavior: entity.behavior || null,
                        sociality: entity.sociality || null,
                        lifespan: entity.lifespan || null
                    };
                }
            });
            
            console.log(`✓ Loaded characteristics data for ${Object.keys(characteristicsMap).length} entities`);
            return characteristicsMap;
        } catch (error) {
            console.warn(`Warning: Failed to load characteristics data: ${error.message}`);
            return {};
        }
    }

    /**
     * 5.2.5.2 - ペアの親に詳細特性情報を補完
     * @param {Array} pairs - 抽出されたペアリスト
     * @param {Object} characteristicsMap - 特性データマップ
     * @returns {Array} 特性データが補完されたペアリスト
     */
    enhancePairsWithCharacteristics(pairs, characteristicsMap) {
        console.log('>> Enhancing pairs with characteristics data...');
        
        const enhancedPairs = pairs.map(pair => {
            const enhancedPair = { ...pair };
            
            // Male の特性データ補完
            const maleCharacteristics = characteristicsMap[pair.male.id] || {};
            enhancedPair.male = {
                ...pair.male,
                behavior: maleCharacteristics.behavior || null,
                sociality: maleCharacteristics.sociality || null,
                lifespan: maleCharacteristics.lifespan || null
            };
            
            // Female の特性データ補完
            const femaleCharacteristics = characteristicsMap[pair.female.id] || {};
            enhancedPair.female = {
                ...pair.female,
                behavior: femaleCharacteristics.behavior || null,
                sociality: femaleCharacteristics.sociality || null,
                lifespan: femaleCharacteristics.lifespan || null
            };
            
            return enhancedPair;
        });
        
        console.log(`✓ Enhanced ${enhancedPairs.length} pairs with characteristics data`);
        return enhancedPairs;
    }

    /**
     * メイン処理関数 - 統合的な繁殖ペア処理
     * @param {Object} inputData - 入力データ（nullの場合はファイルから読み込み）
     * @param {Number} maxDistance - 繁殖可能最大距離
     * @returns {Object} 処理結果
     */
    async processBreedingPairs(inputData = null, maxDistance = this.defaultBreedingDistance) {
        console.log('=== 5.2 Breeding Pair Extraction Started ===');

        // 5.2.1: データ読み込み
        console.log('>> Loading formatted data...');
        const formattedData = this.loadFormattedData(inputData);
        const entities = formattedData.entities;
        console.log(`✓ Loaded ${entities.length} entity data`);

        // 5.2.2: 性別判定
        console.log('>> Executing gender validation...');
        const genderValidPairs = this.findGenderValidPairs(entities);
        console.log(`✓ Gender-valid pairs: ${genderValidPairs.length}`);

        // 5.2.3: 距離判定
        console.log(`>> Executing distance validation (max: ${maxDistance} blocks)...`);
        const distanceValidPairs = genderValidPairs.filter(pair => 
            this.isWithinBreedingDistance(pair, maxDistance)
        );
        console.log(`✓ Distance-valid pairs: ${distanceValidPairs.length}`);

        // 5.2.4: ユニークペア抽出
        console.log('>> Executing unique pair extraction...');
        const uniquePairs = this.extractUniqueBreedingPairs(entities, maxDistance);
        console.log(`✓ Final unique pairs: ${uniquePairs.length}`);

        // 5.2.5: 特性データ補完
        console.log('>> Loading characteristics data for enhancement...');
        const characteristicsMap = this.loadCharacteristicsData();
        const enhancedPairs = this.enhancePairsWithCharacteristics(uniquePairs, characteristicsMap);

        // 結果の詳細出力
        console.log('\n=== Enhanced Pair Details ===');
        enhancedPairs.forEach((pair, index) => {
            console.log(`[${index + 1}] ${pair.male.id} (M) x ${pair.female.id} (F)`);
            console.log(`    Distance: ${pair.distance.toFixed(2)} blocks`);
            console.log(`    Male: behavior=${pair.male.behavior}, sociality=${pair.male.sociality}, lifespan=${pair.male.lifespan}`);
            console.log(`    Female: behavior=${pair.female.behavior}, sociality=${pair.female.sociality}, lifespan=${pair.female.lifespan}`);
            console.log(`    Male pos: (${pair.male.position.x.toFixed(2)}, ${pair.male.position.y}, ${pair.male.position.z.toFixed(2)})`);
            console.log(`    Female pos: (${pair.female.position.x.toFixed(2)}, ${pair.female.position.y}, ${pair.female.position.z.toFixed(2)})`);
        });

        const result = {
            totalEntities: entities.length,
            totalPairs: genderValidPairs.length,
            distanceValidPairs: distanceValidPairs.length,
            uniquePairs: enhancedPairs,
            maxDistance: maxDistance,
            processedAt: new Date().toISOString()
        };

        // 結果を保存
        await this.saveBreedingPairsResult(result);

        console.log('\n=== 5.2 Breeding Pair Extraction Complete ===');
        return result;
    }

    /**
     * 繁殖ペア抽出結果をファイルに保存
     * @param {Object} result - 処理結果
     */
    async saveBreedingPairsResult(result) {
        const outputPath = path.join(this.dataDir, 'breeding_pairs_result.json');
        
        // データディレクトリが存在しない場合は作成
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`✓ Result saved: ${outputPath}`);
    }

    /**
     * デバッグ情報を出力
     */
    debugPrint() {
        console.log('=== Debug Information ===');
        console.log(`Data directory: ${this.dataDir}`);
        console.log(`Config directory: ${this.configDir}`);
        console.log(`Default breeding distance: ${this.defaultBreedingDistance} blocks`);
        console.log(`Cached data: ${this.formattedDataCache ? 'Available' : 'None'}`);
    }
}

// 直接実行された場合
if (require.main === module) {
    const extractor = new BreedingPairExtractor();
    
    // コマンドライン引数の処理
    const args = process.argv.slice(2);
    const debugMode = args.includes('--debug');
    const distanceArg = args.find(arg => arg.startsWith('--distance='));
    const maxDistance = distanceArg ? distanceArg.split('=')[1] : 20;

    const runExtraction = async () => {
        try {
            if (debugMode) {
                extractor.debugPrint();
            }

            const result = await extractor.processBreedingPairs(null, parseFloat(maxDistance));
            
            console.log('\n📋 === 実行完了 ===');
            console.log(`✅ ${result.uniquePairs.length}組のユニークペアを抽出しました`);
            
        } catch (error) {
            console.error('❌ 処理中にエラーが発生しました:', error.message);
            if (debugMode) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    };

    runExtraction();
}

module.exports = BreedingPairExtractor; 