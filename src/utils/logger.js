/**
 * @fileoverview アプリケーションのロギング機能を提供するモジュール
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// ログディレクトリの作成
if (!fs.existsSync(config.logging.directory)) {
    fs.mkdirSync(config.logging.directory, { recursive: true });
}

/**
 * カスタムログフォーマットを作成
 * @returns {winston.Logform.Format} ログフォーマット
 */
function createLogFormat() {
    return winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    );
}

/**
 * コンソール出力用のフォーマットを作成
 * @returns {winston.Logform.Format} コンソール用フォーマット
 */
function createConsoleFormat() {
    return winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
            let msg = `${timestamp} [${level}]: ${message}`;
            if (Object.keys(metadata).length > 0) {
                msg += ` ${JSON.stringify(metadata)}`;
            }
            return msg;
        })
    );
}

/**
 * ログファイルのパスを生成
 * @param {string} filename - ログファイル名
 * @returns {string} 完全なファイルパス
 */
function getLogFilePath(filename) {
    return path.join(config.logging.directory, filename);
}

/**
 * エラーイベントのハンドラを設定
 * @param {winston.Logger} logger - Winstonロガーインスタンス
 */
function setupErrorHandlers(logger) {
    logger.on('error', (error) => {
        console.error('Logging error:', error);
    });
}

/**
 * ロガーインスタンスを作成
 * @returns {winston.Logger} 設定済みのロガーインスタンス
 */
function createLogger() {
    const logger = winston.createLogger({
        level: config.logging.level,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.File({ filename: 'error.log', level: 'error' }),
            new winston.transports.File({ filename: 'combined.log' }),
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        ]
    });

    setupErrorHandlers(logger);
    return logger;
}

/**
 * ログレベルに応じたメソッドを持つロガーインスタンス
 * @typedef {Object} Logger
 * @property {Function} error - エラーレベルのログを記録
 * @property {Function} warn - 警告レベルのログを記録
 * @property {Function} info - 情報レベルのログを記録
 * @property {Function} debug - デバッグレベルのログを記録
 */

/**
 * ロガーインスタンス
 * @type {Logger}
 */
const logger = createLogger();

// 開発環境の場合、詳細なログを出力
if (process.env.NODE_ENV !== 'production') {
    logger.level = 'debug';
}

module.exports = logger; 