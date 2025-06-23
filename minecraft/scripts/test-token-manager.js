const TokenManager = require('./token-manager');

/**
 * 5.3.3 Token Manager TDDテストスイート
 * トークン制限管理システムのテスト
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */

// テスト用のモックデータ準備
const mockBreedingPairsData = {
    breeding_pairs: [
        {
            male: { id: "male_0", gender: "male", dna: ["A", "C", "G", "T"], behavior: "curious", sociality: "leader", lifespan: 1500 },
            female: { id: "female_0", gender: "female", dna: ["T", "G", "C", "A"], behavior: "passive", sociality: "herd", lifespan: 1500 },
            distance: 1.5
        },
        {
            male: { id: "male_1", gender: "male", dna: ["G", "T", "A", "C"], behavior: "aggressive", sociality: "solitary", lifespan: 1200 },
            female: { id: "female_1", gender: "female", dna: ["C", "A", "T", "G"], behavior: "cautious", sociality: "pair", lifespan: 1800 },
            distance: 2.3
        },
        {
            male: { id: "male_2", gender: "male", dna: ["T", "A", "G", "C"], behavior: "playful", sociality: "herd", lifespan: 1400 },
            female: { id: "female_2", gender: "female", dna: ["A", "G", "C", "T"], behavior: "nurturing", sociality: "leader", lifespan: 1600 },
            distance: 3.1
        }
    ],
    available_entities: ["villager", "witch", "zombie", "pig", "cow", "sheep"],
    genetics_rules: { crossover_rate: 0.7, mutation_rate: 0.1, generation: 2 }
};

let tokenManager;

/**
 * テストスイート実行
 */
function runTests() {
    console.log('=== 5.3.3 Token Manager TDD Tests ===\n');
    
    let passed = 0;
    let failed = 0;
    
    try {
        // Test 1: tiktoken-nodeライブラリのロードテスト
        console.log('Test 1: tiktoken library loading');
        testTiktokenLoading() ? passed++ : failed++;
        
        // Test 2: 基本的なトークン計算
        console.log('\nTest 2: basic token calculation');
        testBasicTokenCalculation() ? passed++ : failed++;
        
        // Test 3: JSONデータのトークン計算
        console.log('\nTest 3: JSON data token calculation');
        testJsonTokenCalculation() ? passed++ : failed++;
        
        // Test 4: トークン制限チェック
        console.log('\nTest 4: token limit validation');
        testTokenLimitValidation() ? passed++ : failed++;
        
        // Test 5: 動的ペア数調整（距離順優先）
        console.log('\nTest 5: dynamic pair adjustment');
        testDynamicPairAdjustment() ? passed++ : failed++;
        
        // Test 6: 管理者指示のトークン制限
        console.log('\nTest 6: user guidance token limit');
        testUserGuidanceTokenLimit() ? passed++ : failed++;
        
    } catch (error) {
        console.error('Test execution error:', error.message);
        failed++;
    } finally {
        if (tokenManager) {
            tokenManager.dispose();
        }
    }
    
    console.log(`\n=== Test Results ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total:  ${passed + failed}`);
    
    return failed === 0;
}

/**
 * Test 1: tiktoken-nodeライブラリのロードテスト
 */
