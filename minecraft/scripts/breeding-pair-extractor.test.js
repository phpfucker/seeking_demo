/**
 * Test for Breeding Pair Extractor (5.2)
 * 繁殖条件を満たしたユニークペアの抽出機能のテスト
 * Jest形式
 */

const BreedingPairExtractor = require('./breeding-pair-extractor.js');

describe('BreedingPairExtractor', () => {
    let extractor;

    beforeEach(() => {
        extractor = new BreedingPairExtractor();
    });

    describe('5.2.1 - 整形されたリアルタイム状態データの利用', () => {
        test('formatted_status_data.jsonを正しく読み込む', () => {
            const testData = {
                entities: [
                    {
                        id: "adam",
                        gender: "male",
                        position: { x: 25.4, y: 66, z: 10.8 },
                        dna: ["A", "C", "G", "T"]
                    },
                    {
                        id: "eve",
                        gender: "female",
                        position: { x: 29.7, y: 69, z: 29.3 },
                        dna: ["T", "G", "C", "A"]
                    }
                ]
            };

            const result = extractor.loadFormattedData(testData);
            expect(result.entities).toHaveLength(2);
            expect(result.entities[0].id).toBe("adam");
            expect(result.entities[1].id).toBe("eve");
        });
    });

    describe('5.2.2 - 性別判定ロジック', () => {
        test('オスとメスのペアを正しく判定する', () => {
            const entities = [
                { id: "adam", gender: "male" },
                { id: "eve", gender: "female" },
                { id: "cain", gender: "male" }
            ];

            const pairs = extractor.findGenderValidPairs(entities);
            expect(pairs).toHaveLength(2); // adam-eve, cain-eve
            expect(pairs[0].male.id).toBe("adam");
            expect(pairs[0].female.id).toBe("eve");
            expect(pairs[1].male.id).toBe("cain");
            expect(pairs[1].female.id).toBe("eve");
        });

        test('同性同士はペアにならない', () => {
            const entities = [
                { id: "adam", gender: "male" },
                { id: "cain", gender: "male" }
            ];

            const pairs = extractor.findGenderValidPairs(entities);
            expect(pairs).toHaveLength(0);
        });

        test('性別が未定義の個体は除外される', () => {
            const entities = [
                { id: "adam", gender: "male" },
                { id: "unknown", gender: undefined },
                { id: "eve", gender: "female" }
            ];

            const pairs = extractor.findGenderValidPairs(entities);
            expect(pairs).toHaveLength(1);
            expect(pairs[0].male.id).toBe("adam");
            expect(pairs[0].female.id).toBe("eve");
        });
    });

    describe('5.2.3 - 接近度判定ロジック', () => {
        test('接近度（一定距離内）を正しく判定する', () => {
            const pair = {
                male: { position: { x: 0, y: 0, z: 0 } },
                female: { position: { x: 3, y: 4, z: 0 } }
            };

            const distance = extractor.calculateDistance(pair.male.position, pair.female.position);
            expect(distance).toBe(5); // 3-4-5の直角三角形

            // 接近度判定（10ブロック以内）
            expect(extractor.isWithinBreedingDistance(pair, 10)).toBe(true);
            expect(extractor.isWithinBreedingDistance(pair, 3)).toBe(false);
        });

        test('adamとeveの実際の距離を計算する', () => {
            const adamPos = { x: 25.40065086453803, y: 66, z: 10.78052563380174 };
            const evePos = { x: 29.741067650081316, y: 69, z: 29.268909836088433 };

            const distance = extractor.calculateDistance(adamPos, evePos);
            expect(distance).toBeGreaterThan(18);
            expect(distance).toBeLessThan(25);
        });

        test('同じ位置の場合、距離は0になる', () => {
            const position = { x: 10, y: 20, z: 30 };
            const distance = extractor.calculateDistance(position, position);
            expect(distance).toBe(0);
        });

        test('距離計算が3D空間で正しく動作する', () => {
            const pos1 = { x: 0, y: 0, z: 0 };
            const pos2 = { x: 1, y: 1, z: 1 };
            const distance = extractor.calculateDistance(pos1, pos2);
            expect(distance).toBeCloseTo(Math.sqrt(3), 5);
        });
    });

    describe('5.2.4 - ユニークペア抽出機能', () => {
        test('重複しないユニークなペアを抽出する', () => {
            const entities = [
                { id: "adam", gender: "male", position: { x: 0, y: 0, z: 0 } },
                { id: "eve", gender: "female", position: { x: 1, y: 0, z: 0 } },
                { id: "cain", gender: "male", position: { x: 2, y: 0, z: 0 } },
                { id: "abel", gender: "female", position: { x: 3, y: 0, z: 0 } }
            ];

            const uniquePairs = extractor.extractUniqueBreedingPairs(entities, 5);
            
            // 各個体は一度だけペアになる
            const usedIds = new Set();
            uniquePairs.forEach(pair => {
                expect(usedIds.has(pair.male.id)).toBe(false);
                expect(usedIds.has(pair.female.id)).toBe(false);
                usedIds.add(pair.male.id);
                usedIds.add(pair.female.id);
            });

            expect(uniquePairs).toHaveLength(2); // adam-eve, cain-abel
        });

        test('距離が遠すぎるペアは除外される', () => {
            const entities = [
                { id: "adam", gender: "male", position: { x: 0, y: 0, z: 0 } },
                { id: "eve", gender: "female", position: { x: 100, y: 0, z: 0 } }
            ];

            const uniquePairs = extractor.extractUniqueBreedingPairs(entities, 10);
            expect(uniquePairs).toHaveLength(0);
        });

        test('距離の近いペアが優先される', () => {
            const entities = [
                { id: "adam", gender: "male", position: { x: 0, y: 0, z: 0 } },
                { id: "eve1", gender: "female", position: { x: 1, y: 0, z: 0 } }, // 距離1
                { id: "eve2", gender: "female", position: { x: 5, y: 0, z: 0 } }  // 距離5
            ];

            const uniquePairs = extractor.extractUniqueBreedingPairs(entities, 10);
            expect(uniquePairs).toHaveLength(1);
            expect(uniquePairs[0].female.id).toBe("eve1"); // より近いeve1が選ばれる
        });

        test('個体数が奇数の場合も正しく処理される', () => {
            const entities = [
                { id: "adam", gender: "male", position: { x: 0, y: 0, z: 0 } },
                { id: "cain", gender: "male", position: { x: 1, y: 0, z: 0 } },
                { id: "eve", gender: "female", position: { x: 2, y: 0, z: 0 } }
            ];

            const uniquePairs = extractor.extractUniqueBreedingPairs(entities, 10);
            expect(uniquePairs).toHaveLength(1); // 1つのペアのみ
        });
    });

    describe('統合テスト - processBreedingPairs', () => {
        test('実際のデータからユニークペアを抽出する', async () => {
            const realData = {
                entities: [
                    {
                        id: "adam",
                        gender: "male",
                        dna: ["A", "C", "G", "T", "A", "C", "G", "T", "A", "C", "G", "T", "A", "C", "G", "T"],
                        position: { x: 25.40065086453803, y: 66, z: 10.78052563380174 }
                    },
                    {
                        id: "eve",
                        gender: "female",
                        dna: ["T", "G", "C", "A", "T", "G", "C", "A", "T", "G", "C", "A", "T", "G", "C", "A"],
                        position: { x: 29.741067650081316, y: 69, z: 29.268909836088433 }
                    }
                ]
            };

            const result = await extractor.processBreedingPairs(realData, 25); // 25ブロック以内
            
            expect(result.totalPairs).toBe(1);
            expect(result.uniquePairs).toHaveLength(1);
            expect(result.uniquePairs[0].male.id).toBe("adam");
            expect(result.uniquePairs[0].female.id).toBe("eve");
            expect(result.uniquePairs[0].distance).toBeGreaterThan(18);
            expect(result.uniquePairs[0].distance).toBeLessThan(25);
            expect(result.processedAt).toBeDefined();
        });

        test('繁殖可能な個体がいない場合', async () => {
            const noBreedingData = {
                entities: [
                    {
                        id: "adam1",
                        gender: "male",
                        position: { x: 0, y: 0, z: 0 }
                    },
                    {
                        id: "adam2",
                        gender: "male",
                        position: { x: 1, y: 0, z: 0 }
                    }
                ]
            };

            const result = await extractor.processBreedingPairs(noBreedingData, 25);
            
            expect(result.totalPairs).toBe(0);
            expect(result.uniquePairs).toHaveLength(0);
        });

        test('距離制限で繁殖できない場合', async () => {
            const distantData = {
                entities: [
                    {
                        id: "adam",
                        gender: "male",
                        position: { x: 0, y: 0, z: 0 }
                    },
                    {
                        id: "eve",
                        gender: "female",
                        position: { x: 100, y: 0, z: 0 }
                    }
                ]
            };

            const result = await extractor.processBreedingPairs(distantData, 10); // 10ブロック制限
            
            expect(result.totalPairs).toBe(1);
            expect(result.distanceValidPairs).toBe(0);
            expect(result.uniquePairs).toHaveLength(0);
        });
    });

    describe('エラーハンドリング', () => {
        test('不正なデータでもエラーにならない', () => {
            const invalidData = {
                entities: [
                    { id: "broken", gender: null, position: null },
                    { /* 不完全なデータ */ }
                ]
            };

            expect(() => {
                extractor.loadFormattedData(invalidData);
            }).not.toThrow();
        });

        test('空のエンティティ配列でも処理できる', async () => {
            const emptyData = { entities: [] };
            const result = await extractor.processBreedingPairs(emptyData, 25);
            
            expect(result.totalPairs).toBe(0);
            expect(result.uniquePairs).toHaveLength(0);
        });
    });
}); 