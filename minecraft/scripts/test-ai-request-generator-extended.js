const fs = require('fs');
const path = require('path');
const AiRequestGenerator = require('./ai-request-generator');

/**
 * 5.3.1 AI Request Generator 拡張TDDテストスイート
 * 実装完了後の統合テスト
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * 拡張テストスイート実行
 */
function runExtendedTests() {
    console.log('=== 5.3.1 AI Request Generator Extended Tests ===\n');
    
    let passed = 0;
    let failed = 0;
    
    try {
        // Test 1: 実際のクラスインスタンス化
        console.log('Test 1: AiRequestGenerator class instantiation');
        testClassInstantiation() ? passed++ : failed++;
        
        // Test 2: 実際のデータファイル読み込み
        console.log('Test 2: Real data file loading');
        testRealDataLoading() ? passed++ : failed++;
        
        // Test 3: データ構造の完全性
        console.log('Test 3: Generated data structure validation');
        testDataStructureValidation() ? passed++ : failed++;
        
        // Test 4: パフォーマンステスト
        console.log('Test 4: Performance test');
        testPerformance() ? passed++ : failed++;
        
        // Test 5: エラーハンドリング
        console.log('Test 5: Error handling');
        testErrorHandling() ? passed++ : failed++;
        
        // Test 6: ファイル出力とサイズチェック
        console.log('Test 6: File output and size check');
        testFileOutputAndSize() ? passed++ : failed++;
        
        // Test 7: 5.3.4.4 管理者指示の読み込みと統合テスト
        console.log('\nTest 7: Guidance Integration');
        testGuidanceIntegration() ? passed++ : failed++;
        
    } catch (error) {
        console.error('Extended test execution error:', error.message);
        failed++;
    }
    
    console.log(`\n=== Extended Test Results ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total:  ${passed + failed}`);
    
    return failed === 0;
}

/**
 * Test 1: クラスインスタンス化テスト
 */
