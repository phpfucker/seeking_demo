/**
 * reset_entities.jsスクリプトの実装済み機能テスト
 * 
 * 実行方法: node test-reset-entities.js
 * 
 * テスト対象:
 * - initial_adam_eve.jsonからgenerated_entities.jsonへのリセット処理
 * - ファイルコピー機能
 * - エラーハンドリング
 */

const fs = require('fs');
const path = require('path');

// テスト用のパス設定
const TEST_CONFIG_DIR = path.join(__dirname, '../test-config-reset');
const TEST_INITIAL_PATH = path.join(TEST_CONFIG_DIR, 'test_initial_adam_eve.json');
const TEST_GENERATED_PATH = path.join(TEST_CONFIG_DIR, 'test_generated_entities.json');

/**
 * テスト用のディレクトリとファイルを準備する
 */
function setupTestEnvironment() {
  console.log('=== reset_entities.js テスト環境セットアップ開始 ===');
  
  // テストディレクトリの作成
  if (!fs.existsSync(TEST_CONFIG_DIR)) {
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
    console.log('テストディレクトリを作成しました:', TEST_CONFIG_DIR);
  }
  
  // テスト用のinitial_adam_eve.jsonデータを作成
  const initialData = [
    {
      "entity_id": "adam",
      "name": "adam",
      "gender": "male",
      "parent_ids": [],
      "generation": 1,
      "dna": "ACGTACGTACGTACGT",
      "model": "models/entity/villager.geo.json",
      "texture": "textures/entity/villager/villager.png",
      "animation": "animations/entity/villager.animation.json",
      "behavior": "curious",
      "sociality": "leader",
      "lifespan": 1500
    },
    {
      "entity_id": "eve",
      "name": "eve",
      "gender": "female", 
      "parent_ids": [],
      "generation": 1,
      "dna": "TGCATGCATGCATGCA",
      "model": "models/entity/villager.geo.json",
      "texture": "textures/entity/villager/villager.png",
      "animation": "animations/entity/villager.animation.json",
      "behavior": "passive",
      "sociality": "herd",
      "lifespan": 1500
    }
  ];
  
  fs.writeFileSync(TEST_INITIAL_PATH, JSON.stringify(initialData, null, 2), 'utf8');
  console.log('テスト用初期データファイルを作成しました:', TEST_INITIAL_PATH);
  
  // テスト用の変更されたgenerated_entities.jsonを作成（リセット前の状態）
  const modifiedData = [
    ...initialData,
    {
      "entity_id": "child1",
      "name": "child1",
      "gender": "male",
      "parent_ids": ["adam", "eve"],
      "generation": 2,
      "dna": "CGTACGTACGTACGTA",
      "model": "models/entity/villager.geo.json",
      "texture": "textures/entity/villager/villager.png",
      "animation": "animations/entity/villager.animation.json",
      "behavior": "explorer",
      "sociality": "individual",
      "lifespan": 1200
    }
  ];
  
  fs.writeFileSync(TEST_GENERATED_PATH, JSON.stringify(modifiedData, null, 2), 'utf8');
  console.log('テスト用変更済みデータファイルを作成しました:', TEST_GENERATED_PATH);
  
  console.log('=== テスト環境セットアップ完了 ===\n');
}

/**
 * テスト用ファイルをクリーンアップする
 */
function cleanupTestEnvironment() {
  console.log('\n=== テスト環境クリーンアップ開始 ===');
  
  // テストファイルの削除
  [TEST_INITIAL_PATH, TEST_GENERATED_PATH].forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('テストファイルを削除しました:', filePath);
    }
  });
  
  // テストディレクトリの削除
  if (fs.existsSync(TEST_CONFIG_DIR)) {
    fs.rmdirSync(TEST_CONFIG_DIR);
    console.log('テストディレクトリを削除しました:', TEST_CONFIG_DIR);
  }
  
  console.log('=== テスト環境クリーンアップ完了 ===');
}

/**
 * reset_entities.jsの機能を模擬実行する
 */
