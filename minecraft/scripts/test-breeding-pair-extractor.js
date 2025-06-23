/**
 * Test for Breeding Pair Extractor (5.2)
 * 繁殖条件を満たしたユニークペアの抽出機能のテスト
 */

const assert = require('assert');
const BreedingPairExtractor = require('./breeding-pair-extractor.js');

/**
 * 簡易テストランナークラス
 */
class BreedingPairExtractorTests {
    constructor() {
        this.extractor = new BreedingPairExtractor();
        this.passedTests = 0;
        this.totalTests = 0;
    }

    /**
     * テスト実行ヘルパー
     */
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
        console.log('🧪 === 5.2 Breeding Pair Extractor テスト実行中 ===\n');

        // 5.2.1 テスト
        console.log('=== 5.2.1: 整形されたリアルタイム状態データの利用 ===');
        await this.runTest('formatted_status_data.jsonを正しく読み込む', async () => {
            const testData = {
                entities: [
                    {
                        id: "adam",
                        gender: "male",
                        position: { x: 25.4, y: 66, z: 10.8 },
                        dna: ["A", "C", "G", "T"],
                        behavior: "curious",
                        sociality: "leader",
                        lifespan: 1500
                    },
                    {
                        id: "eve",
                        gender: "female",
                        position: { x: 29.7, y: 69, z: 29.3 },
                        dna: ["T", "G", "C", "A"],
                        behavior: "passive",
                        sociality: "herd",
                        lifespan: 1500
                    }
                ]
            };

            const result = this.extractor.loadFormattedData(testData);
            assert.strictEqual(result.entities.length, 2);
            assert.strictEqual(result.entities[0].id, "adam");
            assert.strictEqual(result.entities[1].id, "eve");
            // 特性データが正しく含まれていることを確認
            assert.strictEqual(result.entities[0].behavior, "curious");
            assert.strictEqual(result.entities[0].sociality, "leader");
            assert.strictEqual(result.entities[0].lifespan, 1500);
            assert.strictEqual(result.entities[1].behavior, "passive");
            assert.strictEqual(result.entities[1].sociality, "herd");
            assert.strictEqual(result.entities[1].lifespan, 1500);
        });

        // 5.2.2 テスト
        console.log('\n=== 5.2.2: 性別判定ロジック ===');
        await this.runTest('オスとメスのペアを正しく判定する', async () => {
            const entities = [
                { id: "adam", gender: "male" },
                { id: "eve", gender: "female" },
                { id: "cain", gender: "male" }
            ];

            const pairs = this.extractor.findGenderValidPairs(entities);
            assert.strictEqual(pairs.length, 2); // adam-eve, cain-eve
            assert.strictEqual(pairs[0].male.id, "adam");
            assert.strictEqual(pairs[0].female.id, "eve");
            assert.strictEqual(pairs[1].male.id, "cain");
            assert.strictEqual(pairs[1].female.id, "eve");
        });

        await this.runTest('同性同士はペアにならない', async () => {
            const entities = [
                { id: "adam", gender: "male" },
                { id: "cain", gender: "male" }
            ];

            const pairs = this.extractor.findGenderValidPairs(entities);
            assert.strictEqual(pairs.length, 0);
        });

        // 5.2.3 テスト
        console.log('\n=== 5.2.3: 接近度判定ロジック ===');
        await this.runTest('接近度（一定距離内）を正しく判定する', async () => {
            const pair = {
                male: { position: { x: 0, y: 0, z: 0 } },
                female: { position: { x: 3, y: 4, z: 0 } }
            };

            const distance = this.extractor.calculateDistance(pair.male.position, pair.female.position);
            assert.strictEqual(distance, 5); // 3-4-5の直角三角形

            // 接近度判定（10ブロック以内）
            assert.strictEqual(this.extractor.isWithinBreedingDistance(pair, 10), true);
            assert.strictEqual(this.extractor.isWithinBreedingDistance(pair, 3), false);
        });

        await this.runTest('adamとeveの実際の距離を計算する', async () => {
            const adamPos = { x: 25.40065086453803, y: 66, z: 10.78052563380174 };
            const evePos = { x: 29.741067650081316, y: 69, z: 29.268909836088433 };

            const distance = this.extractor.calculateDistance(adamPos, evePos);
            assert(distance > 18 && distance < 25, `Expected distance between 18-25, got ${distance}`);
        });

