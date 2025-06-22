package jp.seekin.minecraft.ailife;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.google.gson.reflect.TypeToken;

import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * ステータスデータ読み込みクラス（5.1.2実装）
 * Java MODが出力したcurrent_entity_status.jsonを読み込み、
 * 処理しやすい内部データ構造に整形する
 */
public class StatusDataReader {
    private static final String STATUS_FILE_NAME = "current_entity_status.json";
    
    private final String configDir;
    private final Gson gson;
    private Map<String, Object> temporaryStorage;

    public StatusDataReader(String configDir) {
        this.configDir = configDir;
        this.gson = new Gson();
        this.temporaryStorage = new HashMap<>();
    }

    /**
     * ステータスJSONファイルを読み込み、EntityStatusDataのリストを返す
     * 5.1.2.1の実装
     */
    public List<EntityStatusData> readStatusData() {
        Path statusFile = Paths.get(configDir, STATUS_FILE_NAME);
        
        if (!Files.exists(statusFile)) {
            return new ArrayList<>();
        }

        try (FileReader reader = new FileReader(statusFile.toFile())) {
            Type mapType = new TypeToken<Map<String, Object>>(){}.getType();
            Map<String, Object> jsonData = gson.fromJson(reader, mapType);
            
            if (jsonData == null || !jsonData.containsKey("entities")) {
                return new ArrayList<>();
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> entitiesData = (List<Map<String, Object>>) jsonData.get("entities");
            
            return parseEntities(entitiesData);
            
        } catch (IOException | JsonSyntaxException e) {
            throw new RuntimeException("ステータスファイルの読み込みに失敗しました: " + e.getMessage(), e);
        }
    }

    /**
     * 整形されたデータマップを取得する
     * 5.1.2.2の実装
     */
    public Map<String, Object> getFormattedDataMap() {
        List<EntityStatusData> entities = readStatusData();
        
        Map<String, Object> formattedData = new HashMap<>();
        formattedData.put("entities", entities);
        formattedData.put("entityCount", entities.size());
        
        long maleCount = entities.stream().filter(e -> "male".equals(e.getGender())).count();
        long femaleCount = entities.stream().filter(e -> "female".equals(e.getGender())).count();
        
        formattedData.put("maleCount", (int) maleCount);
        formattedData.put("femaleCount", (int) femaleCount);
        
        // 位置情報の統計も追加
        if (!entities.isEmpty()) {
            double avgX = entities.stream().mapToDouble(e -> e.getPosition().getX()).average().orElse(0.0);
            double avgY = entities.stream().mapToDouble(e -> e.getPosition().getY()).average().orElse(0.0);
            double avgZ = entities.stream().mapToDouble(e -> e.getPosition().getZ()).average().orElse(0.0);
            
            Map<String, Double> avgPosition = new HashMap<>();
            avgPosition.put("x", avgX);
            avgPosition.put("y", avgY);
            avgPosition.put("z", avgZ);
            
            formattedData.put("averagePosition", avgPosition);
        }
        
        return formattedData;
    }

    /**
     * データを一時的にメモリに保存する
     * 5.1.2.3の実装
     */
    public void saveToMemory() {
        Map<String, Object> formattedData = getFormattedDataMap();
        temporaryStorage.put("lastReadData", formattedData);
        temporaryStorage.put("lastReadTimestamp", System.currentTimeMillis());
    }

    /**
     * メモリから一時データを取得する
     */
    public Map<String, Object> getFromMemory() {
        return temporaryStorage;
    }

    /**
     * 一時ストレージをクリアする
     */
    public void clearMemory() {
        temporaryStorage.clear();
    }

    /**
     * エンティティデータをパースしてEntityStatusDataのリストに変換
     */
    private List<EntityStatusData> parseEntities(List<Map<String, Object>> entitiesData) {
        List<EntityStatusData> entities = new ArrayList<>();
        
        for (Map<String, Object> entityData : entitiesData) {
            try {
                EntityStatusData entity = parseEntity(entityData);
                if (entity != null) {
                    entities.add(entity);
                }
            } catch (Exception e) {
                // 不正なエンティティデータはスキップ
                System.err.println("エンティティデータのパースに失敗: " + e.getMessage());
            }
        }
        
        return entities;
    }

    /**
     * 単一のエンティティデータをパース
     */
    private EntityStatusData parseEntity(Map<String, Object> entityData) {
        // 実際のVPSデータに合わせて、entity_idとidの両方をサポート
        String id = null;
        if (entityData.containsKey("entity_id")) {
            id = (String) entityData.get("entity_id");
        } else if (entityData.containsKey("id")) {
            id = (String) entityData.get("id");
        }
        
        if (id == null) {
            return null; // IDが無い場合はスキップ
        }

        String gender = (String) entityData.getOrDefault("gender", "unknown");
        
        // DNAは文字列または配列の両方をサポート
        List<String> dna = parseDnaField(entityData.get("dna"));
        
        EntityStatusData.Position position = parsePosition(entityData.get("position"));
        
        double health = ((Number) entityData.getOrDefault("health", 0.0)).doubleValue();
        int age = ((Number) entityData.getOrDefault("age", 0)).intValue();
        
        return new EntityStatusData(id, gender, dna, position, health, age);
    }

    /**
     * DNAフィールドをパース（文字列または配列をサポート）
     */
    private List<String> parseDnaField(Object dnaData) {
        if (dnaData instanceof String) {
            // 文字列の場合、各文字を配列に変換
            String dnaString = (String) dnaData;
            List<String> dnaList = new ArrayList<>();
            for (char c : dnaString.toCharArray()) {
                dnaList.add(String.valueOf(c));
            }
            return dnaList;
        } else if (dnaData instanceof List) {
            // 既に配列の場合はそのまま使用
            @SuppressWarnings("unchecked")
            List<String> dnaList = (List<String>) dnaData;
            return dnaList;
        }
        
        return new ArrayList<>();
    }

    /**
     * 位置データをパース
     */
    private EntityStatusData.Position parsePosition(Object positionData) {
        if (positionData instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> posMap = (Map<String, Object>) positionData;
            
            double x = ((Number) posMap.getOrDefault("x", 0.0)).doubleValue();
            double y = ((Number) posMap.getOrDefault("y", 0.0)).doubleValue();
            double z = ((Number) posMap.getOrDefault("z", 0.0)).doubleValue();
            
            return new EntityStatusData.Position(x, y, z);
        }
        
        return new EntityStatusData.Position(0.0, 0.0, 0.0);
    }
} 