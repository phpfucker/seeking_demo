/**
 * Status Data Integration Script
 * 5.1.2 Node.js側: 出力されたリアルタイム状態データの読み込みと整形
 * Java MODからのステータスデータを読み込み、次の繁殖サイクルの準備を行う
 */

const StatusDataReader = require('./status-data-reader.js');
const fs = require('fs');
const path = require('path');

/**
 * ステータスデータ統合管理クラス
 */
class StatusDataIntegration {
    constructor() {
        // 業界標準：デフォルトは開発環境、--productionフラグで本番環境
        this.configDir = process.env.NODE_ENV === 'production' 
            ? '/opt/minecraft_forge_server/config' 
            : './config';
        this.dataDir = './data';
        this.statusReader = new StatusDataReader(this.configDir);
    }

    /**
     * メイン実行関数
     * 5.1.2.1から5.1.2.3の全処理を統合実行
     */
    async execute() {
        console.log('=== 5.1.2 ステータスデータ統合処理開始 ===');
        
        try {
            // 5.1.2.1: Java MODが出力したcurrent_entity_status.jsonを読み込む
            console.log('📖 ステータスデータを読み込み中...');
            const entities = await this.statusReader.readStatusData();
            console.log(`✓ ${entities.length}体のエンティティデータを読み込みました`);

            // 5.1.2.2: 読み込んだデータを処理しやすい内部データ構造に整形
            console.log('🔄 データを整形中...');
            const formattedData = await this.statusReader.getFormattedDataMap();
            console.log(`✓ データ整形完了 - 男性: ${formattedData.maleCount}, 女性: ${formattedData.femaleCount}`);

            // 5.1.2.3: 整形したデータをファイルまたはメモリに一時的に保存
            console.log('💾 データを一時保存中...');
            await this.statusReader.saveToMemory();
            await this.saveFormattedDataToFile(formattedData);
            console.log('✓ データの一時保存完了');

            // 詳細レポート出力
            await this.generateDetailedReport(formattedData);

            console.log('\n=== 5.1.2 ステータスデータ統合処理完了 ===');
            return formattedData;

        } catch (error) {
            console.error('❌ ステータスデータ統合処理でエラーが発生:', error.message);
            throw error;
        }
    }

    /**
     * 整形されたデータをJSONファイルに保存
     */
    async saveFormattedDataToFile(formattedData) {
        const outputPath = path.join(this.dataDir, 'formatted_status_data.json');
        
        // タイムスタンプを追加
        const outputData = {
            ...formattedData,
            processedAt: new Date().toISOString(),
            source: 'StatusDataIntegration 5.1.2'
        };

        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
        console.log(`  → ファイル保存: ${outputPath}`);
    }

    /**
     * 詳細レポートを生成・出力
     */
    async generateDetailedReport(formattedData) {
        console.log('\n📊 === 詳細レポート ===');
        console.log(`総エンティティ数: ${formattedData.entityCount}`);
        console.log(`性別分布 - 男性: ${formattedData.maleCount}, 女性: ${formattedData.femaleCount}`);
        
        if (formattedData.averagePosition) {
            const pos = formattedData.averagePosition;
            console.log(`平均座標: X=${pos.x.toFixed(2)}, Y=${pos.y.toFixed(2)}, Z=${pos.z.toFixed(2)}`);
        }

        console.log('\n👥 === 個体詳細 ===');
        formattedData.entities.forEach((entity, index) => {
            console.log(`[${index + 1}] ${entity.id} (${entity.gender})`);
            console.log(`    DNA: [${entity.dna.join(', ')}]`);
            console.log(`    位置: (${entity.position.x}, ${entity.position.y}, ${entity.position.z})`);
            console.log(`    体力: ${entity.health}, 年齢: ${entity.age}`);
        });

        // 5.2の準備: 繁殖可能ペアの事前検出
        const breedingPairs = this.findPotentialBreedingPairs(formattedData.entities);
        console.log(`\n💕 === 繁殖可能ペア候補 ===`);
        console.log(`検出されたペア数: ${breedingPairs.length}`);
        
        breedingPairs.forEach((pair, index) => {
            const distance = this.calculateDistance(pair.male.position, pair.female.position);
            console.log(`[${index + 1}] ${pair.male.id} ♂ × ${pair.female.id} ♀ (距離: ${distance.toFixed(2)})`);
        });
    }

    /**
     * 繁殖可能ペアを検出（5.2の前段処理）
     */
    findPotentialBreedingPairs(entities) {
        const males = entities.filter(e => e.gender === 'male');
        const females = entities.filter(e => e.gender === 'female');
        const pairs = [];

        for (const male of males) {
            for (const female of females) {
                const distance = this.calculateDistance(male.position, female.position);
                // 仮の接近判定距離: 10ブロック以内
                if (distance <= 10.0) {
                    pairs.push({ male, female, distance });
                }
            }
        }

        return pairs;
    }

    /**
     * 2点間の距離を計算
     */
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * デバッグモード実行
     */
    async debugExecute() {
        console.log('🐛 === デバッグモード実行 ===');
        await this.statusReader.debugPrintData();
        return await this.execute();
    }
}

// 直接実行された場合
if (require.main === module) {
    // 開発環境での実行判定
    if (process.argv.includes('--dev') || process.argv.includes('--development')) {
        process.env.NODE_ENV = 'development';
        console.log('🔧  Development mode: Using ./config');
    } else {
        console.log('🖥️  Production mode: Using /opt/minecraft_forge_server/config');
    }
    
    const integration = new StatusDataIntegration();
    
    // コマンドライン引数でデバッグモードを制御
    const isDebugMode = process.argv.includes('--debug');
    
    if (isDebugMode) {
        integration.debugExecute().catch(console.error);
    } else {
        integration.execute().catch(console.error);
    }
}

module.exports = StatusDataIntegration; 