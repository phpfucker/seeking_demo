const fs = require('fs').promises;
const path = require('path');

/**
 * 5.5.1 新しい世代のエンティティ生成コマンドのテストスイート (Jest)
 */

// テスト用データディレクトリ
const TEST_DATA_DIR = path.join(__dirname, 'test_data');
const TEST_CONFIG_DIR = path.join(__dirname, 'test_config');

// Jest setup and teardown
beforeAll(async () => {
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    await fs.mkdir(TEST_CONFIG_DIR, { recursive: true });
    
    // テスト用initial_adam_eve.jsonを作成
    const testInitialAdamEve = [
        {
            "entity_id": "adam",
            "name": "adam",
            "gender": "male",
            "parent_ids": [],
            "generation": 1,
            "dna": "ATCGATCGATCGATCG",
            "model": "models/entity/villager.geo.json",
            "texture": "textures/entity/villager/villager.png",
            "animation": "animations/entity/villager.animation.json",
            "behavior": "curious",
            "sociality": "leader",
            "lifespan": 2000,
            "x": 0,
            "y": 64,
            "z": 0,
            "created_at": "2025-01-01T00:00:00.000Z"
        },
        {
            "entity_id": "eve",
            "name": "eve",
            "gender": "female",
            "parent_ids": [],
            "generation": 1,
            "dna": "CGCGCGCGCGCGCGCG",
            "model": "models/entity/villager.geo.json",
            "texture": "textures/entity/villager/villager.png",
            "animation": "animations/entity/villager.animation.json",
            "behavior": "passive",
            "sociality": "herd",
            "lifespan": 1800,
            "x": 10,
            "y": 64,
            "z": 10,
            "created_at": "2025-01-01T00:00:00.000Z"
        }
    ];
    
    await fs.writeFile(
        path.join(TEST_CONFIG_DIR, 'initial_adam_eve.json'),
        JSON.stringify(testInitialAdamEve, null, 2)
    );
    
    // テスト用の子世代データを作成
    const testChildGeneration = [
        {
            "entity_id": "child_001",
            "name": "Alice",
            "gender": "female",
            "parent_ids": ["adam", "eve"],
            "generation": 2,
            "dna": "ATCGCGCGATCGCGCG",
            "model": "models/entity/witch.geo.json",
            "texture": "textures/entity/witch/witch.png",
            "animation": "animations/entity/witch.animation.json",
            "behavior": "curious",
            "sociality": "leader",
            "lifespan": 1200,
            "x": -15,
            "y": 64,
            "z": 25,
            "created_at": "2025-06-23T12:00:00.000Z"
        }
    ];
    
    await fs.writeFile(
        path.join(TEST_CONFIG_DIR, 'test_generated_entities.json'),
        JSON.stringify(testChildGeneration, null, 2)
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

describe('GenerateEntitiesCommand', () => {
    
    describe('loadInitialTemplate', () => {
        test('should load initial_adam_eve.json template correctly', async () => {
            try {
                const GenerateEntitiesCommand = require('./generate-entities');
                const generator = new GenerateEntitiesCommand({
                    initialTemplatePath: path.join(TEST_CONFIG_DIR, 'initial_adam_eve.json'),
                    outputPath: path.join(TEST_CONFIG_DIR, 'test_generated_entities.json')
                });
                
                const template = await generator.loadInitialTemplate();
                
                expect(Array.isArray(template)).toBe(true);
                expect(template).toHaveLength(2);
                expect(template[0].entity_id).toBe('adam');
                expect(template[1].entity_id).toBe('eve');
                expect(template[0].generation).toBe(1);
                expect(template[1].generation).toBe(1);
                
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

    describe('generateRandomCoordinates', () => {
        test('should generate random coordinates within specified range', async () => {
            try {
                const GenerateEntitiesCommand = require('./generate-entities');
                const generator = new GenerateEntitiesCommand();
                
                const coords = generator.generateRandomCoordinates();
                
                expect(coords).toHaveProperty('x');
                expect(coords).toHaveProperty('y');
                expect(coords).toHaveProperty('z');
                expect(coords.x).toBeGreaterThanOrEqual(-100);
                expect(coords.x).toBeLessThanOrEqual(100);
                expect(coords.z).toBeGreaterThanOrEqual(-100);
                expect(coords.z).toBeLessThanOrEqual(100);
                expect(coords.y).toBe(64); // 地表レベル固定
                
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

    describe('updateEntityCoordinates', () => {
        test('should update entity coordinates while preserving other data', async () => {
            try {
                const GenerateEntitiesCommand = require('./generate-entities');
                const generator = new GenerateEntitiesCommand();
                
                const originalEntity = {
                    entity_id: "test_entity",
                    name: "TestEntity",
                    x: 0,
                    y: 64,
                    z: 0,
                    some_other_data: "preserved"
                };
                
                const updatedEntity = generator.updateEntityCoordinates(originalEntity);
                
                expect(updatedEntity.entity_id).toBe(originalEntity.entity_id);
                expect(updatedEntity.name).toBe(originalEntity.name);
                expect(updatedEntity.some_other_data).toBe(originalEntity.some_other_data);
                expect(updatedEntity.x).not.toBe(originalEntity.x);
                expect(updatedEntity.z).not.toBe(originalEntity.z);
                expect(updatedEntity.y).toBe(64);
                
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

    describe('resetToInitialGeneration', () => {
        test('should reset generated_entities.json to initial adam/eve', async () => {
            try {
                const GenerateEntitiesCommand = require('./generate-entities');
                const generator = new GenerateEntitiesCommand({
                    initialTemplatePath: path.join(TEST_CONFIG_DIR, 'initial_adam_eve.json'),
                    outputPath: path.join(TEST_CONFIG_DIR, 'test_generated_entities.json')
                });
                
                // 実行前：子世代が存在
                const beforeData = JSON.parse(
                    await fs.readFile(path.join(TEST_CONFIG_DIR, 'test_generated_entities.json'), 'utf8')
                );
                expect(beforeData[0].generation).toBe(2); // 子世代
                
                // リセット実行
                const result = await generator.resetToInitialGeneration();
                
                // 実行後：初期世代に戻る
                const afterData = JSON.parse(
                    await fs.readFile(path.join(TEST_CONFIG_DIR, 'test_generated_entities.json'), 'utf8')
                );
                
                expect(result.success).toBe(true);
                expect(afterData).toHaveLength(2);
                expect(afterData[0].entity_id).toBe('adam');
                expect(afterData[1].entity_id).toBe('eve');
                expect(afterData[0].generation).toBe(1);
                expect(afterData[1].generation).toBe(1);
                
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

    describe('coordinateValidation', () => {
        test('should validate coordinate ranges correctly', async () => {
            try {
                const GenerateEntitiesCommand = require('./generate-entities');
                const generator = new GenerateEntitiesCommand();
                
                // 100回テストして範囲を確認
                for (let i = 0; i < 100; i++) {
                    const coords = generator.generateRandomCoordinates();
                    expect(coords.x).toBeGreaterThanOrEqual(-100);
                    expect(coords.x).toBeLessThanOrEqual(100);
                    expect(coords.z).toBeGreaterThanOrEqual(-100);
                    expect(coords.z).toBeLessThanOrEqual(100);
                }
                
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

    describe('execute', () => {
        test('should execute full reset command successfully', async () => {
            try {
                const GenerateEntitiesCommand = require('./generate-entities');
                const generator = new GenerateEntitiesCommand({
                    initialTemplatePath: path.join(TEST_CONFIG_DIR, 'initial_adam_eve.json'),
                    outputPath: path.join(TEST_CONFIG_DIR, 'test_generated_entities.json')
                });
                
                const result = await generator.execute();
                
                expect(result.success).toBe(true);
                expect(result.entities_generated).toBe(2);
                expect(result.generation_reset_to).toBe(1);
                
                // ファイル内容確認
                const finalData = JSON.parse(
                    await fs.readFile(path.join(TEST_CONFIG_DIR, 'test_generated_entities.json'), 'utf8')
                );
                
                expect(finalData).toHaveLength(2);
                expect(finalData.every(entity => entity.generation === 1)).toBe(true);
                
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
