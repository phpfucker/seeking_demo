/**
 * Evolution Data Validator
 * 5.6.6 バリデーション機能の実装
 * 
 * @file evolution-validator.js
 * @description ChatGPTからのレスポンスを含む、生成される全てのJSONデータの検証
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * 進化データの検証を行うクラス
 */
class EvolutionValidator {
    constructor(options = {}) {
        this.options = {
            strictMode: options.strictMode || false,
            logValidationErrors: options.logValidationErrors !== false,
            ...options
        };
    }

    /**
     * 全JSONファイルの検証を実行
     */
    async validateAllData() {
        const results = {
            success: true,
            validations: {},
            errors: []
        };

        try {
            // 各ステップのJSONファイルを検証
            const validations = await Promise.all([
                this.validateFormattedStatusData(),
                this.validateBreedingPairsResult(),
                this.validateAiRequestData(),
                this.validateEvolutionResult(),
                this.validateGeneratedEntities()
            ]);

            validations.forEach((validation, index) => {
                const files = [
                    'formatted_status_data.json',
                    'breeding_pairs_result.json',
                    'ai_request_data.json',
                    'evolution_result.json',
                    'generated_entities.json'
                ];
                
                results.validations[files[index]] = validation;
                
                if (!validation.valid) {
                    results.success = false;
                    results.errors.push(...validation.errors);
                }
            });

        } catch (error) {
            results.success = false;
            results.errors.push(`Validation process error: ${error.message}`);
        }

        return results;
    }

    /**
     * formatted_status_data.json の検証
     */
    async validateFormattedStatusData() {
        try {
            const dataPath = path.join(__dirname, 'data', 'formatted_status_data.json');
            const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));

            const errors = [];

            // 基本構造の検証
            if (!data.entities || !Array.isArray(data.entities)) {
                errors.push('entities array is missing or invalid');
            }

            if (typeof data.entityCount !== 'number') {
                errors.push('entityCount must be a number');
            }

            if (typeof data.maleCount !== 'number' || typeof data.femaleCount !== 'number') {
                errors.push('maleCount and femaleCount must be numbers');
            }

            // 各エンティティの検証
            if (data.entities) {
                data.entities.forEach((entity, index) => {
                    const entityErrors = this.validateEntityData(entity, `entities[${index}]`);
                    errors.push(...entityErrors);
                });
            }

