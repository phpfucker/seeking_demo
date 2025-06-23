/**
 * Auto Minecraft Evolution Main Script
 * 5.6.3 親スクリプトとスケジューリングの実装
 * 
 * @file auto-minecraft-evolution.js
 * @description 1時間ごとの自動進化サイクルを管理するメインスクリプト
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */

const EvolutionCycleManager = require('./evolution-cycle-manager');
const path = require('path');

/**
 * メイン実行クラス
 */
class AutoMinecraftEvolution {
    constructor() {
        this.config = this.buildConfig();
        this.cycleManager = new EvolutionCycleManager(this.config);
        this.isShuttingDown = false;
    }

    /**
     * 環境に応じた設定を構築
     */
    buildConfig() {
        // テストサイクル時は開発環境でRCON接続をスキップ
        const isTestCycle = process.argv.includes('--test-cycle');
        const isOnceMode = process.argv.includes('--once') || process.argv.includes('--run-once');
        const isProduction = process.env.NODE_ENV === 'production';
        const skipRcon = (isTestCycle || isOnceMode) && !isProduction;

        const baseConfig = {
            rconConfig: {
                host: process.env.RCON_HOST || 'localhost',
                port: parseInt(process.env.RCON_PORT) || 25575,
                password: process.env.RCON_PASSWORD || '',
                timeout: parseInt(process.env.RCON_TIMEOUT) || 5000
            },
            schedulerEnabled: true,
            cronPattern: process.env.EVOLUTION_CRON_PATTERN || '0 * * * *', // 1時間ごと
            continueOnError: process.env.CONTINUE_ON_ERROR === 'true',
            skipRcon: skipRcon
        };

        if (process.env.NODE_ENV === 'production') {
            baseConfig.logFile = '/opt/minecraft_forge_server/logs/auto-evolution.log';
        } else {
            baseConfig.logFile = './logs/auto-evolution.log';
        }

        return baseConfig;
    }

