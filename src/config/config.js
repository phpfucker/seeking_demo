/**
 * @fileoverview アプリケーションの設定を管理するモジュール
 */

require('dotenv').config();

/**
 * 環境変数から数値を取得する
 * @param {string} key - 環境変数のキー
 * @param {number} defaultValue - デフォルト値
 * @returns {number} 環境変数の値またはデフォルト値
 */
function getNumberEnv(key, defaultValue) {
    const value = process.env[key];
    if (!value) return defaultValue;
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
}

/**
 * 環境変数から文字列を取得する
 * @param {string} key - 環境変数のキー
 * @param {string} defaultValue - デフォルト値
 * @returns {string} 環境変数の値またはデフォルト値
 */
function getStringEnv(key, defaultValue) {
    return process.env[key] || defaultValue;
}

/**
 * OpenAI APIの設定
 * @typedef {Object} OpenAIConfig
 * @property {string} apiKey - OpenAI APIキー
 * @property {string} model - 使用するモデル名
 * @property {number} maxTokens - 最大トークン数
 */

/**
 * アプリケーションの設定
 * @typedef {Object} AppConfig
 * @property {number} updateInterval - 更新間隔（ミリ秒）
 */

/**
 * Minecraftの設定
 * @typedef {Object} MinecraftConfig
 * @property {string} modId - MODのID
 * @property {string} version - MODのバージョン
 */

/**
 * ロギングの設定
 * @typedef {Object} LoggingConfig
 * @property {string} level - ログレベル
 * @property {string} directory - ログファイルのディレクトリ
 */

/**
 * @type {Object} config
 * @property {OpenAIConfig} openai - OpenAI APIの設定
 * @property {AppConfig} app - アプリケーションの設定
 * @property {MinecraftConfig} minecraft - Minecraftの設定
 * @property {LoggingConfig} logging - ロギングの設定
 */
const config = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.MODEL_NAME || 'gpt-3.5-turbo',
        maxTokens: parseInt(process.env.MAX_TOKENS) || 4000
    },
    app: {
        updateInterval: parseInt(process.env.UPDATE_INTERVAL) || 3600000,
    },
    minecraft: {
        modId: process.env.MOD_ID || 'ailife',
        version: process.env.MOD_VERSION || '1.0.0'
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info'
    }
};

// 設定の検証
if (!config.openai.apiKey) {
    throw new Error('OPENAI_API_KEY is required');
}

// 設定をイミュータブルにする
Object.freeze(config);
Object.freeze(config.openai);
Object.freeze(config.app);
Object.freeze(config.minecraft);
Object.freeze(config.logging);

module.exports = config; 