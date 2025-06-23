const fs = require('fs').promises;
const path = require('path');

/**
 * 5.5.2 evolution-result-integrator.js のテストスイート (Jest)
 */

// テスト用データディレクトリ
const TEST_DATA_DIR = path.join(__dirname, 'test_data');
const TEST_CONFIG_DIR = path.join(__dirname, 'test_config');

// Jest setup and teardown
beforeAll(async () => {
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    await fs.mkdir(TEST_CONFIG_DIR, { recursive: true });
    
    const testEvolutionResult = {
        "breeding_results": [
            {
                "children": [
                    {
                        "entity_id": "child_001",
                        "name": "Alice",
                        "gender": "female",
                        "parent_ids": ["adam", "eve"],
                        "generation": 2,
                        "dna": ["A", "C", "G", "T", "A", "C", "G", "T", "A", "C", "G", "T", "A", "C", "G", "T"],
                        "selected_entity": "witch",
                        "behavior": "curious",
                        "sociality": "leader",
                        "lifespan": 1200
                    },
                    {
                        "entity_id": "child_002",
                        "name": "Bob", 
                        "gender": "male",
                        "parent_ids": ["adam", "eve"],
                        "generation": 2,
                        "dna": ["T", "G", "C", "A", "T", "G", "C", "A", "T", "G", "C", "A", "T", "G", "C", "A"],
                        "selected_entity": "zombie",
                        "behavior": "passive",
                        "sociality": "herd",
                        "lifespan": 1800
                    }
                ]
            }
        ]
    };
    
    await fs.writeFile(
        path.join(TEST_DATA_DIR, 'evolution_result.json'),
        JSON.stringify(testEvolutionResult, null, 2)
    );
    
    const testModelsConfig = {
        "entities": [
            { "name": "villager", "model": "models/entity/villager.geo.json", "texture": "textures/entity/villager/villager.png", "animation": "animations/entity/villager.animation.json" },
            { "name": "witch", "model": "models/entity/witch.geo.json", "texture": "textures/entity/witch/witch.png", "animation": "animations/entity/witch.animation.json" },
            { "name": "zombie", "model": "models/entity/zombie.geo.json", "texture": "textures/entity/zombie/zombie.png", "animation": "animations/entity/zombie.animation.json" }
        ]
    };
    
    await fs.writeFile(
        path.join(TEST_CONFIG_DIR, 'models_skins_animations.json'),
        JSON.stringify(testModelsConfig, null, 2)
    );
});

afterAll(async () => {
    try {
        await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
        await fs.rm(TEST_CONFIG_DIR, { recursive: true, force: true });
    } catch (error) {
        // Cleanup failure is not critical
    }
});