            return {
                valid: errors.length === 0,
                errors
            };

        } catch (error) {
            return {
                valid: false,
                errors: [`File read/parse error: ${error.message}`]
            };
        }
    }

    /**
     * 個別エンティティデータの検証
     */
    validateEntityData(entity, context = '') {
        const errors = [];
        const prefix = context ? `${context}: ` : '';

        // 必須フィールドの検証
        const requiredFields = ['id', 'gender', 'dna', 'position', 'health'];
        requiredFields.forEach(field => {
            if (!(field in entity)) {
                errors.push(`${prefix}Missing required field: ${field}`);
            }
        });

        // 型検証
        if (entity.gender && !['male', 'female'].includes(entity.gender)) {
            errors.push(`${prefix}Invalid gender: ${entity.gender}`);
        }

        if (entity.dna && !Array.isArray(entity.dna)) {
            errors.push(`${prefix}DNA must be an array`);
        }

        if (entity.position) {
            if (typeof entity.position.x !== 'number' || 
                typeof entity.position.y !== 'number' || 
                typeof entity.position.z !== 'number') {
                errors.push(`${prefix}Position coordinates must be numbers`);
            }
        }

        if (entity.health && typeof entity.health !== 'number') {
            errors.push(`${prefix}Health must be a number`);
        }

        // 特性データの検証（存在する場合）
        if (entity.behavior && typeof entity.behavior !== 'string') {
            errors.push(`${prefix}Behavior must be a string`);
        }

        if (entity.sociality && typeof entity.sociality !== 'string') {
            errors.push(`${prefix}Sociality must be a string`);
        }

        if (entity.lifespan && typeof entity.lifespan !== 'number') {
            errors.push(`${prefix}Lifespan must be a number`);
        }

        return errors;
    }

    /**
     * breeding_pairs_result.json の検証
     */
    async validateBreedingPairsResult() {
        try {
            const dataPath = path.join(__dirname, 'data', 'breeding_pairs_result.json');
            const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));

            const errors = [];

            // 基本構造の検証
            const requiredFields = ['totalEntities', 'totalPairs', 'distanceValidPairs', 'uniquePairs'];
            requiredFields.forEach(field => {
                if (!(field in data)) {
                    errors.push(`Missing required field: ${field}`);
                }
            });

            if (!Array.isArray(data.uniquePairs)) {
                errors.push('uniquePairs must be an array');
            }

            // 各ペアの検証
            data.uniquePairs?.forEach((pair, index) => {
                if (!pair.male || !pair.female) {
                    errors.push(`uniquePairs[${index}]: Missing male or female`);
                    return;
                }

                const maleErrors = this.validateEntityData(pair.male, `uniquePairs[${index}].male`);
                const femaleErrors = this.validateEntityData(pair.female, `uniquePairs[${index}].female`);
                
                errors.push(...maleErrors, ...femaleErrors);

                if (typeof pair.distance !== 'number') {
                    errors.push(`uniquePairs[${index}]: Distance must be a number`);
                }
            });

            return {
                valid: errors.length === 0,
                errors
            };

        } catch (error) {
            return {
                valid: false,
                errors: [`File read/parse error: ${error.message}`]
            };
        }
    }

    /**
     * evolution_result.json の検証
     */
    async validateEvolutionResult() {
        try {
            const dataPath = path.join(__dirname, 'data', 'evolution_result.json');
            const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));

            const errors = [];

            if (!data.breeding_results || !Array.isArray(data.breeding_results)) {
                errors.push('breeding_results array is missing or invalid');
                return { valid: false, errors };
            }

            data.breeding_results.forEach((result, resultIndex) => {
                if (!result.children || !Array.isArray(result.children)) {
                    errors.push(`breeding_results[${resultIndex}]: children array is missing`);
                    return;
                }

                result.children.forEach((child, childIndex) => {
                    const context = `breeding_results[${resultIndex}].children[${childIndex}]`;
                    const childErrors = this.validateChildData(child, context);
                    errors.push(...childErrors);
                });
            });

            return {
                valid: errors.length === 0,
                errors
            };

        } catch (error) {
            return {
                valid: false,
                errors: [`File read/parse error: ${error.message}`]
            };
        }
    }

    /**
     * 子個体データの検証
     */
    validateChildData(child, context = '') {
        const errors = [];
        const prefix = context ? `${context}: ` : '';

        const requiredFields = [
            'entity_id', 'name', 'gender', 'parent_ids', 
            'generation', 'dna', 'selected_entity',
            'behavior', 'sociality', 'lifespan'
        ];

        requiredFields.forEach(field => {
            if (!(field in child)) {
                errors.push(`${prefix}Missing required field: ${field}`);
            }
        });

        // 型検証
        if (child.gender && !['male', 'female'].includes(child.gender)) {
            errors.push(`${prefix}Invalid gender: ${child.gender}`);
        }

        if (child.parent_ids && !Array.isArray(child.parent_ids)) {
            errors.push(`${prefix}parent_ids must be an array`);
        }

        if (child.dna && !Array.isArray(child.dna)) {
            errors.push(`${prefix}dna must be an array`);
        }

        if (child.generation && typeof child.generation !== 'number') {
            errors.push(`${prefix}generation must be a number`);
        }

        return errors;
    }

    /**
     * ai_request_data.json の検証
     */
    async validateAiRequestData() {
        try {
            const dataPath = path.join(__dirname, 'data', 'ai_request_data.json');
            const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));

            const errors = [];

            if (!data.breeding_pairs || !Array.isArray(data.breeding_pairs)) {
                errors.push('breeding_pairs array is missing or invalid');
            }

            if (!data.available_entities || !Array.isArray(data.available_entities)) {
                errors.push('available_entities array is missing or invalid');
            }

            if (!data.genetics_rules || typeof data.genetics_rules !== 'object') {
                errors.push('genetics_rules object is missing or invalid');
            }

            return {
                valid: errors.length === 0,
                errors
            };

        } catch (error) {
            return {
                valid: false,
                errors: [`File read/parse error: ${error.message}`]
            };
        }
    }

    /**
     * generated_entities.json の検証
     */
    async validateGeneratedEntities() {
        try {
            const dataPath = process.env.NODE_ENV === 'production'
                ? '/opt/minecraft_forge_server/config/generated_entities.json'
                : path.join(__dirname, '../config/generated_entities.json');
                
            const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));

            const errors = [];

            if (!Array.isArray(data)) {
                errors.push('Root element must be an array');
                return { valid: false, errors };
            }

            data.forEach((entity, index) => {
                const entityErrors = this.validateGeneratedEntityData(entity, `entities[${index}]`);
                errors.push(...entityErrors);
            });

            return {
                valid: errors.length === 0,
                errors
            };

        } catch (error) {
            return {
                valid: false,
                errors: [`File read/parse error: ${error.message}`]
            };
        }
    }

    /**
     * 生成されたエンティティデータの検証
     */
    validateGeneratedEntityData(entity, context = '') {
        const errors = [];
        const prefix = context ? `${context}: ` : '';

        const requiredFields = [
            'entity_id', 'name', 'gender', 'dna', 'model', 'texture', 'animation',
            'behavior', 'sociality', 'lifespan', 'x', 'y', 'z'
        ];

        requiredFields.forEach(field => {
            if (!(field in entity)) {
                errors.push(`${prefix}Missing required field: ${field}`);
            }
        });

        // 座標の検証
        if (typeof entity.x !== 'number' || typeof entity.y !== 'number' || typeof entity.z !== 'number') {
            errors.push(`${prefix}Coordinates (x, y, z) must be numbers`);
        }

        // パスの検証
        const pathFields = ['model', 'texture', 'animation'];
        pathFields.forEach(field => {
            if (entity[field] && typeof entity[field] !== 'string') {
                errors.push(`${prefix}${field} must be a string path`);
            }
        });

        return errors;
    }

    /**
     * 検証結果をログファイルに記録
     */
    async logValidationResults(results) {
        if (!this.options.logValidationErrors) return;

        const logFile = process.env.NODE_ENV === 'production'
            ? '/opt/minecraft_forge_server/logs/validation.log'
            : './logs/validation.log';

        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] Validation ${results.success ? 'PASSED' : 'FAILED'}\n`;
        
        let logContent = logEntry;
        
        if (!results.success) {
            logContent += `Errors:\n${results.errors.map(err => `  - ${err}`).join('\n')}\n`;
        }

        logContent += '\n';

        try {
            const logDir = path.dirname(logFile);
            await fs.mkdir(logDir, { recursive: true });
            await fs.appendFile(logFile, logContent);
        } catch (error) {
            console.error('Validation log write error:', error.message);
        }
    }
}

module.exports = EvolutionValidator;
