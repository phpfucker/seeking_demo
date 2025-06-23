/**
 * Evolution Cycle Manager Test Suite
 * 5.6.2〜5.6.5 進化サイクル統合・ログ管理・スケジューリングのテストファイル
 */

const EvolutionCycleManager = require('./evolution-cycle-manager');

describe('EvolutionCycleManager', () => {
    let cycleManager;
    const testConfig = {
        rconConfig: {
            host: 'localhost',
            port: 25575,
            password: 'test_password'
        },
        logFile: './test-logs/evolution-cycle.log',
        schedulerEnabled: false
    };

    beforeEach(() => {
        cycleManager = new EvolutionCycleManager(testConfig);
        cycleManager.rconManager = {
            connect: jest.fn(),
            executeAiLifeCommand: jest.fn(),
            disconnect: jest.fn(),
            getConnectionStatus: jest.fn()
        };
    });

    describe('コンストラクタ', () => {
        test('正しい設定でインスタンスが作成される', () => {
            expect(cycleManager).toBeInstanceOf(EvolutionCycleManager);
            expect(cycleManager.config).toEqual(testConfig);
            expect(cycleManager.isRunning).toBe(false);
            expect(cycleManager.cycleCount).toBe(0);
        });
    });

    describe('executeScriptSequence()', () => {
        beforeEach(() => {
            cycleManager.executeScript = jest.fn();
        });

        test('全スクリプトが正しい順序で実行される', async () => {
            cycleManager.executeScript.mockResolvedValue({ success: true, output: 'Mock output' });

            const result = await cycleManager.executeScriptSequence();

            expect(result.success).toBe(true);
            expect(cycleManager.executeScript).toHaveBeenCalledTimes(5);
            
            const calls = cycleManager.executeScript.mock.calls;
            expect(calls[0][0]).toBe('status-data-integration.js');
            expect(calls[1][0]).toBe('breeding-pair-extractor.js');
            expect(calls[2][0]).toBe('ai-request-generator.js');
            expect(calls[3][0]).toBe('chatgpt-evolution-processor.js');
            expect(calls[4][0]).toBe('evolution-result-integrator.js');
        });
    });

    describe('executeSingleCycle()', () => {
        test('完全な進化サイクルが実行される', async () => {
            cycleManager.rconManager.connect.mockResolvedValue(true);
            cycleManager.rconManager.executeAiLifeCommand.mockResolvedValue({
                success: true,
                response: 'Export completed'
            });
            cycleManager.rconManager.disconnect.mockResolvedValue(true);
            cycleManager.executeScriptSequence = jest.fn().mockResolvedValue({
                success: true,
                results: []
            });

            const result = await cycleManager.executeSingleCycle();

            expect(result.success).toBe(true);
            expect(cycleManager.cycleCount).toBe(1);
            expect(cycleManager.rconManager.connect).toHaveBeenCalled();
            expect(cycleManager.rconManager.executeAiLifeCommand).toHaveBeenCalledWith('export_status');
            expect(cycleManager.executeScriptSequence).toHaveBeenCalled();
            expect(cycleManager.rconManager.disconnect).toHaveBeenCalled();
        });
    });
});
