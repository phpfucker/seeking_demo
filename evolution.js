/**
 * AI進化機能
 * OpenAI APIを使用して生命体の進化を生成する
 * 
 * @file evolution.js
 * @description AIによる生命体の進化ロジックを管理する
 */

class EvolutionEngine {
    constructor() {
        this.maxRetries = 3;
        this.baseDelay = 1000; // 1秒
    }

    /**
     * OpenAI APIに送信するプロンプトを生成する
     * @param {Object} currentState - 現在の進化状態
     * @param {Array} evolutionHistory - 進化履歴
     * @returns {string} プロンプト文字列
     */
    generatePrompt(currentState, evolutionHistory = []) {
        const historyText = evolutionHistory.length > 0 
            ? `進化履歴:\n${evolutionHistory.map((step, index) => 
                `ステップ${index + 1}: ${step.entityA.report.reason} / ${step.entityB.report.reason}`
              ).join('\n')}\n\n`
            : '';

        return `${historyText}現在の2体の膝形生命体の状態は以下の通りです：

entityA:
- 細胞数: ${currentState.entityA.cells.length}
- 位置: ${currentState.entityA.cells.map(c => `(${c.x}, ${c.y})`).join(', ')}
- 色相: ${currentState.entityA.cells.map(c => c.color_h).join(', ')}
- 形状ファクター: ${currentState.entityA.cells.map(c => c.shapeFactor).join(', ')}
- 前回の思考: ${currentState.entityA.report.thought}

entityB:
- 細胞数: ${currentState.entityB.cells.length}
- 位置: ${currentState.entityB.cells.map(c => `(${c.x}, ${c.y})`).join(', ')}
- 色相: ${currentState.entityB.cells.map(c => c.color_h).join(', ')}
- 形状ファクター: ${currentState.entityB.cells.map(c => c.shapeFactor).join(', ')}
- 前回の思考: ${currentState.entityB.report.thought}

これらの生命体は「膝」をテーマとした存在で、互いに影響を与えながら進化します。
次の進化ステップを以下のJSON形式で生成してください：

{
  "entityA": {
    "cells": [
      {"x": 数値, "y": 数値, "radius": 数値(5-15), "color_h": 数値(0-360), "shapeFactor": 数値(0-1)}
    ],
    "report": {
      "appearance": "現在の見た目の詳細な説明",
      "reason": "なぜこの進化が起こったのかの理由",
      "thought": "生命体の内面や感情を表す一言（『』で囲む）"
    }
  },
  "entityB": {
    "cells": [
      {"x": 数値, "y": 数値, "radius": 数値(5-15), "color_h": 数値(0-360), "shapeFactor": 数値(0-1)}
    ],
    "report": {
      "appearance": "現在の見た目の詳細な説明",
      "reason": "なぜこの進化が起こったのかの理由",
      "thought": "生命体の内面や感情を表す一言（『』で囲む）"
    }
  }
}

制約：
- x座標は50-350の範囲
- y座標は50-350の範囲
- 細胞数は1-8個の範囲
- 2体は互いに影響を与え合う関係
- 進化は段階的で劇的すぎない変化
- 膝というテーマを保ちつつ、創造的な進化を`;
    }

