const fs = require('fs').promises;
const path = require('path');

/**
 * 5.5.2 進化結果統合処理
 * ChatGPTから返された進化結果をMinecraft MOD用のフォーマットに変換し、
 * generated_entities.jsonに統合する処理
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */

class EvolutionResultIntegrator {
    
    /**
     * コンストラクタ
     * 
     * @param {Object} options - 設定オプション
     * @param {string} options.evolutionResultPath - evolution_result.jsonのパス
     * @param {string} options.modelsConfigPath - models_skins_animations.jsonのパス  
     * @param {string} options.outputPath - 出力先generated_entities.jsonのパス
     */
    constructor(options = {}) {
        this.evolutionResultPath = options.evolutionResultPath || path.join(__dirname, 'data', 'evolution_result.json');
        this.modelsConfigPath = options.modelsConfigPath || path.join(__dirname, '..', 'config', 'models_skins_animations.json');
        
        // VPS環境ではNODE_ENV=productionで本番パスを使用
        this.outputPath = options.outputPath || (process.env.NODE_ENV === 'production' 
            ? '/opt/minecraft_forge_server/config/generated_entities.json'
            : path.join(__dirname, '..', 'config', 'generated_entities.json'));
        
        this.modelsConfig = null;
    }

    /**
     * evolution_result.jsonファイルを読み込む
     * 
     * @returns {Object} 進化結果データ
     * @throws {Error} ファイル読み込みエラー
     */
    async loadEvolutionResult() {
        try {
            const data = await fs.readFile(this.evolutionResultPath, 'utf8');
            const evolutionData = JSON.parse(data);
            
            // データ構造検証
            if (!evolutionData.breeding_results) {
                throw new Error('breeding_results not found in evolution result');
            }
            
            if (!Array.isArray(evolutionData.breeding_results)) {
                throw new Error('breeding_results must be an array');
            }
            
            return evolutionData;
            
        } catch (error) {
            throw new Error('Failed to load evolution result: ' + error.message);
        }
    }

    /**
     * models_skins_animations.jsonを読み込む
     * 
     * @returns {Object} モデル設定データ
     * @throws {Error} ファイル読み込みエラー
     */
    async loadModelsConfig() {
        if (this.modelsConfig) {
            return this.modelsConfig;
        }
        
        try {
            const data = await fs.readFile(this.modelsConfigPath, 'utf8');
            this.modelsConfig = JSON.parse(data);
            
            if (!this.modelsConfig.entities || !Array.isArray(this.modelsConfig.entities)) {
                throw new Error('Invalid models config format');
            }
            
            return this.modelsConfig;
            
        } catch (error) {
            throw new Error('Failed to load models config: ' + error.message);
        }
    }

    /**
     * エンティティタイプに対応するモデル、テクスチャ、アニメーションパスを解決
     * 
     * @param {string} entityType - エンティティタイプ名
     * @returns {Object} パス情報 {model, texture, animation}
     * @throws {Error} エンティティタイプが見つからない場合
     */
    async resolveEntityPaths(entityType) {
        const modelsConfig = await this.loadModelsConfig();
        
        const entityConfig = modelsConfig.entities.find(entity => entity.name === entityType);
        
        if (!entityConfig) {
            throw new Error("Entity type '" + entityType + "' not found in models config");
        }
        
        return {
            model: entityConfig.model,
            texture: entityConfig.texture,
            animation: entityConfig.animation
        };
    }

    /**
     * 進化結果データをMinecraft MOD用フォーマットに変換
     * 
     * @param {Object} evolutionData - 進化結果データ
     * @returns {Array} 変換されたエンティティ配列
     * @throws {Error} 変換エラー
     */
    async convertToMinecraftFormat(evolutionData) {
        const convertedEntities = [];
        
        for (const breedingResult of evolutionData.breeding_results) {
            if (!breedingResult.children || !Array.isArray(breedingResult.children)) {
                continue;
            }
            
            for (const child of breedingResult.children) {
                try {
                    // エンティティパス解決
                    const entityPaths = await this.resolveEntityPaths(child.selected_entity);
                    
                    // DNA配列を文字列に変換
                    const dnaString = Array.isArray(child.dna) ? child.dna.join('') : child.dna;
                    
                    // Minecraft MOD形式に変換
                    const convertedEntity = {
                        entity_id: child.entity_id,
                        name: child.name,
                        gender: child.gender,
                        parent_ids: child.parent_ids,
                        generation: child.generation,
                        dna: dnaString,
                        model: entityPaths.model,
                        texture: entityPaths.texture,
                        animation: entityPaths.animation,
                        behavior: child.behavior,
                        sociality: child.sociality,
                        lifespan: child.lifespan,
                        // 座標はランダム生成（5.5.1.2要件）
                        x: this.generateRandomCoordinate(),
                        y: 64, // 地表レベル
                        z: this.generateRandomCoordinate(),
                        // タイムスタンプ追加
                        created_at: new Date().toISOString()
                    };
                    
                    convertedEntities.push(convertedEntity);
                    
                } catch (error) {
                    console.error('Failed to convert entity ' + child.entity_id + ':', error.message);
                    // 1つのエンティティ変換失敗は全体を止めない
                    continue;
                }
            }
        }
        
        return convertedEntities;
    }

