const { encoding_for_model } = require('tiktoken');

/**
 * トークン制限管理システム
 * ChatGPT API向けのトークン計算と動的データ調整を行うクラス
 * 
 * @class TokenManager
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 * @example
 * const tokenManager = new TokenManager();
 * const tokens = tokenManager.calculateTokens("Hello world");
 * const adjustedData = tokenManager.adjustDataForTokenLimit(data, 3000);
 */
class TokenManager {
    /**
     * TokenManagerコンストラクタ
     * 
     * @param {string} model - 使用するGPTモデル名（デフォルト: 'gpt-4o-mini'）
     * @param {number} tokenLimit - トークン制限値（デフォルト: 3000）
     * @param {number} userGuidanceLimit - 管理者指示のトークン制限（デフォルト: 500）
     */
    constructor(model = 'gpt-4o-mini', tokenLimit = 3000, userGuidanceLimit = 500) {
        // tiktokenエンコーディングの初期化
        try {
            this.encoding = encoding_for_model(model);
        } catch (error) {
            throw new Error(`モデル ${model} のエンコーディング初期化に失敗: ${error.message}`);
        }
        
        this.model = model;
        this.tokenLimit = tokenLimit;
        this.userGuidanceLimit = userGuidanceLimit;
        
        // 安全マージン設定（実際の制限より少し余裕を持つ）
        this.safetyMargin = 0.1; // 10%のマージン
    }

    /**
     * 文字列のトークン数を計算
     * 
     * @param {string} text - トークン数を計算する文字列
     * @returns {number} トークン数
     * @throws {Error} 入力が文字列でない場合
     * 
     * @example
     * const tokens = tokenManager.calculateTokens("Hello, world!");
     * console.log(tokens); // 例: 4
     */
    calculateTokens(text) {
        if (typeof text !== 'string') {
            throw new Error('入力は文字列である必要があります');
        }
        
        if (text === '') {
            return 0;
        }
        
        try {
            const tokens = this.encoding.encode(text);
            return tokens.length;
        } catch (error) {
            throw new Error(`トークン計算エラー: ${error.message}`);
        }
    }

    /**
     * JSONオブジェクトのトークン数を計算
     * 
     * @param {Object} jsonData - トークン数を計算するJSONオブジェクト
     * @returns {number} トークン数
     * @throws {Error} JSONの文字列化に失敗した場合
     * 
     * @example
     * const tokens = tokenManager.calculateJsonTokens({message: "Hello"});
     */
    calculateJsonTokens(jsonData) {
        try {
            const jsonString = JSON.stringify(jsonData);
            return this.calculateTokens(jsonString);
        } catch (error) {
            throw new Error(`JSON文字列化エラー: ${error.message}`);
        }
    }

    /**
     * トークン制限内かどうかをチェック
     * 
     * @param {number} tokenCount - チェックするトークン数
     * @param {number} [customLimit] - カスタム制限値（省略時はデフォルト制限使用）
     * @returns {boolean} 制限内の場合true
     * 
     * @example
     * const isValid = tokenManager.isWithinLimit(2500); // true
     * const isValidCustom = tokenManager.isWithinLimit(600, 500); // false
     */
    isWithinLimit(tokenCount, customLimit = null) {
        if (typeof tokenCount !== 'number' || tokenCount < 0) {
            throw new Error('トークン数は0以上の数値である必要があります');
        }
        
        const limit = customLimit || this.tokenLimit;
        const effectiveLimit = Math.floor(limit * (1 - this.safetyMargin));
        return tokenCount <= effectiveLimit;
    }

    /**
     * 管理者指示テキストのトークン制限チェックと自動切り詰め
     * 
     * @param {string} userGuidance - 管理者指示テキスト
     * @returns {Object} {text: string, tokens: number, wasTruncated: boolean}
     * 
     * @example
     * const result = tokenManager.validateUserGuidance("長い指示...");
     * console.log(result.wasTruncated); // 切り詰められた場合true
     */
    validateUserGuidance(userGuidance) {
        if (typeof userGuidance !== 'string') {
            throw new Error('管理者指示は文字列である必要があります');
        }

        const originalTokens = this.calculateTokens(userGuidance);
        
        if (this.isWithinLimit(originalTokens, this.userGuidanceLimit)) {
            return {
                text: userGuidance,
                tokens: originalTokens,
                wasTruncated: false
            };
        }

        // トークン制限を超えている場合は切り詰め
        let truncatedText = userGuidance;
        let tokens = originalTokens;
        
        // 文字数ベースの大まかな切り詰め（効率的な方法）
        const targetLength = Math.floor(userGuidance.length * (this.userGuidanceLimit / originalTokens) * 0.9);
        truncatedText = userGuidance.substring(0, targetLength) + '...';
        tokens = this.calculateTokens(truncatedText);
        
        // 微調整（必要に応じて）
        while (tokens > this.userGuidanceLimit && truncatedText.length > 10) {
            truncatedText = truncatedText.substring(0, truncatedText.length - 10) + '...';
            tokens = this.calculateTokens(truncatedText);
        }

        return {
            text: truncatedText,
            tokens: tokens,
            wasTruncated: true
        };
    }

