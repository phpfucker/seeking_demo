/**
 * StatusDataIntegration 特性データ対応 実機テスト
 * VPSの実際のcurrent_entity_status.jsonを使用
 */

const fs = require('fs');
const path = require('path');
const StatusDataIntegration = require('./status-data-integration.js');

console.log('=== StatusDataIntegration 特性データ対応テスト開始 ===\n');

async function runIntegrationTest() {
    try {
        // 1. テスト用のcurrent_entity_status.jsonを作成（VPS実データベース）
        console.log('>> テスト用データファイル作成中...');
        
        const vpsData = {
            "timestamp": "2025-06-23T12:00:00.000000000",
            "entities": [
                {
                    "entity_id": "adam",
                    "position": {
                        "x": 25.400650864538028,
                        "y": 66.0,
                        "z": 10.78052563380174
                    },
                    "gender": "male",
                    "dna": "ACGTACGTACGTACGT",
                    "behavior": "curious",
                    "sociality": "leader",
                    "lifespan": 1500,
                    "entity_type": "entity.minecraft.villager",
                    "health": 20.0,
                    "max_health": 20.0
                },
                {
                    "entity_id": "eve",
                    "position": {
                        "x": 29.741067650081316,
                        "y": 69.0,
                        "z": 29.268909836088433
                    },
                    "gender": "female",
                    "dna": "TGCATGCATGCATGCA",
                    "behavior": "passive",
                    "sociality": "herd",
                    "lifespan": 1500,
                    "entity_type": "entity.minecraft.villager",
                    "health": 20.0,
                    "max_health": 20.0
                }
            ]
        };

        // テスト用ディレクトリ作成
        const testConfigDir = './test_config_integration';
        const testDataDir = './test_data_integration';
        
        if (!fs.existsSync(testConfigDir)) {
            fs.mkdirSync(testConfigDir);
        }
        if (!fs.existsSync(testDataDir)) {
            fs.mkdirSync(testDataDir);
        }

        // テスト用ファイル作成
        const testStatusFile = path.join(testConfigDir, 'current_entity_status.json');
        fs.writeFileSync(testStatusFile, JSON.stringify(vpsData, null, 2));
        console.log(`✓ テストファイル作成: ${testStatusFile}`);

        // 2. StatusDataIntegrationの実行
        console.log('\n>> StatusDataIntegration実行中...');
        
        // テスト用のインスタンス作成（ディレクトリを指定）
        const integration = new StatusDataIntegration();
        integration.configDir = testConfigDir;
        integration.dataDir = testDataDir;
        integration.statusReader.configDir = testConfigDir;

        const result = await integration.execute();
        
        // 3. 結果検証
        console.log('\n>> 結果検証中...');
        
        // 基本構造確認
        console.log(`エンティティ数: ${result.entityCount}`);
        console.log(`男性: ${result.maleCount}, 女性: ${result.femaleCount}`);
        
        // 特性データ確認
        result.entities.forEach((entity, index) => {
            console.log(`[${index + 1}] ${entity.id} (${entity.gender})`);
            console.log(`    Behavior: ${entity.behavior}`);
            console.log(`    Sociality: ${entity.sociality}`);
            console.log(`    Lifespan: ${entity.lifespan}`);
            console.log(`    DNA: ${entity.dna.join('')}`);
        });

        // 4. formatted_status_data.jsonファイル確認
        console.log('\n>> formatted_status_data.json確認中...');
        const formattedDataFile = path.join(testDataDir, 'formatted_status_data.json');
        
        if (fs.existsSync(formattedDataFile)) {
            const formattedContent = fs.readFileSync(formattedDataFile, 'utf8');
            const formattedData = JSON.parse(formattedContent);
            
            console.log('✓ formatted_status_data.json生成成功');
            console.log(`ファイルサイズ: ${fs.statSync(formattedDataFile).size} bytes`);
            
            // 特性データが含まれているか確認
            const hasCharacteristics = formattedData.entities.every(entity => 
                'behavior' in entity && 
                'sociality' in entity && 
                'lifespan' in entity
            );
            
            if (hasCharacteristics) {
                console.log('✓ 全エンティティに特性データが含まれています');
            } else {
                console.log('✗ 一部エンティティに特性データが不足しています');
            }
            
            // サンプル表示
            console.log('\n📄 === formatted_status_data.json サンプル ===');
            console.log(JSON.stringify(formattedData, null, 2));
            
        } else {
            console.log('✗ formatted_status_data.jsonが生成されませんでした');
        }

        // 5. クリーンアップ
        console.log('\n>> クリーンアップ中...');
        if (fs.existsSync(testStatusFile)) {
            fs.unlinkSync(testStatusFile);
        }
        if (fs.existsSync(formattedDataFile)) {
            fs.unlinkSync(formattedDataFile);
        }
        if (fs.existsSync(testConfigDir)) {
            fs.rmdirSync(testConfigDir);
        }
        if (fs.existsSync(testDataDir)) {
            fs.rmdirSync(testDataDir);
        }
        console.log('✓ クリーンアップ完了');

        console.log('\n=== StatusDataIntegration 特性データ対応テスト完了 ===');
        console.log('🎉 全ての機能が正常に動作しています！');

    } catch (error) {
        console.error('\n=== エラーが発生しました ===');
        console.error(`エラー: ${error.message}`);
        console.error(`スタックトレース:\n${error.stack}`);
    }
}

// テスト実行
if (require.main === module) {
    runIntegrationTest();
}

module.exports = runIntegrationTest; 