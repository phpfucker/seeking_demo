/**
 * Evolution Cycle Manager
 * 5.6.2〜5.6.5 進化サイクル統合・ログ管理・スケジューリングの実装
 */

const RconManager = require('./rcon-manager');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

/**
 * 進化サイクルの統合管理クラス
 * 
 * @class EvolutionCycleManager
 */
class EvolutionCycleManager {
    constructor(config = {}) {
        this.config = this.buildConfig(config);
        this.rconManager = new RconManager(this.config.rconConfig);
        this.isRunning = false;
        this.cycleCount = 0;
        this.lastCycleAt = null;
        this.lastError = null;
        this.cronJob = null;
        
        // スクリプト実行順序（5.6.2）
        this.scriptSequence = [
            'status-data-integration.js',
            'breeding-pair-extractor.js',
            'ai-request-generator.js',
            'chatgpt-evolution-processor.js',
            'evolution-result-integrator.js'
        ];
    }

    buildConfig(userConfig) {
        const defaultConfig = {
            logFile: process.env.NODE_ENV === 'production' 
                ? '/opt/minecraft_forge_server/logs/evolution-cycle.log'
                : './logs/evolution-cycle.log',
            schedulerEnabled: true,
            cronPattern: '0 * * * *', // 1時間ごと
            continueOnError: false,
            rconConfig: {}
        };

        return {
            ...defaultConfig,
            ...userConfig
        };
    }

    /**
     * 5.6.2 スクリプト実行順序の統合
     */
    async executeScriptSequence() {
        await this.logToFile('=== スクリプトシーケンス実行開始 ===', 'INFO');
        
        const results = [];
        const failedScripts = [];

        for (const scriptName of this.scriptSequence) {
            try {
                await this.logToFile(`実行中: ${scriptName}`, 'INFO');
                
                const result = await this.executeScript(scriptName);
                results.push({ script: scriptName, ...result });

                if (!result.success) {
                    failedScripts.push(scriptName);
                    await this.logToFile(`スクリプト実行失敗: ${scriptName} - ${result.error}`, 'ERROR');
                    
                    if (!this.config.continueOnError) {
                        return {
                            success: false,
                            error: `Script ${scriptName} failed: ${result.error}`,
                            results,
                            failedScripts
                        };
                    }
                } else {
                    await this.logToFile(`スクリプト実行成功: ${scriptName}`, 'INFO');
                }

            } catch (error) {
                failedScripts.push(scriptName);
                await this.logToFile(`スクリプト実行例外: ${scriptName} - ${error.message}`, 'ERROR');
                
                if (!this.config.continueOnError) {
                    return {
                        success: false,
                        error: `Script ${scriptName} threw exception: ${error.message}`,
                        results,
                        failedScripts
                    };
                }
            }
        }

        await this.logToFile('=== スクリプトシーケンス実行完了 ===', 'INFO');
        
        return {
            success: failedScripts.length === 0,
            results,
            failedScripts
        };
    }

    /**
     * 個別スクリプトの実行
     */
    async executeScript(scriptName) {
        return new Promise((resolve) => {
            const scriptPath = path.join(__dirname, scriptName);
            const child = spawn('node', [scriptPath], {
                cwd: __dirname,
                env: { ...process.env, NODE_ENV: process.env.NODE_ENV }
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                resolve({
                    success: code === 0,
                    exitCode: code,
                    stdout,
                    stderr,
                    error: code !== 0 ? stderr || `Exit code: ${code}` : null
                });
            });

            child.on('error', (error) => {
                resolve({
                    success: false,
                    exitCode: -1,
                    stdout,
                    stderr,
                    error: error.message
                });
            });
        });
    }