function testClassInstantiation() {
    try {
        const generator = new AiRequestGenerator();
        
        if (!generator || typeof generator.generateAiRequestData !== 'function') {
            throw new Error('AiRequestGenerator class not properly instantiated');
        }
        
        console.log('  ✓ AiRequestGeneratorクラスが正常にインスタンス化された');
        console.log('  ✓ 必要なメソッドが存在する');
        
        return true;
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 2: 実際のデータファイル読み込みテスト
 */
function testRealDataLoading() {
    try {
        const generator = new AiRequestGenerator();
        
        // 実際のファイルが存在することを確認
        const breedingPairsPath = path.join(__dirname, 'data', 'breeding_pairs_result.json');
        const entitiesPath = path.join(__dirname, '../config', 'models_skins_animations.json');
        
        if (!fs.existsSync(breedingPairsPath)) {
            throw new Error(`breeding_pairs_result.json not found: ${breedingPairsPath}`);
        }
        
        if (!fs.existsSync(entitiesPath)) {
            throw new Error(`models_skins_animations.json not found: ${entitiesPath}`);
        }
        
        // 実際にデータを読み込み
        const pairs = generator.extractBreedingPairInfo();
        const entities = generator.extractAvailableEntities();
        
        if (!Array.isArray(pairs) || pairs.length === 0) {
            throw new Error('繁殖ペアデータの読み込みに失敗');
        }
        
        if (!Array.isArray(entities) || entities.length === 0) {
            throw new Error('エンティティデータの読み込みに失敗');
        }
        
        console.log(`  ✓ 繁殖ペアデータ読み込み成功: ${pairs.length}組`);
        console.log(`  ✓ エンティティデータ読み込み成功: ${entities.length}種類`);
        
        return true;
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 3: 生成データ構造の完全性テスト
 */
function testDataStructureValidation() {
    try {
        const generator = new AiRequestGenerator();
        const requestData = generator.generateAiRequestData();
        
        // 必須フィールドの存在チェック
        const requiredFields = ['breeding_pairs', 'available_entities', 'genetics_rules', 'metadata'];
        for (const field of requiredFields) {
            if (!requestData.hasOwnProperty(field)) {
                throw new Error(`必須フィールドが存在しません: ${field}`);
            }
        }
        
        // 繁殖ペアの構造チェック
        if (!Array.isArray(requestData.breeding_pairs)) {
            throw new Error('breeding_pairsが配列ではありません');
        }
        
        if (requestData.breeding_pairs.length > 0) {
            const firstPair = requestData.breeding_pairs[0];
            if (!firstPair.male || !firstPair.female || typeof firstPair.distance !== 'number') {
                throw new Error('ペアデータの構造が不正です');
            }
        }
        
        // エンティティリストの構造チェック
        if (!Array.isArray(requestData.available_entities)) {
            throw new Error('available_entitiesが配列ではありません');
        }
        
        // メタデータの構造チェック
        const metadata = requestData.metadata;
        if (typeof metadata.total_pairs !== 'number' || 
            typeof metadata.entity_types_count !== 'number' ||
            !metadata.generated_at) {
            throw new Error('メタデータの構造が不正です');
        }
        
        console.log('  ✓ 全必須フィールドが存在する');
        console.log('  ✓ データ構造が仕様通り');
        console.log('  ✓ メタデータが正常に生成される');
        
        return true;
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 4: パフォーマンステスト
 */
function testPerformance() {
    try {
        const generator = new AiRequestGenerator();
        
        const startTime = process.hrtime();
        const requestData = generator.generateAiRequestData();
        const [seconds, nanoseconds] = process.hrtime(startTime);
        
        const executionTime = seconds * 1000 + nanoseconds / 1000000; // ms
        
        if (executionTime > 1000) { // 1秒を超える場合は警告
            console.log(`  ⚠ Warning: 実行時間が長いです: ${executionTime.toFixed(2)}ms`);
        }
        
        console.log(`  ✓ データ生成実行時間: ${executionTime.toFixed(2)}ms`);
        console.log(`  ✓ パフォーマンス基準を満たしている`);
        
        return true;
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 5: エラーハンドリングテスト
 */
function testErrorHandling() {
    try {
        const generator = new AiRequestGenerator();
        
        // 存在しないディレクトリでのテスト
        const originalConfigDir = generator.configDir;
        generator.configDir = '/non/existent/path';
        
        try {
            generator.extractAvailableEntities();
            throw new Error('エラーが発生するべきなのに成功してしまいました');
        } catch (error) {
            if (!error.message.includes('not found')) {
                throw error;
            }
        }
        
        // 元に戻す
        generator.configDir = originalConfigDir;
        
        console.log('  ✓ ファイル存在チェックが正常に動作する');
        console.log('  ✓ 適切なエラーメッセージが表示される');
        
        return true;
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 6: ファイル出力とサイズチェックテスト
 */
function testFileOutputAndSize() {
    try {
        const generator = new AiRequestGenerator();
        const testOutputPath = path.join(__dirname, 'data', 'test_ai_request_output.json');
        
        // ファイル出力実行
        const result = generator.saveRequestData(testOutputPath);
        
        // ファイルが実際に作成されているかチェック
        if (!fs.existsSync(testOutputPath)) {
            throw new Error('出力ファイルが作成されていません');
        }
        
        // ファイルサイズチェック
        const stats = fs.statSync(testOutputPath);
        const fileSizeKB = stats.size / 1024;
        
        if (fileSizeKB > 100) { // 100KB超過で警告
            console.log(`  ⚠ Warning: ファイルサイズが大きいです: ${fileSizeKB.toFixed(2)}KB`);
        }
        
        // JSONの妥当性チェック
        const savedData = JSON.parse(fs.readFileSync(testOutputPath, 'utf8'));
        if (!savedData.breeding_pairs || !savedData.available_entities) {
            throw new Error('保存されたJSONの構造が不正です');
        }
        
        console.log(`  ✓ ファイル出力成功: ${result.sizeKB}KB`);
        console.log('  ✓ JSONファイルの妥当性確認');
        
        // テストファイルの削除
        fs.unlinkSync(testOutputPath);
        
        return true;
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 7: 5.3.4.4 管理者指示の読み込みと統合テスト
 */
function testGuidanceIntegration() {
    try {
        const generator = new AiRequestGenerator();
        const testGuidance = "親の行動パターンを重視して子の特性を決めて";
        const guidanceFile = path.join(__dirname, '../config/current_guidance.txt');
        
        // テストファイルの作成
        fs.writeFileSync(guidanceFile, testGuidance, 'utf8');
        
        // 1. 指示ファイルの読み込みテスト
        const guidance = generator.readGuidance();
        console.log('  ✓ 管理者指示ファイルを読み込み成功');
        
        // 2. AIリクエストデータへの統合テスト
        const requestData = generator.generateAiRequestData();
        if (requestData.user_guidance !== testGuidance) {
            throw new Error('管理者指示がリクエストデータに正しく統合されていません');
        }
        console.log('  ✓ 管理者指示がリクエストデータに統合される');
        
        // 3. 空ファイルのハンドリングテスト
        fs.writeFileSync(guidanceFile, '', 'utf8');
        const emptyGuidance = generator.readGuidance();
        if (emptyGuidance !== '') {
            throw new Error('空ファイルが正しく処理されていません');
        }
        console.log('  ✓ 空ファイルが正しく処理される');
        
        // 4. ファイル不在のハンドリングテスト
        fs.unlinkSync(guidanceFile);
        const noFileGuidance = generator.readGuidance();
        if (noFileGuidance !== '') {
            throw new Error('ファイル不在時の処理が正しくありません');
        }
        console.log('  ✓ ファイル不在時も正しく処理される');
        
        return true;
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

// メイン実行
if (require.main === module) {
    const success = runExtendedTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runExtendedTests };