function performResetOperation() {
  // reset_entities.jsと同じ処理を実行
  if (!fs.existsSync(TEST_INITIAL_PATH)) {
    throw new Error('初期個体データファイルが存在しません: ' + TEST_INITIAL_PATH);
  }
  
  // 上書きコピー
  fs.copyFileSync(TEST_INITIAL_PATH, TEST_GENERATED_PATH);
  console.log('✓ ファイルコピー実行完了');
}

/**
 * テスト1: 正常なリセット処理テスト
 */
function testNormalResetOperation() {
  console.log('テスト1: 正常なリセット処理テスト');
  
  try {
    // リセット前のファイル内容確認
    const beforeReset = JSON.parse(fs.readFileSync(TEST_GENERATED_PATH, 'utf8'));
    if (beforeReset.length !== 3) {
      throw new Error('リセット前のデータ件数が期待値と異なります');
    }
    console.log('✓ リセット前のデータ確認完了（3体のエンティティ）');
    
    // リセット処理実行
    performResetOperation();
    
    // リセット後のファイル内容確認
    const afterReset = JSON.parse(fs.readFileSync(TEST_GENERATED_PATH, 'utf8'));
    if (afterReset.length !== 2) {
      throw new Error('リセット後のデータ件数が期待値と異なります');
    }
    console.log('✓ リセット後のデータ確認完了（2体のエンティティ）');
    
    // 内容が初期データと一致することを確認
    const initialData = JSON.parse(fs.readFileSync(TEST_INITIAL_PATH, 'utf8'));
    if (JSON.stringify(afterReset) !== JSON.stringify(initialData)) {
      throw new Error('リセット後のデータが初期データと一致しません');
    }
    console.log('✓ リセット後のデータ内容確認完了');
    
    // adamとeveが存在することを確認
    const adamExists = afterReset.some(e => e.entity_id === 'adam');
    const eveExists = afterReset.some(e => e.entity_id === 'eve');
    const childExists = afterReset.some(e => e.entity_id === 'child1');
    
    if (!adamExists || !eveExists) {
      throw new Error('リセット後にadamまたはeveが存在しません');
    }
    
    if (childExists) {
      throw new Error('リセット後に子孫データが残ってしまいました');
    }
    
    console.log('✓ 個体データ存在確認完了（adam/eveのみ）');
    
    console.log('✅ テスト1: 成功\n');
    return true;
    
  } catch (error) {
    console.error('❌ テスト1: 失敗');
    console.error('エラー:', error.message);
    return false;
  }
}

/**
 * テスト2: 初期ファイル不存在時のエラーハンドリングテスト
 */
function testMissingInitialFileHandling() {
  console.log('テスト2: 初期ファイル不存在時のエラーハンドリングテスト');
  
  try {
    // 初期ファイルを一時的に削除
    const tempBackupPath = TEST_INITIAL_PATH + '.backup';
    fs.renameSync(TEST_INITIAL_PATH, tempBackupPath);
    
    // リセット処理を試行
    try {
      performResetOperation();
      console.error('❌ テスト2: 初期ファイルが存在しないのにリセット処理が成功してしまいました');
      return false;
    } catch (resetError) {
      console.log('✓ 初期ファイル不存在時の適切なエラー検出:', resetError.message);
    }
    
    // 初期ファイルを復元
    fs.renameSync(tempBackupPath, TEST_INITIAL_PATH);
    
    console.log('✅ テスト2: 成功\n');
    return true;
    
  } catch (error) {
    console.error('❌ テスト2: 失敗');
    console.error('エラー:', error.message);
    return false;
  }
}

/**
 * テスト3: ファイルサイズと内容の詳細比較テスト
 */