    /**
     * 繁殖ペアデータを距離順にソートし、トークン制限内に動的調整
     * 
     * @param {Array} breedingPairs - 繁殖ペア配列
     * @param {Array} availableEntities - 利用可能エンティティ配列
     * @param {Object} geneticsRules - 遺伝ルール
     * @param {string} [userGuidance=''] - 管理者指示
     * @returns {Object} 調整されたデータとメタ情報
     * 
     * @example
     * const adjusted = tokenManager.adjustBreedingPairsForTokenLimit(pairs, entities, rules);
     * console.log(adjusted.adjustedPairs.length); // 調整後のペア数
     */
    adjustBreedingPairsForTokenLimit(breedingPairs, availableEntities, geneticsRules, userGuidance = '') {
        // 入力検証
        if (!Array.isArray(breedingPairs)) {
            throw new Error('breedingPairsは配列である必要があります');
        }
        if (!Array.isArray(availableEntities)) {
            throw new Error('availableEntitiesは配列である必要があります');
        }

        // 管理者指示の処理
        const guidanceResult = this.validateUserGuidance(userGuidance);
        
        // 距離順でソート（近い順）
        const sortedPairs = [...breedingPairs].sort((a, b) => a.distance - b.distance);
        
        // 固定要素のトークン計算
        const baseData = {
            user_guidance: guidanceResult.text,
            available_entities: availableEntities,
            genetics_rules: geneticsRules,
            breeding_pairs: [] // これを動的に調整
        };
        
        const baseTokens = this.calculateJsonTokens(baseData);
        const availableTokensForPairs = this.tokenLimit - baseTokens - Math.floor(this.tokenLimit * this.safetyMargin);
        
        // ペアを順次追加しながらトークン数をチェック
        const adjustedPairs = [];
        let currentPairTokens = 0;
        
        for (const pair of sortedPairs) {
            const pairTokens = this.calculateJsonTokens(pair);
            
            if (currentPairTokens + pairTokens <= availableTokensForPairs) {
                adjustedPairs.push(pair);
                currentPairTokens += pairTokens;
            } else {
                break; // これ以上追加できない
            }
        }
        
        // 最低1ペアは保持（最も近いペア）
        if (adjustedPairs.length === 0 && sortedPairs.length > 0) {
            adjustedPairs.push(sortedPairs[0]);
            currentPairTokens = this.calculateJsonTokens(sortedPairs[0]);
        }
        
        const finalData = {
            user_guidance: guidanceResult.text,
            breeding_pairs: adjustedPairs,
            available_entities: availableEntities,
            genetics_rules: geneticsRules
        };
        
        const finalTokens = this.calculateJsonTokens(finalData);
        
        return {
            adjustedData: finalData,
            adjustedPairs: adjustedPairs,
            totalTokens: finalTokens,
            originalPairCount: breedingPairs.length,
            adjustedPairCount: adjustedPairs.length,
            userGuidanceResult: guidanceResult,
            isWithinLimit: this.isWithinLimit(finalTokens),
            tokenUtilization: finalTokens / this.tokenLimit
        };
    }

    /**
     * トークン使用状況の詳細レポートを生成
     * 
     * @param {Object} data - 分析するデータ
     * @returns {Object} トークン使用状況レポート
     */
    generateTokenReport(data) {
        const totalTokens = this.calculateJsonTokens(data);
        const effectiveLimit = Math.floor(this.tokenLimit * (1 - this.safetyMargin));
        
        return {
            totalTokens: totalTokens,
            tokenLimit: this.tokenLimit,
            effectiveLimit: effectiveLimit,
            utilization: totalTokens / this.tokenLimit,
            isWithinLimit: this.isWithinLimit(totalTokens),
            remainingTokens: effectiveLimit - totalTokens,
            model: this.model
        };
    }

    /**
     * リソースクリーンアップ
     * tiktokenエンコーディングリソースを解放
     */
    dispose() {
        if (this.encoding && typeof this.encoding.free === 'function') {
            this.encoding.free();
        }
    }
}

module.exports = TokenManager; 