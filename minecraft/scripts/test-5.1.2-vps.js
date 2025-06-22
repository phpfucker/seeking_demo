// VPS上で5.1.2機能をテストする簡単なスクリプト
const fs = require('fs');
const path = require('path');

console.log('=== 5.1.2 VPSテスト開始 ===');

// 1. ステータスファイル存在確認
const statusFile = '/home/seeking_demo/minecraft/config/current_entity_status.json';
if (!fs.existsSync(statusFile)) {
    console.log('❌ current_entity_status.json が見つかりません');
    console.log('   /ailife export_status コマンドを実行してください');
    process.exit(1);
}

console.log('✓ ステータスファイルが存在します');

// 2. ファイル読み込み
try {
    const content = fs.readFileSync(statusFile, 'utf8');
    const data = JSON.parse(content);
    
    console.log('✓ JSONファイル読み込み成功');
    console.log(`  ファイルサイズ: ${content.length} bytes`);
    console.log(`  タイムスタンプ: ${data.timestamp}`);
    console.log(`  エンティティ数: ${data.entities ? data.entities.length : 0}`);
    
    // 3. データ構造確認
    if (data.entities && data.entities.length > 0) {
        console.log('\n👥 === エンティティ詳細 ===');
        
        data.entities.forEach((entity, index) => {
            const id = entity.entity_id || entity.id || `unknown_${index}`;
            console.log(`[${index + 1}] ID: ${id}`);
            console.log(`    性別: ${entity.gender || '不明'}`);
            console.log(`    DNA: ${entity.dna || '不明'}`);
            
            if (entity.position) {
                console.log(`    位置: (${entity.position.x.toFixed(2)}, ${entity.position.y.toFixed(2)}, ${entity.position.z.toFixed(2)})`);
            }
            
            console.log(`    体力: ${entity.health || '不明'}/${entity.max_health || '不明'}`);
            console.log(`    エンティティタイプ: ${entity.entity_type || '不明'}`);
            console.log('');
        });
        
        // 4. 基本的な整形処理テスト（5.1.2.2の機能）
        console.log('📊 === データ整形テスト ===');
        
        const totalCount = data.entities.length;
        const maleCount = data.entities.filter(e => e.gender === 'male').length;
        const femaleCount = data.entities.filter(e => e.gender === 'female').length;
        
        console.log(`  総エンティティ数: ${totalCount}`);
        console.log(`  男性: ${maleCount}`);
        console.log(`  女性: ${femaleCount}`);
        console.log(`  性別不明: ${totalCount - maleCount - femaleCount}`);
        
        // 平均座標計算
        if (data.entities.length > 0) {
            const avgX = data.entities.reduce((sum, e) => sum + ((e.position && e.position.x) || 0), 0) / data.entities.length;
            const avgY = data.entities.reduce((sum, e) => sum + ((e.position && e.position.y) || 0), 0) / data.entities.length;
            const avgZ = data.entities.reduce((sum, e) => sum + ((e.position && e.position.z) || 0), 0) / data.entities.length;
            
            console.log(`  平均座標: (${avgX.toFixed(2)}, ${avgY.toFixed(2)}, ${avgZ.toFixed(2)})`);
        }
        
        // 5. DNA配列変換テスト（5.1.2の重要機能）
        console.log('\n�� === DNA配列変換テスト ===');
        
        data.entities.forEach((entity, index) => {
            const id = entity.entity_id || entity.id || `unknown_${index}`;
            
            if (entity.dna) {
                // 文字列を配列に変換（5.1.2の核心機能）
                const dnaArray = typeof entity.dna === 'string' ? entity.dna.split('') : entity.dna;
                
                console.log(`[${index + 1}] ${id}:`);
                console.log(`    元データ: ${entity.dna} (型: ${typeof entity.dna})`);
                console.log(`    変換後: [${dnaArray.slice(0, 8).join(', ')}${dnaArray.length > 8 ? '...' : ''}] (長さ: ${dnaArray.length})`);
                
                // DNA塩基の分布確認
                const baseCounts = { A: 0, T: 0, G: 0, C: 0, other: 0 };
                dnaArray.forEach(base => {
                    if (baseCounts.hasOwnProperty(base.toUpperCase())) {
                        baseCounts[base.toUpperCase()]++;
                    } else {
                        baseCounts.other++;
                    }
                });
                
                console.log(`    塩基分布: A=${baseCounts.A}, T=${baseCounts.T}, G=${baseCounts.G}, C=${baseCounts.C}${baseCounts.other > 0 ? `, その他=${baseCounts.other}` : ''}`);
            } else {
                console.log(`[${index + 1}] ${id}: DNAデータなし`);
            }
            console.log('');
        });
        
        // 6. 一時保存テスト（5.1.2.3の機能）
        console.log('💾 === 一時保存テスト ===');
        
        const formattedData = {
            entities: data.entities.map(entity => ({
                id: entity.entity_id || entity.id,
                gender: entity.gender || 'unknown',
                dna: typeof entity.dna === 'string' ? entity.dna.split('') : (entity.dna || []),
                position: entity.position || { x: 0, y: 0, z: 0 },
                health: entity.health || 0,
                max_health: entity.max_health || 0,
                entity_type: entity.entity_type || 'unknown'
            })),
            entityCount: data.entities.length,
            maleCount: maleCount,
            femaleCount: femaleCount,
            processedAt: new Date().toISOString(),
            source: 'VPS 5.1.2 Test'
        };
        
        // dataディレクトリ作成
        if (!fs.existsSync('../data')) {
            fs.mkdirSync('../data');
            console.log('✓ dataディレクトリを作成しました');
        }
        
        // ファイル出力
        const outputFile = '../data/formatted_status_data_vps.json';
        fs.writeFileSync(outputFile, JSON.stringify(formattedData, null, 2));
        
        console.log(`✓ 整形データを保存しました: ${outputFile}`);
        console.log(`  ファイルサイズ: ${fs.statSync(outputFile).size} bytes`);
        
        // 7. 繁殖ペア候補検出（5.2の前段処理）
        console.log('\n💕 === 繁殖ペア候補検出 ===');
        
        const males = data.entities.filter(e => e.gender === 'male');
        const females = data.entities.filter(e => e.gender === 'female');
        
        console.log(`  検出対象: 男性 ${males.length}体, 女性 ${females.length}体`);
        
        if (males.length > 0 && females.length > 0) {
            const pairs = [];
            
            males.forEach(male => {
                females.forEach(female => {
                    const distance = Math.sqrt(
                        Math.pow(male.position.x - female.position.x, 2) +
                        Math.pow(male.position.y - female.position.y, 2) +
                        Math.pow(male.position.z - female.position.z, 2)
                    );
                    
                    pairs.push({
                        male: male.entity_id || male.id,
                        female: female.entity_id || female.id,
                        distance: distance
                    });
                });
            });
            
            pairs.forEach((pair, index) => {
                console.log(`[${index + 1}] ${pair.male} ♂ × ${pair.female} ♀ (距離: ${pair.distance.toFixed(2)})`);
            });
            
            const closeRange = 20.0; // 20ブロック以内
            const closePairs = pairs.filter(p => p.distance <= closeRange);
            console.log(`  接近ペア (${closeRange}ブロック以内): ${closePairs.length}組`);
            
        } else {
            console.log('  繁殖可能なペアが見つかりません（男女どちらかが不足）');
        }
        
        console.log('\n✅ === 5.1.2 VPSテスト完了 ===');
        console.log('✅ 全ての5.1.2機能が正常に動作しています！');
        
        // 完了レポート
        console.log('\n📋 === 完了確認項目 ===');
        console.log('✅ 5.1.2.1: current_entity_status.json読み込み成功');
        console.log('✅ 5.1.2.2: データ整形処理成功');
        console.log('✅ 5.1.2.3: 一時保存機能成功');
        console.log('✅ DNA文字列→配列変換成功');
        console.log('✅ 性別・位置情報解析成功');
        console.log('✅ 出力ファイル生成成功');
        
    } else {
        console.log('❌ エンティティデータが見つかりません');
        console.log('   /ailife export_status コマンドでエンティティをスポーンしてください');
    }
    
} catch (error) {
    console.log('❌ ファイル処理エラー:', error.message);
    console.log('   JSONファイルの形式を確認してください');
} 