    /**
     * APIレスポンスからJSONを抽出・検証する
     * @param {string} responseText - APIからのレスポンステキスト
     * @returns {Object|null} 検証済みのJSONオブジェクト、またはnull
     */
    validateAndParseResponse(responseText) {
        try {
            // JSONブロックを抽出
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                             responseText.match(/\{[\s\S]*\}/);
            
            if (!jsonMatch) {
                throw new Error('JSON形式が見つかりません');
            }

            const jsonStr = jsonMatch[1] || jsonMatch[0];
            const data = JSON.parse(jsonStr);

            // 基本構造の検証
            if (!data.entityA || !data.entityB) {
                throw new Error('entityAまたはentityBが見つかりません');
            }

            // 各エンティティの検証
            ['entityA', 'entityB'].forEach(entityKey => {
                const entity = data[entityKey];
                
                if (!Array.isArray(entity.cells) || entity.cells.length === 0) {
                    throw new Error(`${entityKey}のcellsが不正です`);
                }

                entity.cells.forEach((cell, index) => {
                    if (typeof cell.x !== 'number' || cell.x < 50 || cell.x > 350) {
                        cell.x = Math.max(50, Math.min(350, cell.x || 100));
                    }
                    if (typeof cell.y !== 'number' || cell.y < 50 || cell.y > 350) {
                        cell.y = Math.max(50, Math.min(350, cell.y || 100));
                    }
                    if (typeof cell.radius !== 'number' || cell.radius < 5 || cell.radius > 15) {
                        cell.radius = Math.max(5, Math.min(15, cell.radius || 10));
                    }
                    if (typeof cell.color_h !== 'number' || cell.color_h < 0 || cell.color_h > 360) {
                        cell.color_h = Math.max(0, Math.min(360, cell.color_h || 180));
                    }
                    if (typeof cell.shapeFactor !== 'number' || cell.shapeFactor < 0 || cell.shapeFactor > 1) {
                        cell.shapeFactor = Math.max(0, Math.min(1, cell.shapeFactor || 0.5));
                    }
                });

                if (!entity.report || !entity.report.appearance || !entity.report.reason || !entity.report.thought) {
                    throw new Error(`${entityKey}のreportが不完全です`);
                }
            });

            return data;
        } catch (error) {
            console.error('Response validation error:', error);
            return null;
        }
    }

    /**
     * 指数バックオフを使用した遅延処理
     * @param {number} attempt - 試行回数
     * @returns {Promise} 遅延Promise
     */
    async delay(attempt) {
        const delayTime = this.baseDelay * Math.pow(2, attempt);
        return new Promise(resolve => setTimeout(resolve, delayTime));
    }

    /**
     * 次の進化状態を生成する（リトライ機能付き）
     * @param {Object} currentState - 現在の状態
     * @param {Array} evolutionHistory - 進化履歴
     * @returns {Promise<Object|null>} 次の進化状態またはnull
     */
    async generateNextEvolution(currentState, evolutionHistory = []) {
        const prompt = this.generatePrompt(currentState, evolutionHistory);

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                console.log(`進化生成試行 ${attempt + 1}/${this.maxRetries}`);

                // 注意: この部分は実際のOpenAI API呼び出しに置き換える必要があります
                // 現在はダミーレスポンスを返しています
                const response = await this.mockApiCall(prompt);

                const validatedData = this.validateAndParseResponse(response);
                
                if (validatedData) {
                    console.log('進化生成成功');
                    return validatedData;
                }

                throw new Error('データ検証に失敗しました');

            } catch (error) {
                console.error(`試行 ${attempt + 1} 失敗:`, error);
                
                if (attempt < this.maxRetries - 1) {
                    await this.delay(attempt);
                }
            }
        }

        console.error('全ての試行が失敗しました');
        return null;
    }

    /**
     * モックAPI呼び出し（開発用）
     * 実際のOpenAI API実装時にこのメソッドを置き換えてください
     */
    async mockApiCall(prompt) {
        // 開発用のダミーレスポンス
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機

        return `{
  "entityA": {
    "cells": [
      {"x": 105, "y": 125, "radius": 11, "color_h": 220, "shapeFactor": 0.6},
      {"x": 115, "y": 135, "radius": 10, "color_h": 225, "shapeFactor": 0.4}
    ],
    "report": {
      "appearance": "膝の形状がより丸みを帯び、青い光を放つようになった。",
      "reason": "entityBとの相互作用により、防御的な進化が促進された。",
      "thought": "『相手の存在を感じる...』"
    }
  },
  "entityB": {
    "cells": [
      {"x": 295, "y": 125, "radius": 12, "color_h": 180, "shapeFactor": 0.3},
      {"x": 285, "y": 135, "radius": 9, "color_h": 175, "shapeFactor": 0.5}
    ],
    "report": {
      "appearance": "緑がかった色調が濃くなり、より角張った形状に変化した。",
      "reason": "entityAの変化に対抗するため、攻撃的な特徴が発達した。",
      "thought": "『私も変わらなければ...』"
    }
  }
}`;
    }
}

// グローバルにインスタンスを作成
const evolutionEngine = new EvolutionEngine(); 