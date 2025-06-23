/**
 * StatusDataReader 特性データ対応 TDDテスト
 * 5.1.2拡張: behavior, sociality, lifespanの読み込み機能
 */

const fs = require('fs');
const path = require('path');

// テスト用ディレクトリとファイル
const TEST_CONFIG_DIR = 'test_config_characteristics';
const TEST_STATUS_FILE = path.join(TEST_CONFIG_DIR, 'current_entity_status.json');

// StatusDataReaderクラスを読み込み
let StatusDataReader;
try {
    StatusDataReader = require('./status-data-reader.js');
} catch (error) {
    console.log('StatusDataReader.js が見つかりません。後で実装されます。');
}

/**
 * 特性データ対応テストスイート
 */
class CharacteristicsDataTest {
    constructor() {
        this.testCount = 0;
        this.passedCount = 0;
        this.failedCount = 0;
    }

    /**
     * テスト環境セットアップ
     */
    setUp() {
        if (!fs.existsSync(TEST_CONFIG_DIR)) {
            fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
        }
    }

    /**
     * テスト環境クリーンアップ
     */
    tearDown() {
        if (fs.existsSync(TEST_STATUS_FILE)) {
            fs.unlinkSync(TEST_STATUS_FILE);
        }
        if (fs.existsSync(TEST_CONFIG_DIR)) {
            fs.rmdirSync(TEST_CONFIG_DIR);
        }
    }

    /**
     * アサーション関数
     */
    assert(condition, message) {
        this.testCount++;
        if (condition) {
            this.passedCount++;
            console.log(`✓ ${message}`);
        } else {
            this.failedCount++;
            console.log(`✗ ${message}`);
        }
    }

    assertEqual(actual, expected, message) {
        this.assert(actual === expected, `${message} (expected: ${expected}, actual: ${actual})`);
    }

    /**
     * テスト1: 特性データが正しく読み込まれる
     */
    async testCharacteristicsDataParsing() {
        console.log('\n--- テスト1: 特性データが正しく読み込まれる ---');
        
        const testData = {
            entities: [
                {
                    entity_id: 'adam',
                    gender: 'male',
                    dna: 'ACGTACGTACGTACGT',
                    position: { x: 25.4, y: 66, z: 10.8 },
                    health: 20.0,
                    max_health: 20.0,
                    entity_type: 'entity.minecraft.villager',
                    behavior: 'curious',
                    sociality: 'leader',
                    lifespan: 1500
                }
            ]
        };

        fs.writeFileSync(TEST_STATUS_FILE, JSON.stringify(testData, null, 2));

        if (!StatusDataReader) {
            console.log('StatusDataReader未実装のためテストをスキップ');
            return;
        }

        const reader = new StatusDataReader(TEST_CONFIG_DIR);
        const entities = await reader.readStatusData();
        
        // 基本アサーション
        this.assertEqual(entities.length, 1, 'エンティティ数が1つ');
        
        // adamの特性データ確認
        const adam = entities[0];
        this.assertEqual(adam.id, 'adam', 'adamのIDが正しい');
        this.assertEqual(adam.behavior, 'curious', 'adamのbehaviorが正しい');
        this.assertEqual(adam.sociality, 'leader', 'adamのsocialityが正しい');
        this.assertEqual(adam.lifespan, 1500, 'adamのlifespanが正しい');
    }

    /**
     * テスト2: 特性データが含まれたformattedDataMapが正しく生成される
     */
    async testFormattedDataWithCharacteristics() {
        console.log('\n--- テスト2: 特性データ含むformattedDataMapが正しく生成される ---');
        
        const testData = {
            entities: [
                {
                    entity_id: 'adam',
                    gender: 'male',
                    dna: 'ACGT',
                    position: { x: 25, y: 66, z: 10 },
                    health: 20.0,
                    behavior: 'curious',
                    sociality: 'leader',
                    lifespan: 1500
                }
            ]
        };

        fs.writeFileSync(TEST_STATUS_FILE, JSON.stringify(testData, null, 2));

        if (!StatusDataReader) {
            console.log('StatusDataReader未実装のためテストをスキップ');
            return;
        }

        const reader = new StatusDataReader(TEST_CONFIG_DIR);
        const formattedData = await reader.getFormattedDataMap();
        
        // 構造確認
        this.assert(formattedData.entities.length === 1, 'エンティティが1つ');
        
        // 特性データが含まれていることを確認
        const entity = formattedData.entities[0];
        this.assert('behavior' in entity, 'behaviorフィールドが存在');
        this.assert('sociality' in entity, 'socialityフィールドが存在');
        this.assert('lifespan' in entity, 'lifespanフィールドが存在');
        this.assertEqual(entity.behavior, 'curious', 'behaviorが正しい');
        this.assertEqual(entity.sociality, 'leader', 'socialityが正しい');
        this.assertEqual(entity.lifespan, 1500, 'lifespanが正しい');
    }

    /**
     * テスト3: 特性データが不完全な場合の処理
     */
    async testPartialCharacteristicsData() {
        console.log('\n--- テスト3: 特性データが不完全な場合の処理 ---');
        
        const testData = {
            entities: [
                {
                    entity_id: 'incomplete_entity',
                    gender: 'male',
                    dna: 'ACGT',
                    position: { x: 0, y: 0, z: 0 },
                    health: 20.0,
                    behavior: 'curious'
                    // sociality と lifespan は欠損
                }
            ]
        };

        fs.writeFileSync(TEST_STATUS_FILE, JSON.stringify(testData, null, 2));

        if (!StatusDataReader) {
            console.log('StatusDataReader未実装のためテストをスキップ');
            return;
        }

        const reader = new StatusDataReader(TEST_CONFIG_DIR);
        const entities = await reader.readStatusData();
        
        this.assertEqual(entities.length, 1, 'エンティティが1つ');
        
        const entity = entities[0];
        this.assertEqual(entity.behavior, 'curious', 'behaviorが正しい');
        this.assertEqual(entity.sociality, null, 'socialityはnull');
        this.assertEqual(entity.lifespan, null, 'lifespanはnull');
    }

    /**
     * 全テスト実行
     */
    async runAllTests() {
        console.log('=== StatusDataReader 特性データ対応 TDDテスト開始 ===\n');
        
        try {
            this.setUp();
            await this.testCharacteristicsDataParsing();
            this.tearDown();
            this.setUp();
            
            await this.testFormattedDataWithCharacteristics();
            this.tearDown();
            this.setUp();
            
            await this.testPartialCharacteristicsData();
            this.tearDown();
            
        } catch (error) {
            console.error('テスト実行中にエラーが発生:', error);
        }

        console.log('\n=== テスト結果 ===');
        console.log(`総テスト数: ${this.testCount}`);
        console.log(`成功: ${this.passedCount}`);
        console.log(`失敗: ${this.failedCount}`);
        
        if (this.failedCount === 0) {
            console.log('🎉 全てのテストが成功しました！');
        } else {
            console.log('❌ 一部のテストが失敗しました。');
        }
    }
}

// テスト実行
if (require.main === module) {
    const test = new CharacteristicsDataTest();
    test.runAllTests();
}

module.exports = CharacteristicsDataTest; 