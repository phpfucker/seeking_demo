/**
 * 自動進化スクリプト (Node.js環境用)
 * GitHub Actionsから実行される
 * 
 * @file auto-evolution.js
 * @description OpenAI APIを使用して生命体を自動進化させる
 */

const fs = require('fs').promises;
const path = require('path');

class AutoEvolutionEngine {
    constructor() {
        this.maxRetries = 3;
        this.baseDelay = 1000;
        this.apiKey = process.env.OPENAI_API_KEY;
        
        if (!this.apiKey) {
            throw new Error('OPENAI_API_KEY環境変数が設定されていません');
        }
    }

    /**
     * 現在の状態ファイルを読み込む
     */
    async loadCurrentState() {
        try {
            const dataPath = path.join(__dirname, '..', 'data', 'current-state.json');
            
            // current-state.jsonが存在しない場合は、initial-state.jsonをコピー
            try {
                await fs.access(dataPath);
            } catch {
                console.log('current-state.jsonが存在しないため、initial-state.jsonからコピーします');
                const initialPath = path.join(__dirname, '..', 'data', 'initial-state.json');
                const initialData = await fs.readFile(initialPath, 'utf8');
                await fs.writeFile(dataPath, initialData);
            }
            
            const data = await fs.readFile(dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('現在の状態の読み込みに失敗:', error);
            return null;
        }
    }

    /**
     * 進化履歴を読み込む
     */
    async loadEvolutionHistory() {
        try {
            const historyPath = path.join(__dirname, '..', 'data', 'evolution-history.json');
            const data = await fs.readFile(historyPath, 'utf8');
            return JSON.parse(data);
        } catch {
            // ファイルが存在しない場合は空の配列を返す
            return [];
        }
    }

    /**
     * OpenAI APIに送信するプロンプトを生成
     */
    generatePrompt(currentState, evolutionHistory = []) {
        const historyText = evolutionHistory.length > 0 
            ? `進化履歴:\n${evolutionHistory.slice(-5).map((step, index) => 
                `ステップ${evolutionHistory.length - 4 + index}: ${step.entityA.report.reason} / ${step.entityB.report.reason}`
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
進化ステップ数: ${evolutionHistory.length + 1}

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
- 膝というテーマを保ちつつ、創造的な進化を
- 進化が進むにつれて、膝以外の形状に変化してもよい`;
    }

    /**
     * OpenAI APIを呼び出す
     */
    async callOpenAI(prompt) {
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'あなたは生命体の進化を専門とするAIです。膝形生命体の進化を創造的に描写してください。必ずJSON形式で回答してください。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * APIレスポンスを検証・パース
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

            // 基本構造の検証と修正
            if (!data.entityA || !data.entityB) {
                throw new Error('entityAまたはentityBが見つかりません');
            }

            // 各エンティティの検証と修正
            ['entityA', 'entityB'].forEach(entityKey => {
                const entity = data[entityKey];
                
                if (!Array.isArray(entity.cells) || entity.cells.length === 0) {
                    throw new Error(`${entityKey}のcellsが不正です`);
                }

                entity.cells.forEach((cell, index) => {
                    cell.x = Math.max(50, Math.min(350, Number(cell.x) || 100));
                    cell.y = Math.max(50, Math.min(350, Number(cell.y) || 100));
                    cell.radius = Math.max(5, Math.min(15, Number(cell.radius) || 10));
                    cell.color_h = Math.max(0, Math.min(360, Number(cell.color_h) || 180));
                    cell.shapeFactor = Math.max(0, Math.min(1, Number(cell.shapeFactor) || 0.5));
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
     * 指数バックオフ遅延
     */
    async delay(attempt) {
        const delayTime = this.baseDelay * Math.pow(2, attempt);
        return new Promise(resolve => setTimeout(resolve, delayTime));
    }

    /**
     * リトライ付きで進化を生成
     */
    async generateNextEvolution(currentState, evolutionHistory = []) {
        const prompt = this.generatePrompt(currentState, evolutionHistory);

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                console.log(`進化生成試行 ${attempt + 1}/${this.maxRetries}`);

                const response = await this.callOpenAI(prompt);
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
     * ファイルに状態を保存
     */
    async saveState(state, filename) {
        const filePath = path.join(__dirname, '..', 'data', filename);
        await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    }

    /**
     * メイン実行関数
     */
    async run() {
        try {
            console.log('自動進化を開始します...');
            
            // 現在の状態と履歴を読み込み
            const currentState = await this.loadCurrentState();
            const evolutionHistory = await this.loadEvolutionHistory();
            
            if (!currentState) {
                throw new Error('現在の状態を読み込めませんでした');
            }

            console.log(`現在の進化ステップ: ${evolutionHistory.length}`);

            // 次の進化を生成
            const nextState = await this.generateNextEvolution(currentState, evolutionHistory);
            
            if (!nextState) {
                throw new Error('進化の生成に失敗しました');
            }

            // 現在の状態を履歴に追加
            const newHistoryEntry = {
                ...currentState,
                timestamp: Date.now(),
                step: evolutionHistory.length + 1
            };

            evolutionHistory.push(newHistoryEntry);

            // ファイルを更新
            await this.saveState(nextState, 'current-state.json');
            await this.saveState(evolutionHistory, 'evolution-history.json');

            console.log('進化完了！ファイルを更新しました。');
            console.log(`新しい進化ステップ: ${evolutionHistory.length}`);

        } catch (error) {
            console.error('自動進化中にエラーが発生しました:', error);
            process.exit(1);
        }
    }
}

// スクリプトが直接実行された場合にメイン関数を実行
if (require.main === module) {
    const engine = new AutoEvolutionEngine();
    engine.run();
} 