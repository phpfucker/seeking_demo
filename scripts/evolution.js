/**
 * AI進化機能
 * OpenAI APIを使用して生命体の進化を生成する
 * 
 * @file evolution.js
 * @description AIによる生命体の進化ロジックを管理する
 */

const fs = require('fs').promises;
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');

// OpenAI APIの設定
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// 現在の状態を読み込む
async function loadCurrentState() {
    try {
        const data = await fs.readFile(path.join(__dirname, '../data/current-state.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // current-state.jsonがなければinitial-state.jsonを使用
        const data = await fs.readFile(path.join(__dirname, '../data/initial-state.json'), 'utf8');
        return JSON.parse(data);
    }
}

// 進化履歴を読み込む
async function loadEvolutionHistory() {
    try {
        const data = await fs.readFile(path.join(__dirname, '../data/evolution-history.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// 進化履歴を保存する
async function saveEvolutionHistory(history) {
    await fs.writeFile(
        path.join(__dirname, '../data/evolution-history.json'),
        JSON.stringify(history, null, 2)
    );
}

// 現在の状態を保存する
async function saveCurrentState(state) {
    await fs.writeFile(
        path.join(__dirname, '../data/current-state.json'),
        JSON.stringify(state, null, 2)
    );
}

// プロンプトを生成する
function generatePrompt(currentState, history) {
    return `以下の2体の膝形生命体の現在の状態と進化履歴に基づいて、次の進化状態を生成してください。

現在の状態:
${JSON.stringify(currentState, null, 2)}

進化履歴:
${JSON.stringify(history, null, 2)}

以下の形式でJSONを返してください:
{
  "entityA": {
    "cells": [
      {"x": 数値, "y": 数値, "radius": 数値, "color_h": 数値, "shapeFactor": 数値},
      ...
    ],
    "report": {
      "appearance": "現在の姿の説明",
      "reason": "進化の理由",
      "thought": "内面の描写"
    }
  },
  "entityB": {
    // entityAと同じ形式
  }
}

注意:
- x, yは0-400の範囲
- radiusは5-20の範囲
- color_hは0-360の範囲
- shapeFactorは0-1の範囲
- 2体の生命体は互いに影響を与え合う
- 進化は自然で意味のある変化であること`;
}

// 次の進化状態を生成する
async function generateNextEvolution(currentState, history) {
    const prompt = generatePrompt(currentState, history);
    
    try {
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            max_tokens: 1000,
            temperature: 0.7,
        });
        
        // AIの返答内容を出力
        console.log('AI response:', response.data.choices[0].text);
        
        const nextState = JSON.parse(response.data.choices[0].text.trim());
        
        // バリデーション
        validateState(nextState);
        
        return nextState;
    } catch (error) {
        console.error('Evolution generation failed:', error);
        return null;
    }
}

// 状態のバリデーション
function validateState(state) {
    const validateCell = (cell) => {
        if (cell.x < 0 || cell.x > 400) throw new Error('Invalid x coordinate');
        if (cell.y < 0 || cell.y > 400) throw new Error('Invalid y coordinate');
        if (cell.radius < 5 || cell.radius > 20) throw new Error('Invalid radius');
        if (cell.color_h < 0 || cell.color_h > 360) throw new Error('Invalid color_h');
        if (cell.shapeFactor < 0 || cell.shapeFactor > 1) throw new Error('Invalid shapeFactor');
    };
    
    state.entityA.cells.forEach(validateCell);
    state.entityB.cells.forEach(validateCell);
}

// メイン処理
async function main() {
    try {
        // 現在の状態と履歴を読み込む
        const currentState = await loadCurrentState();
        const history = await loadEvolutionHistory();
        
        // 次の進化状態を生成
        const nextState = await generateNextEvolution(currentState, history);
        
        if (nextState) {
            // 現在の状態を履歴に追加
            history.push({
                ...currentState,
                timestamp: Date.now()
            });
            
            // 履歴を保存
            await saveEvolutionHistory(history);
            
            // 新しい状態を保存
            await saveCurrentState(nextState);
            
            console.log('Evolution completed successfully');
        } else {
            console.error('Evolution generation failed');
        }
    } catch (error) {
        console.error('Error in evolution process:', error);
        process.exit(1);
    }
}

// スクリプトを実行
main(); 