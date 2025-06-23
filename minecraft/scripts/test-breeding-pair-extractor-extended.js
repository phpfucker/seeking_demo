/**
 * Extended Test for Breeding Pair Extractor (5.2)
 * エッジケース・境界値・エラー処理を含む拡張テスト
 */

const assert = require('assert');
const BreedingPairExtractor = require('./breeding-pair-extractor.js');

/**
 * 拡張テストスイート
 */
class ExtendedBreedingPairExtractorTests {
    constructor() {
        this.extractor = new BreedingPairExtractor();
        this.passedTests = 0;
        this.totalTests = 0;
    }

    async runTest(testName, testFunc) {
        this.totalTests++;
        try {
            await testFunc();
            console.log(`✅ ${testName}`);
            this.passedTests++;
        } catch (error) {
            console.error(`❌ ${testName}: ${error.message}`);
            throw error;
        }
    }

    async runAllTests() {
        console.log('🧪 === 5.2 Breeding Pair Extractor 拡張テスト開始 ===\n');

        // エッジケース
        console.log('=== エッジケーステスト ===');
        
        await this.runTest('空データ：エンティティが0個の場合', async () => {
            const emptyData = { entities: [] };
            const result = this.extractor.loadFormattedData(emptyData);
            assert.strictEqual(result.entities.length, 0);
            
            const pairs = this.extractor.findGenderValidPairs(result.entities);
            assert.strictEqual(pairs.length, 0);
            
            const uniquePairs = this.extractor.extractUniqueBreedingPairs(result.entities);
            assert.strictEqual(uniquePairs.length, 0);
        });

        await this.runTest('単一エンティティ：1個だけの場合', async () => {
            const singleData = {
                entities: [{
                    id: "adam",
                    gender: "male",
                    position: { x: 0, y: 0, z: 0 },
                    behavior: "curious",
                    sociality: "leader",
                    lifespan: 1500
                }]
            };
            
            const result = this.extractor.loadFormattedData(singleData);
            const pairs = this.extractor.findGenderValidPairs(result.entities);
            assert.strictEqual(pairs.length, 0, '単一エンティティではペアができない');
        });

        await this.runTest('性別不明：genderフィールドが無効', async () => {
            const invalidGenderData = {
                entities: [
                    { id: "unknown1", gender: null, position: { x: 0, y: 0, z: 0 } },
                    { id: "unknown2", gender: undefined, position: { x: 1, y: 0, z: 0 } },
                    { id: "unknown3", gender: "invalid", position: { x: 2, y: 0, z: 0 } },
                    { id: "adam", gender: "male", position: { x: 3, y: 0, z: 0 } },
                    { id: "eve", gender: "female", position: { x: 4, y: 0, z: 0 } }
                ]
            };
            
            const result = this.extractor.loadFormattedData(invalidGenderData);
            const pairs = this.extractor.findGenderValidPairs(result.entities);
            assert.strictEqual(pairs.length, 1, '有効な性別のペアのみ抽出される');
            assert.strictEqual(pairs[0].male.id, "adam");
            assert.strictEqual(pairs[0].female.id, "eve");
        });

        await this.runTest('距離境界値：ちょうどmaxDistanceの場合', async () => {
            const boundaryData = {
                entities: [
                    { id: "adam", gender: "male", position: { x: 0, y: 0, z: 0 } },
                    { id: "eve", gender: "female", position: { x: 10, y: 0, z: 0 } } // 距離10
                ]
            };
            
            const result = this.extractor.loadFormattedData(boundaryData);
            
            // 距離10でmaxDistance=10の場合（境界値含む）
            const validPairs = this.extractor.extractUniqueBreedingPairs(result.entities, 10);
            assert.strictEqual(validPairs.length, 1, '境界値は含まれる');
            
            // 距離10でmaxDistance=9.99の場合（境界値除く）
            const invalidPairs = this.extractor.extractUniqueBreedingPairs(result.entities, 9.99);
            assert.strictEqual(invalidPairs.length, 0, '境界値を超える場合は除外');
        });

        await this.runTest('同一座標：距離0の場合', async () => {
            const samePositionData = {
                entities: [
                    { id: "adam", gender: "male", position: { x: 0, y: 0, z: 0 } },
                    { id: "eve", gender: "female", position: { x: 0, y: 0, z: 0 } }
                ]
            };
            
            const result = this.extractor.loadFormattedData(samePositionData);
            const distance = this.extractor.calculateDistance(
                result.entities[0].position,
                result.entities[1].position
            );
            assert.strictEqual(distance, 0, '同一座標では距離0');
            
            const pairs = this.extractor.extractUniqueBreedingPairs(result.entities, 1);
            assert.strictEqual(pairs.length, 1, '距離0は繁殖可能');
            assert.strictEqual(pairs[0].distance, 0);
        });

        // パフォーマンステスト（簡易版）
        console.log('\n=== パフォーマンステスト ===');
        
        await this.runTest('多数ペア：M×N組み合わせ処理', async () => {
            // 5オス × 5メス = 25通りの組み合わせ
            const entities = [];
            for (let i = 0; i < 5; i++) {
                entities.push({
                    id: `male_${i}`,
                    gender: "male",
                    position: { x: i, y: 0, z: 0 },
                    behavior: "curious",
                    sociality: "leader",
                    lifespan: 1500
                });
                entities.push({
                    id: `female_${i}`,
                    gender: "female", 
                    position: { x: i, y: 0, z: 1 },
                    behavior: "passive",
                    sociality: "herd",
                    lifespan: 1500
                });
            }
            
            const largeData = { entities };
            const startTime = Date.now();
            
            const result = await this.extractor.processBreedingPairs(largeData, 5);
            
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            
            console.log(`    処理時間: ${processingTime}ms`);
            assert(processingTime < 1000, '1秒以内に処理完了');
            assert.strictEqual(result.totalPairs, 25, '25通りの組み合わせ');
            assert.strictEqual(result.uniquePairs.length, 5, '5組のユニークペア');
            
            // 各個体が一度だけ使用されることを確認
            const usedMales = new Set();
            const usedFemales = new Set();
            result.uniquePairs.forEach(pair => {
                assert(!usedMales.has(pair.male.id), `Male ${pair.male.id} が重複使用されている`);
                assert(!usedFemales.has(pair.female.id), `Female ${pair.female.id} が重複使用されている`);
                usedMales.add(pair.male.id);
                usedFemales.add(pair.female.id);
            });
        });

        // テスト結果サマリー
        console.log('\n=== 拡張テスト結果サマリー ===');
        console.log(`✅ 成功: ${this.passedTests}/${this.totalTests}`);
        
        if (this.passedTests === this.totalTests) {
            console.log('🎉 すべての拡張テストが成功しました！');
            console.log('📊 カバレッジ: エッジケース、境界値、パフォーマンス');
        } else {
            throw new Error(`${this.totalTests - this.passedTests}個のテストが失敗しました`);
        }
    }
}

// テスト実行
if (require.main === module) {
    const runExtendedTests = async () => {
        try {
            const tests = new ExtendedBreedingPairExtractorTests();
            await tests.runAllTests();
            process.exit(0);
        } catch (error) {
            console.error(`\n❌ 拡張テストスイートが失敗しました: ${error.message}`);
            process.exit(1);
        }
    };

    runExtendedTests();
}

module.exports = ExtendedBreedingPairExtractorTests; 