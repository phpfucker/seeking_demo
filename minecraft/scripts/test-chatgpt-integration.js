const fs = require('fs').promises;
const path = require('path');
const { ChatGPTEvolutionProcessor } = require('./chatgpt-evolution-processor');
const { AiRequestGenerator } = require('./ai-request-generator');

/**
 * ChatGPT進化処理の統合テスト
 * 実際のAPIキーを使用してChatGPTとの通信をテスト
 */

async function runIntegrationTest() {
    console.log('=== ChatGPT Evolution Processor Integration Test ===\n');
    
    try {
        // 1. 実際のデータを読み込み
        console.log('📁 Reading test data files...');
        
        const testAiRequestPath = path.join(__dirname, 'data', 'test_ai_request_data.json');
        const aiRequestPath = path.join(__dirname, 'data', 'ai_request_data.json');
        let aiRequestData;
        
        try {
            // まずテスト用データを試す
            const rawData = await fs.readFile(testAiRequestPath, 'utf8');
            aiRequestData = JSON.parse(rawData);
            console.log('✅ Test AI request data loaded successfully');
        } catch (error) {
            try {
                // テスト用データがない場合は実際のデータを試す
                const rawData = await fs.readFile(aiRequestPath, 'utf8');
                aiRequestData = JSON.parse(rawData);
                console.log('✅ AI request data loaded successfully');
            } catch (error) {
                console.log('⚠️  AI request data not found, generating from existing data...');
                
                // AIリクエストデータが存在しない場合は生成
                const generator = new AiRequestGenerator();
                await generator.generateAiRequestData();
                
                const rawData = await fs.readFile(aiRequestPath, 'utf8');
                aiRequestData = JSON.parse(rawData);
                console.log('✅ AI request data generated and loaded');
            }
        }
        
        // 2. データ構造の確認
        console.log('\n📊 Data structure validation...');
        console.log(`- Breeding pairs: ${aiRequestData.breeding_pairs?.length || 0}`);
        console.log(`- Available entities: ${aiRequestData.available_entities?.length || 0}`);
        console.log(`- User guidance: ${aiRequestData.user_guidance ? 'Present' : 'Not set'}`);
        
        // 3. ChatGPTEvolutionProcessorの初期化とテスト
        console.log('\n🤖 Initializing ChatGPT Evolution Processor...');
        const processor = new ChatGPTEvolutionProcessor();
        
        // 4. リクエストデータの検証
        console.log('🔍 Validating request data...');
        processor.validateRequestData(aiRequestData);
        console.log('✅ Request data validation passed');
        
        // 5. ChatGPT APIの呼び出し
        console.log('\n🚀 Calling ChatGPT API...');
        console.log('This may take 10-30 seconds...');
        
        const startTime = Date.now();
        const result = await processor.processEvolution(aiRequestData);
        const endTime = Date.now();
        
        console.log(`✅ ChatGPT API call completed in ${(endTime - startTime) / 1000}s`);
        
        // 6. レスポンスの検証と表示
        console.log('\n📋 Response validation and analysis...');
        processor.validateResponseData(result);
        console.log('✅ Response data validation passed');
        
        // 結果の詳細表示
        console.log('\n=== Evolution Results ===');
        for (let i = 0; i < result.breeding_results.length; i++) {
            const breedingResult = result.breeding_results[i];
            console.log(`\nBreeding Pair ${i + 1}:`);
            
            for (let j = 0; j < breedingResult.children.length; j++) {
                const child = breedingResult.children[j];
                console.log(`  Child ${j + 1}:`);
                console.log(`    - ID: ${child.entity_id}`);
                console.log(`    - Name: ${child.name}`);
                console.log(`    - Gender: ${child.gender}`);
                console.log(`    - Entity Type: ${child.selected_entity}`);
                console.log(`    - Behavior: ${child.behavior}`);
                console.log(`    - Sociality: ${child.sociality}`);
                console.log(`    - Lifespan: ${child.lifespan}`);
                console.log(`    - Parents: ${child.parent_ids.join(', ')}`);
                console.log(`    - Generation: ${child.generation}`);
                console.log(`    - DNA Length: ${child.dna.length}`);
            }
        }
        
        // 7. 結果の保存
        console.log('\n💾 Saving evolution result...');
        await processor.saveEvolutionResult(result);
        console.log('✅ Evolution result saved to data/evolution_result.json');
        
        // 8. 保存されたファイルの確認
        const savedPath = path.join(__dirname, 'data', 'evolution_result.json');
        const savedData = JSON.parse(await fs.readFile(savedPath, 'utf8'));
        console.log(`✅ Saved file verified (${Object.keys(savedData).length} top-level keys)`);
        
        console.log('\n🎉 Integration test completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Integration test failed:');
        console.error(error.message);
        
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        
        process.exit(1);
    }
}

// スクリプトが直接実行された場合にテストを実行
if (require.main === module) {
    runIntegrationTest();
}

module.exports = { runIntegrationTest }; 