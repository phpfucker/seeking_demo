/**
 * RCON Manager Class
 * 5.6.1 RCON設定の導入・設定の実装
 * 
 * @file rcon-manager.js
 * @description MinecraftサーバーへのRCON接続とコマンド実行を管理するクラス
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */

const Rcon = require('minecraft-rcon');

/**
 * MinecraftサーバーのRCON接続を管理するクラス
 * 
 * @class RconManager
 * @description MinecraftサーバーへのRCON接続、コマンド実行、接続状態管理を行う
 * 
 * @example
 * const rconManager = new RconManager({
 *   host: 'localhost',
 *   port: 25575,
 *   password: 'rcon_password'
 * });
 * 
 * await rconManager.connect();
 * const result = await rconManager.executeAiLifeCommand('export_status');
 * await rconManager.disconnect();
 */
class RconManager {
    /**
     * RconManagerコンストラクタ
     * 
     * @param {Object} config - RCON接続設定
     * @param {string} [config.host='localhost'] - Minecraftサーバーのホスト名
     * @param {number} [config.port=25575] - RCONポート番号
     * @param {string} [config.password] - RCON認証パスワード
     * @param {number} [config.timeout=5000] - 接続タイムアウト（ミリ秒）
     */
    constructor(config = {}) {
        this.config = this.buildConfig(config);
        this.rcon = null;
        this.isConnected = false;
        this.lastConnectedAt = null;
        this.commandCount = 0;
        this.initializeRcon();
    }

    buildConfig(userConfig) {
        const defaultConfig = {
            host: 'localhost',
            port: 25575,
            password: process.env.RCON_PASSWORD || '',
            timeout: 5000
        };

        if (process.env.NODE_ENV === 'production') {
            return {
                ...defaultConfig,
                host: process.env.RCON_HOST || 'localhost',
                port: parseInt(process.env.RCON_PORT) || 25575,
                password: process.env.RCON_PASSWORD || '',
                timeout: parseInt(process.env.RCON_TIMEOUT) || 5000,
                ...userConfig
            };
        }

        return {
            ...defaultConfig,
            ...userConfig
        };
    }

    initializeRcon() {
        this.rcon = new Rcon();
    }

    async connect() {
        try {
            if (this.isConnected) {
                return true;
            }

            console.log(`[RconManager] RCON接続を開始します: ${this.config.host}:${this.config.port}`);
            
            await this.rcon.connect(
                this.config.host,
                this.config.port,
                this.config.password,
                this.config.timeout
            );

            this.isConnected = true;
            this.lastConnectedAt = new Date();
            
            console.log('[RconManager] RCON接続に成功しました');
            return true;

        } catch (error) {
            this.isConnected = false;
            console.error('[RconManager] RCON接続に失敗しました:', error.message);
            return false;
        }
    }

    async executeCommand(command) {
        try {
            if (!command || typeof command !== 'string' || command.trim() === '') {
                return {
                    success: false,
                    error: 'Command cannot be empty'
                };
            }

            if (!this.isConnected) {
                return {
                    success: false,
                    error: 'Not connected to server'
                };
            }

            console.log(`[RconManager] コマンド実行: ${command}`);
            
            const response = await this.rcon.send(command);
            this.commandCount++;
            
            console.log(`[RconManager] コマンド実行成功: ${response}`);
            
            return {
                success: true,
                response: response
            };

        } catch (error) {
            console.error(`[RconManager] コマンド実行失敗: ${command}`, error.message);
            
            return {
                success: false,
                error: `Command execution failed: ${error.message}`
            };
        }
    }

    async executeAiLifeCommand(subCommand) {
        const fullCommand = `/ailife ${subCommand}`;
        return await this.executeCommand(fullCommand);
    }

    async disconnect() {
        try {
            if (!this.isConnected) {
                return true;
            }

            console.log('[RconManager] RCON接続を切断します');
            
            await this.rcon.disconnect();
            this.isConnected = false;
            
            console.log('[RconManager] RCON接続を切断しました');
            return true;

        } catch (error) {
            console.error('[RconManager] RCON切断に失敗しました:', error.message);
            this.isConnected = false;
            return true;
        }
    }

    getConnectionStatus() {
        const { password, ...safeConfig } = this.config;
        
        return {
            connected: this.isConnected,
            lastConnectedAt: this.lastConnectedAt,
            commandCount: this.commandCount,
            config: safeConfig
        };
    }

    async testConnection() {
        try {
            const connected = await this.connect();
            if (!connected) {
                return {
                    success: false,
                    error: 'Failed to connect'
                };
            }

            const result = await this.executeCommand('/list');
            
            return {
                success: result.success,
                response: result.response,
                error: result.error
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = RconManager;
