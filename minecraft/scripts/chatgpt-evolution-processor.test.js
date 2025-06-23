const fs = require('fs').promises;
const path = require('path');
const { ChatGPTEvolutionProcessor } = require('./chatgpt-evolution-processor');

describe('ChatGPTEvolutionProcessor', () => {
    let processor;
    let mockAiRequestData;
    let mockOpenAI;

    beforeEach(async () => {
        // テスト用のモックデータを準備
        mockAiRequestData = {
            user_guidance: "テスト用の管理者指示",
            breeding_pairs: [{
                male: {
                    id: "adam",
                    dna: ["A", "C", "G", "T"],
                    behavior: "curious",
                    sociality: "leader",
                    lifespan: 1500
                },
                female: {
                    id: "eve",
                    dna: ["T", "G", "C", "A"],
                    behavior: "passive",
                    sociality: "herd",
                    lifespan: 1500
                }
            }],
            available_entities: ["villager", "witch", "zombie"],
            genetics_rules: {
                crossover_rate: 0.7,
                mutation_rate: 0.1,
                generation: 2
            }
        };

        // モックのOpenAIクライアントを作成
        mockOpenAI = {
            chat: {
                completions: {
                    create: jest.fn()
                }
            }
        };

        processor = new ChatGPTEvolutionProcessor({ mockOpenAI });
    });

    describe('validateRequestData', () => {
        it('正しい形式のリクエストデータを検証できる', () => {
            expect(() => {
                processor.validateRequestData(mockAiRequestData);
            }).not.toThrow();
        });

        it('必須フィールドが欠けている場合にエラーを投げる', () => {
            const invalidData = { ...mockAiRequestData };
            delete invalidData.breeding_pairs;
            expect(() => {
                processor.validateRequestData(invalidData);
            }).toThrow(/breeding_pairs is required/);
        });
    });

    describe('validateResponseData', () => {
        it('正しい形式のレスポンスデータを検証できる', () => {
            const mockResponse = {
                breeding_results: [{
                    children: [{
                        entity_id: "child_001",
                        name: "TestChild",
                        gender: "male",
                        parent_ids: ["adam", "eve"],
                        generation: 2,
                        dna: ["A", "T", "G", "C"],
                        selected_entity: "villager",
                        behavior: "curious",
                        sociality: "leader",
                        lifespan: 1200
                    }]
                }]
            };

            expect(() => {
                processor.validateResponseData(mockResponse);
            }).not.toThrow();
        });

        it('必須フィールドが欠けているレスポンスデータでエラーを投げる', () => {
            const invalidResponse = {
                breeding_results: [{
                    children: [{
                        entity_id: "child_001",
                        // nameが欠けている
                        gender: "male",
                        parent_ids: ["adam", "eve"]
                    }]
                }]
            };

            expect(() => {
                processor.validateResponseData(invalidResponse);
            }).toThrow(/Required field missing in response: name/);
        });
    });

    describe('processEvolution', () => {
        it('ChatGPT APIを呼び出して結果を返す', async () => {
            const mockApiResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            breeding_results: [{
                                children: [{
                                    entity_id: "child_001",
                                    name: "TestChild",
                                    gender: "male",
                                    parent_ids: ["adam", "eve"],
                                    generation: 2,
                                    dna: ["A", "T", "G", "C"],
                                    selected_entity: "villager",
                                    behavior: "curious",
                                    sociality: "leader",
                                    lifespan: 1200
                                }]
                            }]
                        })
                    }
                }]
            };

            mockOpenAI.chat.completions.create.mockResolvedValue(mockApiResponse);

            const result = await processor.processEvolution(mockAiRequestData);
            
            expect(result.breeding_results).toBeDefined();
            expect(Array.isArray(result.breeding_results)).toBe(true);
            expect(result.breeding_results[0].children).toBeDefined();
            expect(Array.isArray(result.breeding_results[0].children)).toBe(true);
        });

        it('APIエラー時に適切なエラーを投げる', async () => {
            const mockError = {
                error: {
                    message: 'Invalid API key'
                }
            };

            mockOpenAI.chat.completions.create.mockRejectedValue(mockError);
            
            await expect(processor.processEvolution(mockAiRequestData))
                .rejects.toThrow(/OpenAI API error/);
        });
    });

    describe('saveEvolutionResult', () => {
        it('進化結果をファイルに保存できる', async () => {
            const mockResult = {
                breeding_results: [{
                    children: [{
                        entity_id: "child_001",
                        name: "TestChild",
                        gender: "male",
                        parent_ids: ["adam", "eve"],
                        generation: 2,
                        dna: ["A", "T", "G", "C"],
                        selected_entity: "villager",
                        behavior: "curious",
                        sociality: "leader",
                        lifespan: 1200
                    }]
                }]
            };

            await processor.saveEvolutionResult(mockResult);
            
            // 保存されたファイルを読み込んで検証
            const savedData = JSON.parse(
                await fs.readFile(path.join(__dirname, 'data', 'evolution_result.json'), 'utf8')
            );
            expect(savedData).toEqual(mockResult);
        });
    });
}); 