    /**
     * 単一進化サイクルの実行
     */
    async executeSingleCycle() {
        if (this.isRunning) {
            await this.logToFile('進化サイクル実行中のため、新しいサイクルをスキップします', 'WARN');
            return { success: false, error: 'Cycle already running' };
        }

        this.isRunning = true;
        this.lastError = null;

        try {
            await this.logToFile(`=== 進化サイクル #${this.cycleCount + 1} 開始 ===`, 'INFO');
            
            // 1. RCON接続
            await this.logToFile('RCON接続中...', 'INFO');
            const connected = await this.rconManager.connect();
            
            if (!connected) {
                throw new Error('RCON connection failed');
            }

            // 2. MODコマンド実行（/ailife export_status）
            await this.logToFile('Minecraftからエンティティ状態をエクスポート中...', 'INFO');
            const exportResult = await this.rconManager.executeAiLifeCommand('export_status');
            
            if (!exportResult.success) {
                throw new Error(`Export command failed: ${exportResult.error}`);
            }

            // 3. スクリプトシーケンス実行
            const sequenceResult = await this.executeScriptSequence();
            
            if (!sequenceResult.success && !this.config.continueOnError) {
                throw new Error(`Script sequence failed: ${sequenceResult.error}`);
            }

            // 4. RCON切断
            await this.rconManager.disconnect();

            this.cycleCount++;
            this.lastCycleAt = new Date();
            
            await this.logToFile(`=== 進化サイクル #${this.cycleCount} 完了 ===`, 'INFO');

            return {
                success: true,
                cycleNumber: this.cycleCount,
                exportResult,
                sequenceResult
            };

        } catch (error) {
            this.lastError = error.message;
            await this.logToFile(`進化サイクル失敗: ${error.message}`, 'ERROR');
            
            // エラー時でもRCON切断を試行
            try {
                await this.rconManager.disconnect();
            } catch (disconnectError) {
                await this.logToFile(`RCON切断エラー: ${disconnectError.message}`, 'ERROR');
            }

            return {
                success: false,
                error: error.message,
                cycleNumber: this.cycleCount
            };

        } finally {
            this.isRunning = false;
        }
    }

    /**
     * 5.6.4 ログ管理とエラー処理
     */
    async logToFile(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}\n`;

        try {
            // ログディレクトリが存在しない場合は作成
            const logDir = path.dirname(this.config.logFile);
            await fs.mkdir(logDir, { recursive: true });

            // ログファイルに追記
            await fs.appendFile(this.config.logFile, logEntry);

            // コンソールにも出力
            console.log(`[EvolutionCycleManager] ${logEntry.trim()}`);

        } catch (error) {
            console.error(`ログ出力エラー: ${error.message}`);
        }
    }

    /**
     * 5.6.3 スケジューリング機能
     */
    startScheduler() {
        if (!this.config.schedulerEnabled) {
            this.logToFile('スケジューラーは無効に設定されています', 'INFO');
            return;
        }

        if (this.cronJob) {
            this.logToFile('スケジューラーは既に実行中です', 'WARN');
            return;
        }

        this.logToFile(`スケジューラー開始: ${this.config.cronPattern}`, 'INFO');

        this.cronJob = cron.schedule(this.config.cronPattern, async () => {
            await this.logToFile('スケジュール実行: 進化サイクル開始', 'INFO');
            const result = await this.executeSingleCycle();
            
            if (result.success) {
                await this.logToFile('スケジュール実行完了: 進化サイクル成功', 'INFO');
            } else {
                await this.logToFile(`スケジュール実行失敗: ${result.error}`, 'ERROR');
            }
        }, {
            scheduled: false,
            timezone: 'Asia/Tokyo'
        });

        this.cronJob.start();
        this.logToFile('スケジューラーが開始されました', 'INFO');
    }

    stopScheduler() {
        if (this.cronJob) {
            this.cronJob.destroy();
            this.cronJob = null;
            this.logToFile('スケジューラーを停止しました', 'INFO');
        }
    }

    /**
     * 現在の状態を取得
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            cycleCount: this.cycleCount,
            lastCycleAt: this.lastCycleAt,
            lastError: this.lastError,
            schedulerActive: this.cronJob !== null,
            rconStatus: this.rconManager.getConnectionStatus(),
            config: {
                ...this.config,
                rconConfig: { ...this.config.rconConfig, password: '***' } // パスワードをマスク
            }
        };
    }
}

module.exports = EvolutionCycleManager;
