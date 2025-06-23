/**
 * Breeding Pair Extractor 5.2.5 テスト
 * 親の詳細特性情報の補完機能テスト
 */

const BreedingPairExtractor = require('./breeding-pair-extractor');
const fs = require('fs');
const path = require('path');

describe('BreedingPairExtractor 5.2.5 - 特性データ補完機能', () => {
    let extractor;
    let testConfigDir;
    let testDataDir;

    beforeEach(() => {
        // テスト用ディレクトリ設定
        testConfigDir = './test-config';
        testDataDir = './test-data';
        
        // ディレクトリ作成
        if (!fs.existsSync(testConfigDir)) {
            fs.mkdirSync(testConfigDir, { recursive: true });
        }
        if (!fs.existsSync(testDataDir)) {
            fs.mkdirSync(testDataDir, { recursive: true });
        }

        extractor = new BreedingPairExtractor({
            configDir: testConfigDir,
            dataDir: testDataDir
        });
    });

    afterEach(() => {
        // テスト用ファイル削除
        if (fs.existsSync(testConfigDir)) {
            fs.rmSync(testConfigDir, { recursive: true, force: true });
        }
        if (fs.existsSync(testDataDir)) {
            fs.rmSync(testDataDir, { recursive: true, force: true });
        }
    });

    describe('5.2.5.1 - 特性データ読み込み機能', () => {
        test('正常なcurrent_entity_status.jsonから特性データを読み込める', () => {
            // Arrange
            const mockEntityStatus = [
                {
                    entity_id: "adam",
                    behavior: "curious",
                    sociality: "leader",
                    lifespan: 1500,
                    position: { x: 25.4, y: 66, z: 10.78 }
                },
                {
                    entity_id: "eve",
                    behavior: "passive",
                    sociality: "herd",
                    lifespan: 1500,
                    position: { x: 29.74, y: 69, z: 29.27 }
                }
            ];

            fs.writeFileSync(
                path.join(testConfigDir, 'current_entity_status.json'),
                JSON.stringify(mockEntityStatus, null, 2)
            );

            // Act
            const result = extractor.loadCharacteristicsData();

            // Assert
            expect(result).toEqual({
                "adam": {
                    behavior: "curious",
                    sociality: "leader",
                    lifespan: 1500
                },
                "eve": {
                    behavior: "passive",
                    sociality: "herd",
                    lifespan: 1500
                }
            });
        });

        test('特性データが一部欠損していても適切に処理できる', () => {
            // Arrange
            const mockEntityStatus = [
                {
                    entity_id: "adam",
                    behavior: "curious",
                    // sociality欠損
                    lifespan: 1500
                },
                {
                    entity_id: "eve",
                    // behavior欠損
                    sociality: "herd",
                    lifespan: 1500
                }
            ];

            fs.writeFileSync(
                path.join(testConfigDir, 'current_entity_status.json'),
                JSON.stringify(mockEntityStatus, null, 2)
            );

            // Act
            const result = extractor.loadCharacteristicsData();

            // Assert
            expect(result).toEqual({
                "adam": {
                    behavior: "curious",
                    sociality: null,
                    lifespan: 1500
                },
                "eve": {
                    behavior: null,
                    sociality: "herd",
                    lifespan: 1500
                }
            });
        });

        test('ファイルが存在しない場合は空のオブジェクトを返す', () => {
            // Act
            const result = extractor.loadCharacteristicsData();

            // Assert
            expect(result).toEqual({});
        });

        test('不正なJSONファイルの場合は空のオブジェクトを返す', () => {
            // Arrange
            fs.writeFileSync(
                path.join(testConfigDir, 'current_entity_status.json'),
                'invalid json content'
            );

            // Act
            const result = extractor.loadCharacteristicsData();

            // Assert
            expect(result).toEqual({});
        });
    });

    describe('5.2.5.2 - ペア特性データ補完機能', () => {
        test('繁殖ペアに特性データを正しく補完できる', () => {
            // Arrange
            const mockPairs = [
                {
                    male: {
                        id: "adam",
                        gender: "male",
                        dna: ["A", "C", "G", "T"],
                        position: { x: 25.4, y: 66, z: 10.78 }
                    },
                    female: {
                        id: "eve",
                        gender: "female",
                        dna: ["T", "G", "C", "A"],
                        position: { x: 29.74, y: 69, z: 29.27 }
                    },
                    distance: 19.23
                }
            ];

            const mockCharacteristicsMap = {
                "adam": {
                    behavior: "curious",
                    sociality: "leader",
                    lifespan: 1500
                },
                "eve": {
                    behavior: "passive",
                    sociality: "herd",
                    lifespan: 1500
                }
            };

            // Act
            const result = extractor.enhancePairsWithCharacteristics(mockPairs, mockCharacteristicsMap);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].male.behavior).toBe("curious");
            expect(result[0].male.sociality).toBe("leader");
            expect(result[0].male.lifespan).toBe(1500);
            expect(result[0].female.behavior).toBe("passive");
            expect(result[0].female.sociality).toBe("herd");
            expect(result[0].female.lifespan).toBe(1500);
        });

        test('特性データが存在しないエンティティは適切に処理される', () => {
            // Arrange
            const mockPairs = [
                {
                    male: {
                        id: "unknown_male",
                        gender: "male",
                        position: { x: 0, y: 0, z: 0 }
                    },
                    female: {
                        id: "unknown_female",
                        gender: "female",
                        position: { x: 10, y: 0, z: 0 }
                    },
                    distance: 10
                }
            ];

            const mockCharacteristicsMap = {}; // 空のマップ

            // Act
            const result = extractor.enhancePairsWithCharacteristics(mockPairs, mockCharacteristicsMap);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].male.behavior).toBeNull();
            expect(result[0].male.sociality).toBeNull();
            expect(result[0].male.lifespan).toBeNull();
            expect(result[0].female.behavior).toBeNull();
            expect(result[0].female.sociality).toBeNull();
            expect(result[0].female.lifespan).toBeNull();
        });

        test('複数ペアでも正しく特性データを補完できる', () => {
            // Arrange
            const mockPairs = [
                {
                    male: { id: "adam" },
                    female: { id: "eve" },
                    distance: 19.23
                },
                {
                    male: { id: "bob" },
                    female: { id: "alice" },
                    distance: 15.5
                }
            ];

            const mockCharacteristicsMap = {
                "adam": { behavior: "curious", sociality: "leader", lifespan: 1500 },
                "eve": { behavior: "passive", sociality: "herd", lifespan: 1500 },
                "bob": { behavior: "aggressive", sociality: "loner", lifespan: 1200 },
                "alice": { behavior: "friendly", sociality: "social", lifespan: 1800 }
            };

            // Act
            const result = extractor.enhancePairsWithCharacteristics(mockPairs, mockCharacteristicsMap);

            // Assert
            expect(result).toHaveLength(2);
            
            // 1st pair
            expect(result[0].male.behavior).toBe("curious");
            expect(result[0].female.behavior).toBe("passive");
            
            // 2nd pair
            expect(result[1].male.behavior).toBe("aggressive");
            expect(result[1].female.behavior).toBe("friendly");
        });
    });

    describe('5.2.5.3 - 統合テスト', () => {
        test('processBreedingPairsで特性データ補完が正常に動作する', async () => {
            // Arrange
            const mockFormattedData = {
                entities: [
                    {
                        id: "adam",
                        gender: "male",
                        dna: ["A", "C", "G", "T"],
                        position: { x: 25.4, y: 66, z: 10.78 }
                    },
                    {
                        id: "eve",
                        gender: "female",
                        dna: ["T", "G", "C", "A"],
                        position: { x: 29.74, y: 69, z: 29.27 }
                    }
                ]
            };

            const mockEntityStatus = [
                {
                    entity_id: "adam",
                    behavior: "curious",
                    sociality: "leader",
                    lifespan: 1500
                },
                {
                    entity_id: "eve",
                    behavior: "passive",
                    sociality: "herd",
                    lifespan: 1500
                }
            ];

            // ファイル準備
            fs.writeFileSync(
                path.join(testDataDir, 'formatted_status_data.json'),
                JSON.stringify(mockFormattedData, null, 2)
            );
            fs.writeFileSync(
                path.join(testConfigDir, 'current_entity_status.json'),
                JSON.stringify(mockEntityStatus, null, 2)
            );

            // Act
            const result = await extractor.processBreedingPairs();

            // Assert
            expect(result.uniquePairs).toHaveLength(1);
            const pair = result.uniquePairs[0];
            
            // 特性データが補完されていることを確認
            expect(pair.male.behavior).toBe("curious");
            expect(pair.male.sociality).toBe("leader");
            expect(pair.male.lifespan).toBe(1500);
            expect(pair.female.behavior).toBe("passive");
            expect(pair.female.sociality).toBe("herd");
            expect(pair.female.lifespan).toBe(1500);
        });
    });
}); 