const fs = require('fs').promises;
const path = require('path');

/**
 * 5.5.1 新しい世代のエンティティ生成コマンド
 * initial_adam_eve.jsonテンプレートを使用してgenerated_entities.jsonを初期世代にリセット
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */

class GenerateEntitiesCommand {
    
    /**
     * コンストラクタ
     * 
     * @param {Object} options - 設定オプション
     * @param {string} options.initialTemplatePath - initial_adam_eve.jsonのパス
     * @param {string} options.outputPath - 出力先generated_entities.jsonのパス
     */
    constructor(options = {}) {
        this.initialTemplatePath = options.initialTemplatePath || path.join(__dirname, '..', 'config', 'initial_adam_eve.json');
        this.outputPath = options.outputPath || path.join(__dirname, '..', 'config', 'generated_entities.json');
    }

    /**
     * initial_adam_eve.jsonテンプレートを読み込む
     * 
     * @returns {Array} 初期世代エンティティテンプレート
     * @throws {Error} ファイル読み込みエラー
     */
    async loadInitialTemplate() {
        try {
            const data = await fs.readFile(this.initialTemplatePath, 'utf8');
            const template = JSON.parse(data);
            
            // データ構造検証
            if (!Array.isArray(template)) {
                throw new Error('Initial template must be an array');
            }
            
            if (template.length === 0) {
                throw new Error('Initial template cannot be empty');
            }
            
            // 各エンティティの必須フィールド検証
            for (const entity of template) {
                const requiredFields = ['entity_id', 'name', 'gender', 'generation', 'dna'];
                for (const field of requiredFields) {
                    if (entity[field] === undefined) {
                        throw new Error('Required field missing in template: ' + field);
                    }
                }
            }
            
            return template;
            
        } catch (error) {
            throw new Error('Failed to load initial template: ' + error.message);
        }
    }

    /**
     * ランダム座標を生成（-100から100の範囲）
     * 
     * @returns {Object} 座標 {x, y, z}
     */
    generateRandomCoordinates() {
        return {
            x: Math.floor(Math.random() * 201) - 100, // -100 to 100
            y: 64, // 地表レベル固定
            z: Math.floor(Math.random() * 201) - 100  // -100 to 100
        };
    }

    /**
     * エンティティの座標を更新（他のデータは保持）
     * 
     * @param {Object} entity - 更新対象のエンティティ
     * @returns {Object} 座標が更新されたエンティティ
     */
    updateEntityCoordinates(entity) {
        const newCoords = this.generateRandomCoordinates();
        
        return {
            ...entity,
            x: newCoords.x,
            y: newCoords.y,
            z: newCoords.z,
            created_at: new Date().toISOString()
        };
    }

    /**
     * generated_entities.jsonを初期世代（adam/eve）にリセット
     * 
     * @returns {Object} 処理結果
     * @throws {Error} リセット処理エラー
     */
    async resetToInitialGeneration() {
        try {
            console.log('Loading initial template...');
            const template = await this.loadInitialTemplate();
            
            console.log('Updating coordinates for initial entities...');
            const updatedEntities = template.map(entity => this.updateEntityCoordinates(entity));
            
            console.log('Saving to generated_entities.json...');
            await this.saveGeneratedEntities(updatedEntities);
            
            const result = {
                success: true,
                entities_count: updatedEntities.length,
                generation_reset_to: 1,
                timestamp: new Date().toISOString()
            };
            
            console.log('Reset to initial generation completed successfully!');
            console.log('Entities count: ' + result.entities_count);
            
            return result;
            
        } catch (error) {
            const result = {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            console.error('Reset to initial generation failed:', error.message);
            
            return result;
        }
    }

    /**
     * generated_entities.jsonに結果を保存
     * 
     * @param {Array} entities - 保存するエンティティ配列
     * @throws {Error} ファイル保存エラー
     */
    async saveGeneratedEntities(entities) {
        try {
            const outputData = JSON.stringify(entities, null, 2);
            await fs.writeFile(this.outputPath, outputData, 'utf8');
            
            console.log('Generated entities saved to: ' + this.outputPath);
            console.log('Total entities: ' + entities.length);
            
        } catch (error) {
            throw new Error('Failed to save generated entities: ' + error.message);
        }
    }

    /**
     * コマンド実行メイン関数
     * 
     * @returns {Object} 実行結果サマリー
     */
    async execute() {
        const startTime = Date.now();
        
        try {
            console.log('Starting entity generation command...');
            
            const result = await this.resetToInitialGeneration();
            
            if (!result.success) {
                return result;
            }
            
            const processingTime = Date.now() - startTime;
            
            const finalResult = {
                success: true,
                entities_generated: result.entities_count,
                generation_reset_to: result.generation_reset_to,
                processing_time: processingTime + 'ms',
                output_path: this.outputPath,
                timestamp: new Date().toISOString()
            };
            
            console.log('Entity generation command completed successfully!');
            console.log('Processing time: ' + finalResult.processing_time);
            
            return finalResult;
            
        } catch (error) {
            const processingTime = Date.now() - startTime;
            
            const result = {
                success: false,
                error: error.message,
                processing_time: processingTime + 'ms',
                timestamp: new Date().toISOString()
            };
            
            console.error('Entity generation command failed:', error.message);
            
            return result;
        }
    }
}

module.exports = GenerateEntitiesCommand;