    /**
     * ランダム座標生成（-100から100の範囲）
     * 
     * @returns {number} ランダム座標
     */
    generateRandomCoordinate() {
        return Math.floor(Math.random() * 201) - 100; // -100 to 100
    }

    /**
     * generated_entities.jsonに統合結果を保存（上書き）
     * 
     * @param {Array} entities - 保存するエンティティ配列
     * @throws {Error} ファイル保存エラー
     */
    async saveGeneratedEntities(entities) {
        try {
            // 出力ディレクトリが存在しない場合は作成
            const outputDir = path.dirname(this.outputPath);
            await fs.mkdir(outputDir, { recursive: true });
            
            const outputData = JSON.stringify(entities, null, 2);
            await fs.writeFile(this.outputPath, outputData, 'utf8');
            
            console.log('Generated entities saved to: ' + this.outputPath);
            console.log('Total entities: ' + entities.length);
            
        } catch (error) {
            throw new Error('Failed to save generated entities: ' + error.message);
        }
    }

    /**
     * 統合処理メイン関数
     * evolution_result.jsonを読み込み、変換してgenerated_entities.jsonに保存
     * 
     * @returns {Object} 処理結果サマリー
     * @throws {Error} 統合処理エラー
     */
    async integrate() {
        const startTime = Date.now();
        
        try {
            console.log('Starting evolution result integration...');
            
            // 1. 進化結果読み込み
            console.log('Loading evolution result...');
            const evolutionData = await this.loadEvolutionResult();
            
            // 2. データ変換
            console.log('Converting to minecraft format...');
            const convertedEntities = await this.convertToMinecraftFormat(evolutionData);
            
            if (convertedEntities.length === 0) {
                throw new Error('No entities were converted');
            }
            
            // 3. ファイル保存（上書き）
            console.log('Saving generated entities...');
            await this.saveGeneratedEntities(convertedEntities);
            
            const processingTime = Date.now() - startTime;
            
            const result = {
                success: true,
                entities_processed: convertedEntities.length,
                processing_time: processingTime + 'ms',
                output_path: this.outputPath,
                timestamp: new Date().toISOString()
            };
            
            console.log('Integration completed successfully!');
            console.log('Entities processed: ' + result.entities_processed);
            console.log('Processing time: ' + result.processing_time);
            
            return result;
            
        } catch (error) {
            const processingTime = Date.now() - startTime;
            
            const result = {
                success: false,
                error: error.message,
                processing_time: processingTime + 'ms',
                timestamp: new Date().toISOString()
            };
            
            console.error('Integration failed:', error.message);
            
            return result;
        }
    }
}

module.exports = EvolutionResultIntegrator;

/**
 * 本番実行用クラス
 */
class EvolutionResultRunner {
    constructor() {
        this.integrator = new EvolutionResultIntegrator();
    }

    /**
     * 環境チェック
     */
    async checkEnvironment() {
        const fs = require('fs').promises;
        
        // evolution_result.json の存在確認
        try {
            await fs.access(this.integrator.evolutionResultPath);
        } catch (error) {
            throw new Error('evolution_result.json not found. Please run ChatGPT evolution first.');
        }
        
        // models_skins_animations.json の存在確認
        try {
            await fs.access(this.integrator.modelsConfigPath);
        } catch (error) {
            throw new Error('models_skins_animations.json not found in config directory.');
        }
    }

    /**
     * 結果サマリー表示
     */
    displayResultSummary(result) {
        console.log('\n=== Integration Result Summary ===');
        console.log(`✅ Success: ${result.success}`);
        console.log(`📊 Entities processed: ${result.entities_processed}`);
        console.log(`⏱️  Processing time: ${result.processing_time}`);
        console.log(`📁 Output file: ${result.output_path}`);
        console.log(`🕐 Timestamp: ${result.timestamp}`);
        
        if (!result.success) {
            console.log(`❌ Error: ${result.error}`);
        }
    }

    /**
     * メイン実行関数
     */
    async execute() {
        console.log('🚀 === Evolution Result Integration Start ===');
        
        try {
            // 1. 環境チェック
            console.log('🔍 Checking environment...');
            await this.checkEnvironment();
            console.log('✅ Environment check passed');
            
            // 環境とパス情報を表示
            const isProduction = process.env.NODE_ENV === 'production';
            console.log(`🏗️  Environment: ${isProduction ? 'Production (VPS)' : 'Development'}`);
            console.log(`📁 Output path: ${this.integrator.outputPath}`);

            // 2. 統合処理実行
            console.log('⚙️  Starting integration process...');
            const startTime = Date.now();
            
            const result = await this.integrator.integrate();
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`✅ Integration completed in ${duration}s`);

            // 3. 結果サマリー表示
            this.displayResultSummary(result);

            console.log('\n🎉 === Evolution Result Integration Complete ===');
            return result;

        } catch (error) {
            console.error('❌ Evolution result integration failed:', error.message);
            process.exit(1);
        }
    }
}

// 直接実行チェック
if (require.main === module) {
    const runner = new EvolutionResultRunner();
    runner.execute().catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
}
