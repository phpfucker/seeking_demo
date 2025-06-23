/**
 * StatusDataReader Node.js版（5.1.2実装）
 * Java MODが出力したcurrent_entity_status.jsonを読み込み、
 * 処理しやすい内部データ構造に整形する
 */

const fs = require('fs');
const path = require('path');

class StatusDataReader {
    constructor(configDir) {
        this.configDir = configDir;
        this.statusFileName = 'current_entity_status.json';
        this.temporaryStorage = {};
    }

    /**
     * ステータスJSONファイルを読み込み、エンティティのリストを返す
     * 5.1.2.1の実装
     */
    async readStatusData() {
        const statusFile = path.join(this.configDir, this.statusFileName);
        
        if (!fs.existsSync(statusFile)) {
            return [];
        }

        try {
            const fileContent = fs.readFileSync(statusFile, 'utf8');
            const jsonData = JSON.parse(fileContent);
            
            if (!jsonData || !jsonData.entities) {
                return [];
            }

            return this.parseEntities(jsonData.entities);
            
        } catch (error) {
            throw new Error(`ステータスファイルの読み込みに失敗しました: ${error.message}`);
        }
    }

    /**
     * 整形されたデータマップを取得する
     * 5.1.2.2の実装
     */
    async getFormattedDataMap() {
        const entities = await this.readStatusData();
        
        const formattedData = {
            entities: entities,
            entityCount: entities.length,
            maleCount: entities.filter(e => e.gender === 'male').length,
            femaleCount: entities.filter(e => e.gender === 'female').length
        };
        
        // 位置情報の統計も追加
        if (entities.length > 0) {
            const avgX = entities.reduce((sum, e) => sum + e.position.x, 0) / entities.length;
            const avgY = entities.reduce((sum, e) => sum + e.position.y, 0) / entities.length;
            const avgZ = entities.reduce((sum, e) => sum + e.position.z, 0) / entities.length;
            
            formattedData.averagePosition = { x: avgX, y: avgY, z: avgZ };
        }
        
        return formattedData;
    }

    /**
     * データを一時的にメモリに保存する
     * 5.1.2.3の実装
     */
    async saveToMemory() {
        const formattedData = await this.getFormattedDataMap();
        this.temporaryStorage.lastReadData = formattedData;
        this.temporaryStorage.lastReadTimestamp = Date.now();
    }

    /**
     * メモリから一時データを取得する
     */
    getFromMemory() {
        return this.temporaryStorage;
    }

    /**
     * 一時ストレージをクリアする
     */
    clearMemory() {
        this.temporaryStorage = {};
    }

    /**
     * エンティティデータをパースして構造化されたリストに変換
     */
    parseEntities(entitiesData) {
        const entities = [];
        
        for (const entityData of entitiesData) {
            try {
                const entity = this.parseEntity(entityData);
                if (entity) {
                    entities.push(entity);
                }
            } catch (error) {
                // 不正なエンティティデータはスキップ
                console.error('エンティティデータのパースに失敗:', error.message);
            }
        }
        
        return entities;
    }

    /**
     * 単一のエンティティデータをパース
     */
    parseEntity(entityData) {
        // 実際のVPSデータに合わせて、entity_idとidの両方をサポート
        const id = entityData.entity_id || entityData.id;
        
        if (!id) {
            return null; // IDが無い場合はスキップ
        }

        return {
            id: id,
            gender: entityData.gender || 'unknown',
            dna: this.parseDnaField(entityData.dna),
            position: this.parsePosition(entityData.position),
            health: entityData.health || 0.0,
            age: entityData.age || 0,
            entity_type: entityData.entity_type || 'unknown',
            max_health: entityData.max_health || entityData.health || 0.0,
            // 5.1.2拡張: 特性データの追加
            behavior: entityData.behavior || null,
            sociality: entityData.sociality || null,
            lifespan: entityData.lifespan || null
        };
    }

    /**
     * DNAフィールドをパース（文字列または配列をサポート）
     */
    parseDnaField(dnaData) {
        if (typeof dnaData === 'string') {
            // 文字列の場合、各文字を配列に変換
            return dnaData.split('');
        } else if (Array.isArray(dnaData)) {
            // 既に配列の場合はそのまま使用
            return dnaData;
        }
        
        return [];
    }

    /**
     * 位置データをパース
     */
    parsePosition(positionData) {
        if (positionData && typeof positionData === 'object') {
            return {
                x: positionData.x || 0.0,
                y: positionData.y || 0.0,
                z: positionData.z || 0.0
            };
        }
        
        return { x: 0.0, y: 0.0, z: 0.0 };
    }

    /**
     * デバッグ用: 読み込んだデータをコンソールに出力
     */
    async debugPrintData() {
        try {
            const entities = await this.readStatusData();
            console.log('=== StatusDataReader Debug ===');
            console.log(`エンティティ数: ${entities.length}`);
            
            entities.forEach((entity, index) => {
                console.log(`[${index}] ID: ${entity.id}, Gender: ${entity.gender}, Position: (${entity.position.x}, ${entity.position.y}, ${entity.position.z})`);
            });
            
            const formattedData = await this.getFormattedDataMap();
            console.log(`男性: ${formattedData.maleCount}, 女性: ${formattedData.femaleCount}`);
            
        } catch (error) {
            console.error('デバッグ出力エラー:', error.message);
        }
    }
}

module.exports = StatusDataReader; 