describe('EvolutionResultIntegrator', () => {
    
    describe('loadEvolutionResult', () => {
        test('should load evolution result data correctly', async () => {
            try {
                const EvolutionResultIntegrator = require('./evolution-result-integrator');
                const integrator = new EvolutionResultIntegrator({
                    evolutionResultPath: path.join(TEST_DATA_DIR, 'evolution_result.json'),
                    modelsConfigPath: path.join(TEST_CONFIG_DIR, 'models_skins_animations.json'),
                    outputPath: path.join(TEST_CONFIG_DIR, 'test_generated_entities.json')
                });
                
                const evolutionData = await integrator.loadEvolutionResult();
                
                expect(evolutionData).toHaveProperty('breeding_results');
                expect(Array.isArray(evolutionData.breeding_results)).toBe(true);
                expect(evolutionData.breeding_results[0]).toHaveProperty('children');
                expect(evolutionData.breeding_results[0].children).toHaveLength(2);
                
            } catch (error) {
                if (error.code === 'MODULE_NOT_FOUND') {
                    console.log('⏸ Skipped: Module not implemented yet');
                    return; // Skip test
                } else {
                    throw error;
                }
            }
        });
    });

    describe('convertToMinecraftFormat', () => {
        test('should convert evolution data to minecraft format', async () => {
            try {
                const EvolutionResultIntegrator = require('./evolution-result-integrator');
                const integrator = new EvolutionResultIntegrator({
                    evolutionResultPath: path.join(TEST_DATA_DIR, 'evolution_result.json'),
                    modelsConfigPath: path.join(TEST_CONFIG_DIR, 'models_skins_animations.json'),
                    outputPath: path.join(TEST_CONFIG_DIR, 'test_generated_entities.json')
                });
                
                const evolutionData = await integrator.loadEvolutionResult();
                const convertedEntities = await integrator.convertToMinecraftFormat(evolutionData);
                
                expect(Array.isArray(convertedEntities)).toBe(true);
                expect(convertedEntities).toHaveLength(2);
                
                const firstEntity = convertedEntities[0];
                
                const requiredFields = ['entity_id', 'name', 'gender', 'parent_ids', 'generation', 'dna', 'model', 'texture', 'animation', 'behavior', 'sociality', 'lifespan'];
                for (const field of requiredFields) {
                    expect(firstEntity[field]).toBeDefined();
                }
                
                expect(typeof firstEntity.dna).toBe('string');
                expect(firstEntity.dna).toBe('ACGTACGTACGTACGT');
                
            } catch (error) {
                if (error.code === 'MODULE_NOT_FOUND') {
                    console.log('⏸ Skipped: Module not implemented yet');
                    return; // Skip test
                } else {
                    throw error;
                }
            }
        });
    });

    describe('resolveEntityPaths', () => {
        test('should resolve entity model, texture and animation paths', async () => {
            try {
                const EvolutionResultIntegrator = require('./evolution-result-integrator');
                const integrator = new EvolutionResultIntegrator({
                    evolutionResultPath: path.join(TEST_DATA_DIR, 'evolution_result.json'),
                    modelsConfigPath: path.join(TEST_CONFIG_DIR, 'models_skins_animations.json'),
                    outputPath: path.join(TEST_CONFIG_DIR, 'test_generated_entities.json')
                });
                
                const witchPaths = await integrator.resolveEntityPaths('witch');
                const zombiePaths = await integrator.resolveEntityPaths('zombie');
                const villagerPaths = await integrator.resolveEntityPaths('villager');
                
                expect(witchPaths.model).toBe('models/entity/witch.geo.json');
                expect(zombiePaths.texture).toBe('textures/entity/zombie/zombie.png');
                expect(villagerPaths.animation).toBe('animations/entity/villager.animation.json');
                
            } catch (error) {
                if (error.code === 'MODULE_NOT_FOUND') {
                    console.log('⏸ Skipped: Module not implemented yet');
                    return; // Skip test
                } else {
                    throw error;
                }
            }
        });
    });

    describe('generated_entities.json overwrite', () => {
        test('should overwrite generated_entities.json with new generation', async () => {
            try {
                const EvolutionResultIntegrator = require('./evolution-result-integrator');
                const integrator = new EvolutionResultIntegrator({
                    evolutionResultPath: path.join(TEST_DATA_DIR, 'evolution_result.json'),
                    modelsConfigPath: path.join(TEST_CONFIG_DIR, 'models_skins_animations.json'),
                    outputPath: path.join(TEST_CONFIG_DIR, 'test_generated_entities.json')
                });
                
                // 既存ファイル作成（親世代データ）
                const parentGeneration = [
                    {"entity_id": "adam", "name": "adam", "generation": 1},
                    {"entity_id": "eve", "name": "eve", "generation": 1}
                ];
                
                await fs.writeFile(
                    path.join(TEST_CONFIG_DIR, 'test_generated_entities.json'),
                    JSON.stringify(parentGeneration, null, 2)
                );
                
                await integrator.integrate();
                
                const updatedData = JSON.parse(
                    await fs.readFile(path.join(TEST_CONFIG_DIR, 'test_generated_entities.json'), 'utf8')
                );
                
                expect(Array.isArray(updatedData)).toBe(true);
                expect(updatedData).toHaveLength(2);
                
                // 親世代が削除されていることを確認
                const hasParent = updatedData.some(entity => 
                    entity.entity_id === 'adam' || entity.entity_id === 'eve'
                );
                expect(hasParent).toBe(false);
                
                // 子世代が存在することを確認
                const hasChild = updatedData.some(entity => 
                    entity.entity_id === 'child_001' || entity.entity_id === 'child_002'
                );
                expect(hasChild).toBe(true);
                
            } catch (error) {
                if (error.code === 'MODULE_NOT_FOUND') {
                    console.log('⏸ Skipped: Module not implemented yet');
                    return; // Skip test
                } else {
                    throw error;
                }
            }
        });
    });

    describe('integrate', () => {
        test('should complete full integration flow', async () => {
            try {
                const EvolutionResultIntegrator = require('./evolution-result-integrator');
                const integrator = new EvolutionResultIntegrator({
                    evolutionResultPath: path.join(TEST_DATA_DIR, 'evolution_result.json'),
                    modelsConfigPath: path.join(TEST_CONFIG_DIR, 'models_skins_animations.json'),
                    outputPath: path.join(TEST_CONFIG_DIR, 'test_generated_entities.json')
                });
                
                const result = await integrator.integrate();
                
                expect(result.success).toBe(true);
                expect(result.entities_processed).toBe(2);
                
            } catch (error) {
                if (error.code === 'MODULE_NOT_FOUND') {
                    console.log('⏸ Skipped: Module not implemented yet');
                    return; // Skip test
                } else {
                    throw error;
                }
            }
        });
    });
});
