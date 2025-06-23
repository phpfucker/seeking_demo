/**
 * RCON Manager Test Suite
 * 5.6.1 RCON設定の導入・設定のテストファイル
 * 
 * @file rcon-manager.test.js
 * @description MinecraftサーバーへのRCON接続とコマンド実行機能のテスト
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */

const RconManager = require('./rcon-manager');

/**
 * RconManagerのテストスイート
 */
describe('RconManager', () => {
    let rconManager;
    const mockConfig = {
        host: 'localhost',
        port: 25575,
        password: 'test_password',
        timeout: 5000
    };

    beforeEach(() => {
        rconManager = new RconManager(mockConfig);
    });

    describe('コンストラクタ', () => {
        test('正しい設定でインスタンスが作成される', () => {
            expect(rconManager).toBeInstanceOf(RconManager);
            expect(rconManager.config).toEqual(mockConfig);
            expect(rconManager.isConnected).toBe(false);
        });

        test('設定が未指定の場合はデフォルト値を使用する', () => {
            const defaultManager = new RconManager();
            expect(defaultManager.config.host).toBe('localhost');
            expect(defaultManager.config.port).toBe(25575);
            expect(defaultManager.config.timeout).toBe(5000);
        });

        test('環境変数NODE_ENVがproductionの場合は本番設定を使用する', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            
            const prodManager = new RconManager();
            expect(prodManager.config.host).toBe('localhost'); // 本番環境のホスト
            
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('connect()', () => {
        test('正常に接続が完了する', async () => {
            // モックRCON接続を設定
            rconManager.rcon = {
                connect: jest.fn().mockResolvedValue(true)
            };

            const result = await rconManager.connect();
            
            expect(result).toBe(true);
            expect(rconManager.isConnected).toBe(true);
            expect(rconManager.rcon.connect).toHaveBeenCalled();
        });

        test('接続失敗時はfalseを返す', async () => {
            rconManager.rcon = {
                connect: jest.fn().mockRejectedValue(new Error('Connection failed'))
            };

            const result = await rconManager.connect();
            
            expect(result).toBe(false);
            expect(rconManager.isConnected).toBe(false);
        });

        test('既に接続済みの場合は再接続しない', async () => {
            rconManager.isConnected = true;
            rconManager.rcon = {
                connect: jest.fn()
            };

            const result = await rconManager.connect();
            
            expect(result).toBe(true);
            expect(rconManager.rcon.connect).not.toHaveBeenCalled();
        });
    });

    describe('executeCommand()', () => {
        beforeEach(() => {
            rconManager.isConnected = true;
            rconManager.rcon = {
                send: jest.fn()
            };
        });

        test('コマンドが正常に実行される', async () => {
            const mockResponse = 'Command executed successfully';
            rconManager.rcon.send.mockResolvedValue(mockResponse);

            const result = await rconManager.executeCommand('/ailife export_status');
            
            expect(result.success).toBe(true);
            expect(result.response).toBe(mockResponse);
            expect(rconManager.rcon.send).toHaveBeenCalledWith('/ailife export_status');
        });

        test('未接続の場合はエラーを返す', async () => {
            rconManager.isConnected = false;

            const result = await rconManager.executeCommand('/ailife export_status');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Not connected');
        });

        test('コマンド実行失敗時はエラー情報を返す', async () => {
            const mockError = new Error('Command failed');
            rconManager.rcon.send.mockRejectedValue(mockError);

            const result = await rconManager.executeCommand('/invalid_command');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Command failed');
        });

        test('空のコマンドの場合はエラーを返す', async () => {
            const result = await rconManager.executeCommand('');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Command cannot be empty');
        });
    });

    describe('executeAiLifeCommand()', () => {
        beforeEach(() => {
            rconManager.executeCommand = jest.fn();
        });

        test('AILifeコマンドが正常に実行される', async () => {
            const mockResult = { success: true, response: 'Export completed' };
            rconManager.executeCommand.mockResolvedValue(mockResult);

            const result = await rconManager.executeAiLifeCommand('export_status');
            
            expect(result).toEqual(mockResult);
            expect(rconManager.executeCommand).toHaveBeenCalledWith('/ailife export_status');
        });

        test('複数のAILifeコマンドサブタイプをサポートする', async () => {
            const testCommands = ['export_status', 'spawn_entities', 'clear_entities'];
            rconManager.executeCommand.mockResolvedValue({ success: true });

            for (const cmd of testCommands) {
                await rconManager.executeAiLifeCommand(cmd);
                expect(rconManager.executeCommand).toHaveBeenCalledWith(`/ailife ${cmd}`);
            }
        });
    });

    describe('disconnect()', () => {
        test('正常に切断される', async () => {
            rconManager.isConnected = true;
            rconManager.rcon = {
                disconnect: jest.fn().mockResolvedValue(true)
            };

            const result = await rconManager.disconnect();
            
            expect(result).toBe(true);
            expect(rconManager.isConnected).toBe(false);
            expect(rconManager.rcon.disconnect).toHaveBeenCalled();
        });

        test('未接続の場合は何もしない', async () => {
            rconManager.isConnected = false;
            rconManager.rcon = {
                disconnect: jest.fn()
            };

            const result = await rconManager.disconnect();
            
            expect(result).toBe(true);
            expect(rconManager.rcon.disconnect).not.toHaveBeenCalled();
        });
    });

    describe('getConnectionStatus()', () => {
        test('接続状態の情報を返す', () => {
            rconManager.isConnected = true;
            rconManager.lastConnectedAt = new Date('2025-01-22T10:00:00Z');
            rconManager.commandCount = 5;

            const status = rconManager.getConnectionStatus();
            
            expect(status.connected).toBe(true);
            expect(status.lastConnectedAt).toEqual(new Date('2025-01-22T10:00:00Z'));
            expect(status.commandCount).toBe(5);
            expect(status.config).toEqual(mockConfig);
        });
    });
}); 