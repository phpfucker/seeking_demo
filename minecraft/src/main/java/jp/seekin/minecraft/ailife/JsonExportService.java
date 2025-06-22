package jp.seekin.minecraft.ailife;

import com.google.gson.*;
import org.apache.logging.log4j.Logger;

import java.io.File;
import java.io.FileWriter;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

/**
 * JSON形式でのデータ出力を担当するクラス
 * 
 * <p>このクラスは以下の責任を持ちます：</p>
 * <ul>
 *   <li>エンティティ情報のJSON形式への整形</li>
 *   <li>タイムスタンプ付きJSONファイルの出力</li>
 *   <li>出力ディレクトリの自動作成</li>
 * </ul>
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */
public class JsonExportService {
    
    private final Logger logger;
    
    /**
     * JsonExportServiceのコンストラクタ
     * 
     * @param logger ログ出力用のLoggerインスタンス
     */
    public JsonExportService(Logger logger) {
        this.logger = logger;
    }
    
    /**
     * AI生命体エンティティ情報をJSON形式でファイルに出力する
     * 
     * <p>出力されるJSONの構造：</p>
     * <pre>
     * {
     *   "timestamp": "2024-01-01T12:00:00Z",
     *   "entities": [
     *     {
     *       "entity_id": "adam",
     *       "gender": "male",
     *       "dna": "ACGTACGTACGTACGT",
     *       "position": {
     *         "x": 100.5,
     *         "y": 64.0,
     *         "z": 200.3
     *       }
     *     }
     *   ]
     * }
     * </pre>
     * 
     * @param entityInfoList AI生命体エンティティの情報リスト
     * @param outputFilePath 出力先ファイルパス
     * @throws RuntimeException ファイル出力に失敗した場合
     */
    public void exportEntityStatusToFile(List<JsonObject> entityInfoList, String outputFilePath) {
        logger.info("[AiLife] JsonExportService: AI生命体エンティティ情報のJSON出力を開始します: {}", outputFilePath);
        
        try {
            // Step 1: 出力用のJSONオブジェクトを構築
            JsonObject outputJson = new JsonObject();
            
            // タイムスタンプの追加（ISO 8601形式）
            String timestamp = Instant.now().toString();
            outputJson.addProperty("timestamp", timestamp);
            
            // エンティティ配列の追加
            JsonArray entitiesArray = new JsonArray();
            for (JsonObject entityInfo : entityInfoList) {
                entitiesArray.add(entityInfo);
            }
            outputJson.add("entities", entitiesArray);
            
            // Step 2: 出力ファイルの親ディレクトリを作成
            File outputFile = new File(outputFilePath);
            File parentDir = outputFile.getParentFile();
            if (parentDir != null && !parentDir.exists()) {
                boolean dirsCreated = parentDir.mkdirs();
                if (dirsCreated) {
                    logger.debug("[AiLife] 出力ディレクトリを作成しました: {}", parentDir.getAbsolutePath());
                }
            }
            
            // Step 3: JSONファイルの書き込み
            try (FileWriter writer = new FileWriter(outputFile, StandardCharsets.UTF_8)) {
                Gson gson = new GsonBuilder().setPrettyPrinting().create();
                gson.toJson(outputJson, writer);
                writer.flush();
            }
            
            logger.info("[AiLife] JsonExportService: JSON出力完了: {}体のエンティティ情報を出力しました ({})", 
                entityInfoList.size(), outputFilePath);
            
        } catch (Exception e) {
            logger.error("[AiLife] AI生命体エンティティ情報のJSON出力中にエラーが発生しました: {}", outputFilePath, e);
            throw new RuntimeException("JSON出力に失敗しました: " + e.getMessage(), e);
        }
    }
    
    /**
     * カスタムフォーマットでJSONを出力する（将来の拡張用）
     * 
     * @param entityInfoList エンティティ情報リスト
     * @param outputFilePath 出力先ファイルパス
     * @param includeTimestamp タイムスタンプを含めるかどうか
     * @param prettyPrint 整形出力するかどうか
     */
    public void exportEntityStatusToFileCustom(List<JsonObject> entityInfoList, String outputFilePath, 
                                             boolean includeTimestamp, boolean prettyPrint) {
        logger.info("[AiLife] JsonExportService: カスタムJSON出力を開始します: {}", outputFilePath);
        
        try {
            JsonObject outputJson = new JsonObject();
            
            // タイムスタンプの追加（オプション）
            if (includeTimestamp) {
                outputJson.addProperty("timestamp", Instant.now().toString());
            }
            
            // エンティティ配列の追加
            JsonArray entitiesArray = new JsonArray();
            for (JsonObject entityInfo : entityInfoList) {
                entitiesArray.add(entityInfo);
            }
            outputJson.add("entities", entitiesArray);
            
            // 出力ファイルの親ディレクトリを作成
            File outputFile = new File(outputFilePath);
            File parentDir = outputFile.getParentFile();
            if (parentDir != null && !parentDir.exists()) {
                parentDir.mkdirs();
            }
            
            // JSONファイルの書き込み
            try (FileWriter writer = new FileWriter(outputFile, StandardCharsets.UTF_8)) {
                Gson gson = prettyPrint ? 
                    new GsonBuilder().setPrettyPrinting().create() : 
                    new Gson();
                gson.toJson(outputJson, writer);
                writer.flush();
            }
            
            logger.info("[AiLife] JsonExportService: カスタムJSON出力完了: {}体のエンティティ情報を出力しました", 
                entityInfoList.size());
            
        } catch (Exception e) {
            logger.error("[AiLife] カスタムJSON出力中にエラーが発生しました: {}", outputFilePath, e);
            throw new RuntimeException("カスタムJSON出力に失敗しました: " + e.getMessage(), e);
        }
    }
} 