    /**
     * アプリケーション開始
     */
    async start() {
        try {
            console.log('=== Auto Minecraft Evolution 開始 ===');
            console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`ログファイル: ${this.config.logFile}`);
            console.log(`スケジュール: ${this.config.cronPattern}`);

            // 環境変数チェック
            await this.checkEnvironment();

            // 単発実行オプション（実行後に終了）
            if (process.argv.includes('--once') || process.argv.includes('--run-once')) {
                console.log('単発進化サイクルを実行します...');
                const result = await this.cycleManager.executeSingleCycle();
                
                if (result.success) {
                    console.log('✅ 進化サイクル成功');
                    console.log('単発実行完了。プロセスを終了します。');
                    process.exit(0);
                } else {
                    console.error('❌ 進化サイクル失敗:', result.error);
                    process.exit(1);
                }
            }

            // 初回テスト実行（オプション）
            if (process.argv.includes('--test-cycle')) {
                console.log('テストサイクルを実行します...');
                const result = await this.cycleManager.executeSingleCycle();
                
                if (result.success) {
                    console.log('✅ テストサイクル成功');
                } else {
                    console.error('❌ テストサイクル失敗:', result.error);
                    process.exit(1);
                }
            }

            // スケジューラー開始
            this.cycleManager.startScheduler();

            // 即座に実行するオプション
            if (process.argv.includes('--immediate')) {
                console.log('即座に進化サイクルを実行します...');
                const result = await this.cycleManager.executeSingleCycle();
                console.log('即座実行結果:', result.success ? '成功' : '失敗');
            }

            // シャットダウンハンドラーの設定
            this.setupShutdownHandlers();

            console.log('✅ 自動進化システムが開始されました');
            console.log('終了するには Ctrl+C を押してください');

            // プロセスを維持
            await this.keepAlive();

        } catch (error) {
            console.error('❌ 開始エラー:', error.message);
            process.exit(1);
        }
    }

    /**
     * 環境変数とシステム要件をチェック
     */
    async checkEnvironment() {
        console.log('環境チェック中...');

        // RCON設定チェック
        if (!this.config.rconConfig.password) {
            console.warn('⚠️  RCON_PASSWORD が設定されていません');
        }

        // RCON接続テスト（テストサイクル時は本番環境でのみ実行）
        const isTestCycle = process.argv.includes('--test-cycle');
        const isOnceMode = process.argv.includes('--once') || process.argv.includes('--run-once');
        const isProduction = process.env.NODE_ENV === 'production';

        if ((!isTestCycle && !isOnceMode) || isProduction) {
            try {
                const testResult = await this.cycleManager.rconManager.testConnection();
                if (testResult.success) {
                    console.log('✅ RCON接続テスト成功');
                } else {
                    console.warn('⚠️  RCON接続テスト失敗:', testResult.error);
                }
            } catch (error) {
                console.warn('⚠️  RCON接続テストでエラー:', error.message);
            }
        } else {
            console.log('✅ RCON接続テストスキップ（開発環境テスト）');
        }

        // ログディレクトリの作成確認
        const logDir = path.dirname(this.config.logFile);
        const fs = require('fs').promises;
        
        try {
            await fs.mkdir(logDir, { recursive: true });
            console.log('✅ ログディレクトリ確認完了');
        } catch (error) {
            console.error('❌ ログディレクトリ作成失敗:', error.message);
            throw error;
        }

        console.log('環境チェック完了');
    }

    /**
     * シャットダウンハンドラーの設定
     */
    setupShutdownHandlers() {
        const gracefulShutdown = async (signal) => {
            if (this.isShuttingDown) {
                console.log('強制終了中...');
                process.exit(1);
            }

            this.isShuttingDown = true;
            console.log(`\n${signal} シグナルを受信しました。graceful shutdown を開始します...`);

            try {
                // スケジューラー停止
                this.cycleManager.stopScheduler();
                console.log('✅ スケジューラーを停止しました');

                // RCON切断
                await this.cycleManager.rconManager.disconnect();
                console.log('✅ RCON接続を切断しました');

                // 進行中のサイクルを待機（最大30秒）
                if (this.cycleManager.isRunning) {
                    console.log('進行中の進化サイクル完了を待機中...');
                    
                    let waitTime = 0;
                    while (this.cycleManager.isRunning && waitTime < 30000) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        waitTime += 1000;
                    }

                    if (this.cycleManager.isRunning) {
                        console.log('⚠️  進化サイクルが完了しませんでした（タイムアウト）');
                    } else {
                        console.log('✅ 進化サイクルが完了しました');
                    }
                }

                console.log('✅ Graceful shutdown 完了');
                process.exit(0);

            } catch (error) {
                console.error('❌ Shutdown エラー:', error.message);
                process.exit(1);
            }
        };

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGUSR1', () => gracefulShutdown('SIGUSR1'));
        process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

        // 未処理の例外をキャッチ
        process.on('uncaughtException', (error) => {
            console.error('❌ 未処理の例外:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ 未処理のPromise rejection:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });
    }

    /**
     * プロセスを維持（無限ループ）
     */
    async keepAlive() {
        while (!this.isShuttingDown) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // 定期的にステータスを表示
            if (process.argv.includes('--verbose')) {
                const status = this.cycleManager.getStatus();
                console.log(`[Status] Running: ${status.isRunning}, Cycles: ${status.cycleCount}, Last: ${status.lastCycleAt}`);
            }
        }
    }

    /**
     * ステータス表示
     */
    async showStatus() {
        const status = this.cycleManager.getStatus();
        
        console.log('\n=== Auto Minecraft Evolution Status ===');
        console.log(`実行状態: ${status.isRunning ? '実行中' : '待機中'}`);
        console.log(`実行回数: ${status.cycleCount}`);
        console.log(`最終実行: ${status.lastCycleAt || 'まだ実行されていません'}`);
        console.log(`スケジューラー: ${status.schedulerActive ? '有効' : '無効'}`);
        console.log(`最終エラー: ${status.lastError || 'なし'}`);
        console.log(`RCON接続: ${status.rconStatus.connected ? '接続中' : '切断中'}`);
        console.log('=======================================\n');
    }
}

// メイン実行
if (require.main === module) {
    const app = new AutoMinecraftEvolution();

    // コマンドライン引数の処理
    if (process.argv.includes('--status')) {
        app.showStatus();
    } else if (process.argv.includes('--help')) {
        console.log(`
Usage: node auto-minecraft-evolution.js [options]

Options:
  --once           進化サイクルを1回だけ実行して終了（動作確認用）
  --run-once       --onceと同じ（別名）
  --test-cycle     テストサイクルを実行してから開始
  --immediate      開始時に即座に進化サイクルを実行
  --status         現在の状態を表示
  --verbose        詳細ログを表示
  --help           このヘルプを表示

Environment Variables:
  NODE_ENV                  実行環境 (production/development)
  RCON_HOST                 MinecraftサーバーのRCONホスト
  RCON_PORT                 RCONポート番号
  RCON_PASSWORD             RCON認証パスワード
  RCON_TIMEOUT              RCON接続タイムアウト（ミリ秒）
  EVOLUTION_CRON_PATTERN    実行スケジュール（cron形式）
  CONTINUE_ON_ERROR         エラー時も処理を継続するか（true/false）
        `);
    } else {
        app.start().catch(console.error);
    }
}

module.exports = AutoMinecraftEvolution;