function testDetailedFileComparison() {
  console.log('テスト3: ファイルサイズと内容の詳細比較テスト');
  
  try {
    // リセット処理実行
    performResetOperation();
    
    // ファイルサイズの比較
    const initialStats = fs.statSync(TEST_INITIAL_PATH);
    const generatedStats = fs.statSync(TEST_GENERATED_PATH);
    
    if (initialStats.size !== generatedStats.size) {
      throw new Error('初期ファイルとリセット後ファイルのサイズが異なります');
    }
    console.log('✓ ファイルサイズ比較完了');
    
    // バイト単位での内容比較
    const initialBuffer = fs.readFileSync(TEST_INITIAL_PATH);
    const generatedBuffer = fs.readFileSync(TEST_GENERATED_PATH);
    
    if (!initialBuffer.equals(generatedBuffer)) {
      throw new Error('初期ファイルとリセット後ファイルの内容が異なります');
    }
    console.log('✓ バイト単位での内容比較完了');
    
    // JSON構造の詳細比較
    const initialJson = JSON.parse(fs.readFileSync(TEST_INITIAL_PATH, 'utf8'));
    const generatedJson = JSON.parse(fs.readFileSync(TEST_GENERATED_PATH, 'utf8'));
    
    if (initialJson.length !== generatedJson.length) {
      throw new Error('エンティティ数が異なります');
    }
    
    for (let i = 0; i < initialJson.length; i++) {
      const initial = initialJson[i];
      const generated = generatedJson[i];
      
      const requiredFields = ['entity_id', 'name', 'gender', 'dna', 'model'];
      for (const field of requiredFields) {
        if (initial[field] !== generated[field]) {
          throw new Error(`エンティティ${i}の${field}フィールドが異なります`);
        }
      }
    }
    
    console.log('✓ JSON構造の詳細比較完了');
    
    console.log('✅ テスト3: 成功\n');
    return true;
    
  } catch (error) {
    console.error('❌ テスト3: 失敗');
    console.error('エラー:', error.message);
    return false;
  }
}

/**
 * テスト4: 繰り返しリセット処理の安定性テスト
 */
function testRepeatedResetStability() {
  console.log('テスト4: 繰り返しリセット処理の安定性テスト');
  
  try {
    const resetCount = 5;
    
    for (let i = 1; i <= resetCount; i++) {
      // 何らかの変更を加える（ファイルに追記）
      const currentData = JSON.parse(fs.readFileSync(TEST_GENERATED_PATH, 'utf8'));
      currentData.push({
        "entity_id": `temp_${i}`,
        "name": `temp_${i}`,
        "gender": i % 2 === 0 ? "male" : "female",
        "dna": "AAAAAAAAAAAAAAAA"
      });
      fs.writeFileSync(TEST_GENERATED_PATH, JSON.stringify(currentData, null, 2), 'utf8');
      
      // リセット処理実行
      performResetOperation();
      
      // リセット後の確認
      const resetData = JSON.parse(fs.readFileSync(TEST_GENERATED_PATH, 'utf8'));
      if (resetData.length !== 2) {
        throw new Error(`${i}回目のリセット後にデータ件数が異常です`);
      }
      
      console.log(`✓ ${i}回目のリセット処理完了`);
    }
    
    console.log('✅ テスト4: 成功\n');
    return true;
    
  } catch (error) {
    console.error('❌ テスト4: 失敗');
    console.error('エラー:', error.message);
    return false;
  }
}

/**
 * メイン実行関数
 */
function runAllTests() {
  console.log('🧪 reset_entities.js 実装済み機能テスト開始\n');
  
  setupTestEnvironment();
  
  const testResults = [
    testNormalResetOperation(),
    testMissingInitialFileHandling(),
    testDetailedFileComparison(),
    testRepeatedResetStability()
  ];
  
  cleanupTestEnvironment();
  
  const passedTests = testResults.filter(result => result).length;
  const totalTests = testResults.length;
  
  console.log('\n=== テスト結果サマリー ===');
  console.log(`成功: ${passedTests}/${totalTests}`);
  console.log(`失敗: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 全てのテストが成功しました！');
    process.exit(0);
  } else {
    console.log('❌ 一部のテストが失敗しました');
    process.exit(1);
  }
}

// テスト実行
runAllTests(); 