        // 5.2.4 テスト
        console.log('\n=== 5.2.4: ユニークペア抽出機能 ===');
        await this.runTest('重複しないユニークなペアを抽出する', async () => {
            const entities = [
                { id: "adam", gender: "male", position: { x: 0, y: 0, z: 0 } },
                { id: "eve", gender: "female", position: { x: 1, y: 0, z: 0 } },
                { id: "cain", gender: "male", position: { x: 2, y: 0, z: 0 } },
                { id: "abel", gender: "female", position: { x: 3, y: 0, z: 0 } }
            ];

            const uniquePairs = this.extractor.extractUniqueBreedingPairs(entities, 5);
            
            // 各個体は一度だけペアになる
            const usedIds = new Set();
            uniquePairs.forEach(pair => {
                assert(!usedIds.has(pair.male.id), `Male ${pair.male.id} is used multiple times`);
                assert(!usedIds.has(pair.female.id), `Female ${pair.female.id} is used multiple times`);
                usedIds.add(pair.male.id);
                usedIds.add(pair.female.id);
            });

            assert.strictEqual(uniquePairs.length, 2); // adam-eve, cain-abel
        });

        await this.runTest('距離が遠すぎるペアは除外される', async () => {
            const entities = [
                { id: "adam", gender: "male", position: { x: 0, y: 0, z: 0 } },
                { id: "eve", gender: "female", position: { x: 100, y: 0, z: 0 } }
            ];

            const uniquePairs = this.extractor.extractUniqueBreedingPairs(entities, 10);
            assert.strictEqual(uniquePairs.length, 0);
        });

        // 統合テスト
        console.log('\n=== 統合テスト ===');
        await this.runTest('実際のデータからユニークペアを抽出する', async () => {
            const realData = {
                entities: [
                    {
                        id: "adam",
                        gender: "male",
                        dna: ["A", "C", "G", "T", "A", "C", "G", "T", "A", "C", "G", "T", "A", "C", "G", "T"],
                        position: { x: 25.40065086453803, y: 66, z: 10.78052563380174 },
                        health: 20.0,
                        age: 0,
                        entity_type: "entity.minecraft.villager",
                        max_health: 20.0,
                        behavior: "curious",
                        sociality: "leader",
                        lifespan: 1500
                    },
                    {
                        id: "eve",
                        gender: "female",
                        dna: ["T", "G", "C", "A", "T", "G", "C", "A", "T", "G", "C", "A", "T", "G", "C", "A"],
                        position: { x: 29.741067650081316, y: 69, z: 29.268909836088433 },
                        health: 20.0,
                        age: 0,
                        entity_type: "entity.minecraft.villager",
                        max_health: 20.0,
                        behavior: "passive",
                        sociality: "herd",
                        lifespan: 1500
                    }
                ]
            };

            const result = await this.extractor.processBreedingPairs(realData, 25); // 25ブロック以内
            
            assert.strictEqual(result.totalPairs, 1);
            assert.strictEqual(result.uniquePairs.length, 1);
            assert.strictEqual(result.uniquePairs[0].male.id, "adam");
            assert.strictEqual(result.uniquePairs[0].female.id, "eve");
            assert(result.uniquePairs[0].distance > 18 && result.uniquePairs[0].distance < 25);
            
            // 特性データが正しく取得されていることを確認
            const adamPair = result.uniquePairs[0].male;
            const evePair = result.uniquePairs[0].female;
            assert.strictEqual(adamPair.behavior, "curious");
            assert.strictEqual(adamPair.sociality, "leader");
            assert.strictEqual(adamPair.lifespan, 1500);
            assert.strictEqual(evePair.behavior, "passive");
            assert.strictEqual(evePair.sociality, "herd");
            assert.strictEqual(evePair.lifespan, 1500);
        });

        // テスト結果サマリー
        console.log('\n=== テスト結果サマリー ===');
        console.log(`✅ 成功: ${this.passedTests}/${this.totalTests}`);
        
        if (this.passedTests === this.totalTests) {
            console.log('🎉 すべてのテストが成功しました！');
        } else {
            throw new Error(`${this.totalTests - this.passedTests}個のテストが失敗しました`);
        }
    }
}

// テスト実行
if (require.main === module) {
    const runTests = async () => {
        try {
            const tests = new BreedingPairExtractorTests();
            await tests.runAllTests();
            process.exit(0);
        } catch (error) {
            console.error(`\n❌ テストスイートが失敗しました: ${error.message}`);
            process.exit(1);
        }
    };

    runTests();
}

module.exports = BreedingPairExtractorTests; 