/**
 * StatusDataReader Node.js版 TDDテスト
 * 5.1.2 Node.js側: 出力されたリアルタイム状態データの読み込みと整形
 */

const fs = require('fs');
const path = require('path');

// テスト用ディレクトリとファイル
const TEST_CONFIG_DIR = 'test_config_nodejs';
const TEST_STATUS_FILE = path.join(TEST_CONFIG_DIR, 'current_entity_status.json');

// StatusDataReaderクラスを読み込み（まだ存在しない）
let StatusDataReader;
try {
    StatusDataReader = require('./status-data-reader.js');
} catch (error) {
    console.log('StatusDataReader.js が見つかりません。後で実装されます。');
}

/**
 * テストスイート
 */
class StatusDataReaderTest {
    constructor() {
        this.testCount = 0;
        this.passedCount = 0;
        this.failedCount = 0;
    }

    /**
     * テスト環境セットアップ
     */
    setUp() {
        // テスト用ディレクトリを作成
        if (!fs.existsSync(TEST_CONFIG_DIR)) {
            fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
        }
    }

    /**
     * テスト環境クリーンアップ
     */
    tearDown() {
        // テストファイルを削除
        if (fs.existsSync(TEST_STATUS_FILE)) {
            fs.unlinkSync(TEST_STATUS_FILE);
        }
        // テストディレクトリを削除
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

    assertDeepEqual(actual, expected, message) {
        this.assert(JSON.stringify(actual) === JSON.stringify(expected), 
                   `${message} (expected: ${JSON.stringify(expected)}, actual: ${JSON.stringify(actual)})`);
    }

    /**
     * テスト1: 正常なステータスJSONファイルを読み込める
     */
    async testReadValidStatusFile() {
        console.log('\n--- テスト1: 正常なステータスJSONファイルを読み込める ---');
        
        // テストデータ作成
        const testData = {
            entities: [
                {
                    id: 'adam_001',
                    gender: 'male',
                    dna: ['A', 'T', 'G', 'C'],
                    position: { x: 100.5, y: 64.0, z: 200.7 },
                    health: 20.0,
                    age: 1200
                },
                {
                    id: 'eve_001',
                    gender: 'female', 
                    dna: ['T', 'G', 'C', 'A'],
                    position: { x: 105.2, y: 64.0, z: 195.3 },
                    health: 18.5,
                    age: 800
                }
            ],
            timestamp: '2024-12-21T10:30:00Z',
            world: 'world'
        };

        // テストファイル作成
        fs.writeFileSync(TEST_STATUS_FILE, JSON.stringify(testData, null, 2));

        if (!StatusDataReader) {
            console.log('StatusDataReader未実装のためテストをスキップ');
            return;
        }

        // テスト実行
        const reader = new StatusDataReader(TEST_CONFIG_DIR);
        const entities = await reader.readStatusData();

        // アサーション
        this.assert(entities !== null, 'entitiesがnullでない');
        this.assertEqual(entities.length, 2, 'エンティティ数が2つ');
        
        const adam = entities[0];
        this.assertEqual(adam.id, 'adam_001', 'adamのIDが正しい');
        this.assertEqual(adam.gender, 'male', 'adamの性別が正しい');
        this.assertEqual(adam.dna.length, 4, 'adamのDNA配列長が正しい');
        this.assertEqual(adam.position.x, 100.5, 'adamのX座標が正しい');
    }

    /**
     * テスト2: ファイルが存在しない場合は空の配列を返す
     */
    async testReadNonExistentFile() {
        console.log('\n--- テスト2: ファイルが存在しない場合は空の配列を返す ---');
        
        if (!StatusDataReader) {
            console.log('StatusDataReader未実装のためテストをスキップ');
            return;
        }

        const reader = new StatusDataReader(TEST_CONFIG_DIR);
        const entities = await reader.readStatusData();
        
        this.assert(entities !== null, 'entitiesがnullでない');
        this.assertEqual(entities.length, 0, 'エンティティ数が0');
    }

    /**
     * テスト3: 不正なJSONファイルの場合はエラーをスローする
     */
    async testReadInvalidJsonFile() {
        console.log('\n--- テスト3: 不正なJSONファイルの場合はエラーをスローする ---');
        
        // 不正なJSONファイル作成
        fs.writeFileSync(TEST_STATUS_FILE, '{ invalid json content ');

        if (!StatusDataReader) {
            console.log('StatusDataReader未実装のためテストをスキップ');
            return;
        }

        const reader = new StatusDataReader(TEST_CONFIG_DIR);
        
        try {
            await reader.readStatusData();
            this.assert(false, '例外がスローされるべき');
        } catch (error) {
            this.assert(true, '例外が正しくスローされた');
        }
    }

    /**
     * テスト4: 整形されたデータ構造が正しく作成される
     */
    async testFormattedDataStructure() {
        console.log('\n--- テスト4: 整形されたデータ構造が正しく作成される ---');
        
        const testData = {
            entities: [
                {
                    id: 'adam_001',
                    gender: 'male',
                    dna: ['A', 'T', 'G', 'C'],
                    position: { x: 100.5, y: 64.0, z: 200.7 },
                    health: 20.0,
                    age: 1200
                },
                {
                    id: 'eve_001',
                    gender: 'female',
                    dna: ['T', 'G', 'C', 'A'],
                    position: { x: 105.2, y: 64.0, z: 195.3 },
                    health: 18.5,
                    age: 800
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
        
        this.assert(formattedData !== null, 'formattedDataがnullでない');
        this.assert('entities' in formattedData, 'entitiesキーが存在');
        this.assert('entityCount' in formattedData, 'entityCountキーが存在');
        this.assert('maleCount' in formattedData, 'maleCountキーが存在');
        this.assert('femaleCount' in formattedData, 'femaleCountキーが存在');
        
        this.assertEqual(formattedData.entityCount, 2, 'エンティティ総数が正しい');
        this.assertEqual(formattedData.maleCount, 1, 'オス数が正しい');
        this.assertEqual(formattedData.femaleCount, 1, 'メス数が正しい');
    }

    /**
     * テスト5: 一時保存機能が正しく動作する
     */
    async testTemporaryDataStorage() {
        console.log('\n--- テスト5: 一時保存機能が正しく動作する ---');
        
        const testData = {
            entities: [
                {
                    id: 'adam_001',
                    gender: 'male',
                    dna: ['A', 'T', 'G', 'C'],
                    position: { x: 100.5, y: 64.0, z: 200.7 }
                }
            ]
        };

        fs.writeFileSync(TEST_STATUS_FILE, JSON.stringify(testData, null, 2));

        if (!StatusDataReader) {
            console.log('StatusDataReader未実装のためテストをスキップ');
            return;
        }

        const reader = new StatusDataReader(TEST_CONFIG_DIR);
        
        // データを読み込んで一時保存
        await reader.readStatusData();
        await reader.saveToMemory();
        
        // メモリから取得
        const memoryData = reader.getFromMemory();
        this.assert(memoryData !== null, 'メモリからデータが取得できる');
        this.assert(memoryData.lastReadData !== undefined, 'メモリにlastReadDataが存在する');
        this.assertEqual(memoryData.lastReadData.entities.length, 1, 'メモリ内エンティティ数が正しい');
    }

    /**
     * テスト6: 特性データ（behavior, sociality, lifespan）が正しく読み込まれる
     */
    async testCharacteristicsDataParsing() {
        console.log('\n--- テスト6: 特性データが正しく読み込まれる ---');
        
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
                },
                {
                    entity_id: 'eve',
                    gender: 'female', 
                    dna: 'TGCATGCATGCATGCA',
                    position: { x: 29.7, y: 69, z: 29.3 },
                    health: 20.0,
                    max_health: 20.0,
                    entity_type: 'entity.minecraft.villager',
                    behavior: 'passive',
                    sociality: 'herd',
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
        this.assertEqual(entities.length, 2, 'エンティティ数が2つ');
        
        // adamの特性データ確認
        const adam = entities[0];
        this.assertEqual(adam.id, 'adam', 'adamのIDが正しい');
        this.assertEqual(adam.behavior, 'curious', 'adamのbehaviorが正しい');
        this.assertEqual(adam.sociality, 'leader', 'adamのsocialityが正しい');
        this.assertEqual(adam.lifespan, 1500, 'adamのlifespanが正しい');
        
        // eveの特性データ確認
        const eve = entities[1];
        this.assertEqual(eve.id, 'eve', 'eveのIDが正しい');
        this.assertEqual(eve.behavior, 'passive', 'eveのbehaviorが正しい');
        this.assertEqual(eve.sociality, 'herd', 'eveのsocialityが正しい');
        this.assertEqual(eve.lifespan, 1500, 'eveのlifespanが正しい');
    }

    /**
     * テスト7: 特性データが含まれたformattedDataMapが正しく生成される
     */
    async testFormattedDataWithCharacteristics() {
        console.log('\n--- テスト7: 特性データ含むformattedDataMapが正しく生成される ---');
        
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
     * テスト8: 特性データが不完全な場合の処理
     */
    async testPartialCharacteristicsData() {
        console.log('\n--- テスト8: 特性データが不完全な場合の処理 ---');
        
        const testData = {
            entities: [
                {
                    entity_id: 'incomplete_entity',
                    gender: 'male',
                    dna: 'ACGT',
                    position: { x: 0, y: 0, z: 0 },
                    health: 20.0,
                    behavior: 'curious',
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
        console.log('=== StatusDataReader Node.js TDDテスト開始 ===\n');
        
        try {
            this.setUp();
            await this.testReadValidStatusFile();
            this.tearDown();
            this.setUp();
            
            await this.testReadNonExistentFile();
            this.tearDown();
            this.setUp();
            
            await this.testReadInvalidJsonFile();
            this.tearDown();
            this.setUp();
            
            await this.testFormattedDataStructure();
            this.tearDown();
            this.setUp();
            
            await this.testTemporaryDataStorage();
            this.tearDown();
            this.setUp();
            
            // 新しいテストを追加
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
            console.log('❌一部のテストが失敗しました。');
        }
    }
}

// テスト実行
if (require.main === module) {
    const test = new StatusDataReaderTest();
    test.runAllTests();
}

module.exports = StatusDataReaderTest; 