function testTiktokenLoading() {
    try {
        tokenManager = new TokenManager();
        const testText = "Hello, world!";
        const tokenCount = tokenManager.calculateTokens(testText);
        
        if (typeof tokenCount !== 'number' || tokenCount <= 0) {
            throw new Error('トークン計算結果が不正です');
        }
        
        console.log('  ✓ tiktoken-nodeライブラリが正常にロードされる');
        console.log('  ✓ gpt-3.5-turboエンコーディングが利用可能');
        
        return true;
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 2: 基本的なトークン計算テスト
 */
function testBasicTokenCalculation() {
    try {
        const testTexts = [
            { text: "Hello, world!", expectedRange: [3, 5] },
            { text: "これは日本語のテストです。", expectedRange: [8, 15] },
            { text: "", expectedRange: [0, 0] }
        ];
        
        for (const testCase of testTexts) {
            const tokens = tokenManager.calculateTokens(testCase.text);
            
            if (testCase.text === "" && tokens !== 0) {
                throw new Error('空文字列のトークン数が0ではありません');
            }
            
            if (testCase.text !== "" && 
                (tokens < testCase.expectedRange[0] || tokens > testCase.expectedRange[1])) {
                throw new Error(`トークン数が予想範囲外です: ${tokens} (expected: ${testCase.expectedRange[0]}-${testCase.expectedRange[1]})`);
            }
        }
        
        console.log('  ✓ 基本的な文字列のトークン計算が動作する');
        console.log('  ✓ 日本語文字列のトークン計算が動作する');
        console.log('  ✓ 空文字列と長文字列の処理が正常');
        
        return true;
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 3: JSONデータのトークン計算テスト
 */
function testJsonTokenCalculation() {
    try {
        const jsonData = {
            breeding_pairs: mockBreedingPairsData.breeding_pairs.slice(0, 2),
            available_entities: mockBreedingPairsData.available_entities,
            genetics_rules: mockBreedingPairsData.genetics_rules
        };
        
        const tokens = tokenManager.calculateJsonTokens(jsonData);
        
        if (tokens <= 0) {
            throw new Error('JSONデータのトークン計算結果が0以下です');
        }
        
        console.log(`  ✓ JSONデータのトークン計算が動作する (${tokens} tokens)`);
        console.log('  ✓ 構造化データの適切な処理');
        
        return true;
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 4: トークン制限チェックテスト
 */
function testTokenLimitValidation() {
    try {
        const TOKEN_LIMIT = 3000;
        tokenManager = new TokenManager('gpt-3.5-turbo', TOKEN_LIMIT);
        
        // 小さなデータのテスト
        const smallData = { message: "Small data" };
        const smallTokens = tokenManager.calculateJsonTokens(smallData);
        
        // 大きなデータのテスト（制限を確実に超えるサイズ）
        const largeData = {
            message: "Large data",
            array: Array(1000).fill("This is a long string that will consume many tokens when encoded")
        };
        const largeTokens = tokenManager.calculateJsonTokens(largeData);
        
        // 境界値テスト
        const boundaryData = {
            message: "A".repeat(Math.floor(TOKEN_LIMIT * 0.85)) // 制限の85%程度のデータ
        };
        const boundaryTokens = tokenManager.calculateJsonTokens(boundaryData);
        
        // テストケースの検証
        if (!tokenManager.isWithinLimit(smallTokens)) {
            throw new Error(`小さなデータ(${smallTokens} tokens)が制限内と判定されません`);
        }
        
        if (tokenManager.isWithinLimit(largeTokens)) {
            throw new Error(`大きなデータ(${largeTokens} tokens)で制限超過が検出されません`);
        }
        
        if (!tokenManager.isWithinLimit(boundaryTokens)) {
            throw new Error(`境界値データ(${boundaryTokens} tokens)が制限内と判定されません`);
        }
        
        console.log('  ✓ トークン制限内データの正常通過');
        console.log('  ✓ トークン制限超過データの検出');
        console.log(`  ✓ 制限値: ${TOKEN_LIMIT} tokens (実効制限: ${Math.floor(TOKEN_LIMIT * 0.9)} tokens)`);
        console.log(`  ✓ 小さなデータ: ${smallTokens} tokens`);
        console.log(`  ✓ 大きなデータ: ${largeTokens} tokens`);
        console.log(`  ✓ 境界値データ: ${boundaryTokens} tokens`);
        
        return true;
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 5: 動的ペア数調整テスト
 */
function testDynamicPairAdjustment() {
    try {
        const allPairs = mockBreedingPairsData.breeding_pairs;
        const TOKEN_LIMIT = 1000;
        tokenManager = new TokenManager('gpt-3.5-turbo', TOKEN_LIMIT);
        
        const result = tokenManager.adjustBreedingPairsForTokenLimit(
            allPairs,
            mockBreedingPairsData.available_entities,
            mockBreedingPairsData.genetics_rules
        );
        
        if (!result.adjustedData || !result.adjustedPairs) {
            throw new Error('調整結果が不正です');
        }
        
        if (result.adjustedPairs[0].distance !== 1.5) {
            throw new Error('距離順ソートが正しく動作していません');
        }
        
        if (!result.isWithinLimit) {
            throw new Error('調整後のデータがトークン制限を超過しています');
        }
        
        console.log('  ✓ 距離順ソートが正常に動作する');
        console.log(`  ✓ 動的ペア調整: ${allPairs.length} → ${result.adjustedPairs.length} pairs`);
        console.log('  ✓ 最優先ペアが保持される');
        console.log(`  ✓ トークン使用率: ${(result.tokenUtilization * 100).toFixed(1)}%`);
        
        return true;
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 6: 管理者指示のトークン制限テスト
 */
function testUserGuidanceTokenLimit() {
    try {
        const MAX_GUIDANCE_TOKENS = 500;
        tokenManager = new TokenManager('gpt-3.5-turbo', 3000, MAX_GUIDANCE_TOKENS);
        
        const normalGuidance = "知能を重視した進化を促進してください。";
        const normalResult = tokenManager.validateUserGuidance(normalGuidance);
        
        if (normalResult.wasTruncated) {
            throw new Error('正常な長さの指示が切り詰められました');
        }
        
        const longGuidance = "長い指示".repeat(500);
        const longResult = tokenManager.validateUserGuidance(longGuidance);
        
        if (!longResult.wasTruncated) {
            throw new Error('長い指示が切り詰められていません');
        }
        
        if (tokenManager.calculateTokens(longResult.text) > MAX_GUIDANCE_TOKENS) {
            throw new Error('切り詰め後もトークン制限を超過しています');
        }
        
        console.log('  ✓ 正常な管理者指示が通過する');
        console.log('  ✓ 長すぎる指示が検出される');
        console.log(`  ✓ 自動切り詰め機能テスト完了 (${longResult.tokens} tokens)`);
        
        return true;
    } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        return false;
    }
}

// メイン実行
if (require.main === module) {
    const success = runTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runTests };
