/**
 * @fileoverview OpenAI APIとの通信を管理するサービス
 */

const { OpenAI } = require('openai');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * レート制限の管理クラス
 */
class RateLimiter {
    constructor() {
        this.requestCount = 0;
        this.lastReset = Date.now();
        this.resetInterval = 60000; // 1分
        this.maxRequests = 50; // 1分あたりの最大リクエスト数
    }

    /**
     * リクエストが可能かチェック
     * @returns {boolean} リクエスト可能な場合はtrue
     */
    canMakeRequest() {
        const now = Date.now();
        if (now - this.lastReset >= this.resetInterval) {
            this.requestCount = 0;
            this.lastReset = now;
        }
        return this.requestCount < this.maxRequests;
    }

    /**
     * リクエストカウントを増やす
     */
    incrementCount() {
        this.requestCount++;
    }
}

/**
 * OpenAI APIクライアントクラス
 */
class OpenAIService {
    constructor() {
        this.client = new OpenAI({
            apiKey: config.openai.apiKey
        });
        this.rateLimiter = new RateLimiter();
    }

    /**
     * APIリクエストを実行
     * @param {Function} apiCall - 実行するAPI関数
     * @returns {Promise<any>} APIレスポンス
     * @private
     */
    async _makeRequest(apiCall) {
        if (!this.rateLimiter.canMakeRequest()) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        try {
            this.rateLimiter.incrementCount();
            const response = await apiCall();
            return response.data;
        } catch (error) {
            logger.error('OpenAI API error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });

            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }

            throw new Error(`OpenAI API error: ${error.message}`);
        }
    }

    /**
     * チャット完了APIを呼び出す
     * @param {Array<Object>} messages - チャットメッセージの配列
     * @param {Object} options - API オプション
     * @returns {Promise<Object>} APIレスポンス
     */
    async createChatCompletion(messages, options = {}) {
        const defaultOptions = {
            model: config.openai.model,
            max_tokens: config.openai.maxTokens,
            temperature: 0.7,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        };

        return this._makeRequest(() => 
            this.client.chat.completions.create({
                ...defaultOptions,
                ...options,
                messages
            })
        );
    }

    /**
     * テキスト生成APIを呼び出す
     * @param {string} prompt - 入力プロンプト
     * @param {Object} options - API オプション
     * @returns {Promise<Object>} APIレスポンス
     */
    async createCompletion(prompt, options = {}) {
        const defaultOptions = {
            model: config.openai.model,
            max_tokens: config.openai.maxTokens,
            temperature: 0.7,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        };

        return this._makeRequest(() => 
            this.client.chat.completions.create({
                ...defaultOptions,
                ...options,
                messages: [
                    {
                        role: "system",
                        content: "You are an AI analyzing Minecraft life entities. Analyze their behavior, relationships, and evolution potential."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        );
    }

    async analyzeEntities(entitiesData) {
        try {
            const response = await this.client.chat.completions.create({
                model: config.openai.model,
                messages: [
                    {
                        role: "system",
                        content: "You are an AI analyzing Minecraft life entities. Analyze their behavior, relationships, and evolution potential."
                    },
                    {
                        role: "user",
                        content: JSON.stringify(entitiesData)
                    }
                ],
                max_tokens: config.openai.maxTokens
            });

            return response.choices[0].message.content;
        } catch (error) {
            logger.error('OpenAI API error:', error);
            throw error;
        }
    }
}

// シングルトンインスタンスを作成
const openaiService = new OpenAIService();
Object.freeze(openaiService);

module.exports = openaiService; 