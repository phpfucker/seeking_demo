/**
 * 5.6 統合テスト
 * 進化サイクル自動化の統合テスト
 */

const AutoMinecraftEvolution = require('./auto-minecraft-evolution');
const EvolutionValidator = require('./evolution-validator');

/**
 * 統合テスト実行
 */
async function runIntegrationTest() {
    console.log('=== 5.6 進化サイクル自動化 統合テスト開始 ===\n');

    try {
        // 1. バリデーターのテスト
        console.log('1. バリデーション機能のテスト...');
        const validator = new EvolutionValidator();
        
        // 既存のデータファイルがあれば検証
        const validationResults = await validator.validateAllData();
        console.log(`   バリデーション結果: ${validationResults.success ? '✅ 成功' : '❌ 失敗'}`);
        
        if (!validationResults.success) {
            console.log('   エラー詳細:');
            validationResults.errors.forEach(error => {
                console.log(`     - ${error}`);
            });
        }

        // 2. 環境チェック
        console.log('\n2. 環境設定のテスト...');
        const app = new AutoMinecraftEvolution();
        
        await app.checkEnvironment();
        console.log('   ✅ 環境チェック完了');

        // 3. RCON接続テスト
        console.log('\n3. RCON接続のテスト...');
        const rconResult = await app.cycleManager.rconManager.testConnection();
        console.log(`   RCON接続: ${rconResult.success ? '✅ 成功' : '⚠️ 失敗 - ' + rconResult.error}`);

        // 4. ステータス表示
        console.log('\n4. システム状態の確認...');
        await app.showStatus();

        console.log('\n=== 5.6 統合テスト完了 ===');
        
        return {
            success: true,
            validation: validationResults.success,
            rcon: rconResult.success
        };

    } catch (error) {
        console.error('❌ 統合テスト失敗:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// 直接実行された場合
if (require.main === module) {
    runIntegrationTest()
        .then(result => {
            if (result.success) {
                console.log('\n✅ 全体的なテスト結果: 成功');
                process.exit(0);
            } else {
                console.log('\n❌ 全体的なテスト結果: 失敗');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('テスト実行エラー:', error);
            process.exit(1);
        });
}

module.exports = { runIntegrationTest };
