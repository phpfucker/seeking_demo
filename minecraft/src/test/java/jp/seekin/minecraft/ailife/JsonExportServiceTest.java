package jp.seekin.minecraft.ailife;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * JsonExportServiceクラスの単体テスト
 * 
 * <p>テスト対象機能:</p>
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
@DisplayName("JsonExportService 単体テスト")
public class JsonExportServiceTest {

    /** テスト用ディレクトリ */
    private static final String TEST_DIR = "test-json-export";
    
    /** テスト用ファイル名 */
    private static final String TEST_FILE = "test_export.json";
    
    /** テスト用のパス */
    private Path testPath;
    
    /** テスト対象のJsonExportService */
    private JsonExportService jsonExportService;
    
    /** テスト用のLogger */
    private Logger logger;

    @BeforeEach
    @DisplayName("テスト環境のセットアップ")
    void setUp() throws IOException {
        // テスト用ディレクトリの準備
        Path testDir = Paths.get(TEST_DIR);
        Files.createDirectories(testDir);
        testPath = testDir.resolve(TEST_FILE);
        
        // 既存のテストファイルがあれば削除
        Files.deleteIfExists(testPath);
        
        // JsonExportServiceの初期化
        logger = LogManager.getLogger("TestLogger");
        jsonExportService = new JsonExportService(logger);
    }

    @AfterEach
    @DisplayName("テスト環境のクリーンアップ")
    void tearDown() throws IOException {
        // テストファイルの削除
        Files.deleteIfExists(testPath);
        
        // テストディレクトリの削除
        Path testDir = Paths.get(TEST_DIR);
        if (Files.exists(testDir)) {
            Files.delete(testDir);
        }
    }

    @Test
    @DisplayName("exportEntityStatusToFile: 空のエンティティリストでのJSON出力")
    void testExportEmptyEntityList() throws IOException {
        List<JsonObject> emptyList = new ArrayList<>();
        
        // 空のリストでJSON出力を実行
        jsonExportService.exportEntityStatusToFile(emptyList, testPath.toString());
        
        // ファイルが作成されたことを確認
        assertTrue(Files.exists(testPath), "JSONファイルが作成されているはず");
        
        // JSON内容の検証
        String content = Files.readString(testPath);
        JsonObject json = JsonParser.parseString(content).getAsJsonObject();
        
        assertTrue(json.has("timestamp"), "timestampフィールドが存在するはず");
        assertTrue(json.has("entities"), "entitiesフィールドが存在するはず");
        
        JsonArray entities = json.getAsJsonArray("entities");
        assertEquals(0, entities.size(), "エンティティ配列は空であるはず");
    }

    @Test
    @DisplayName("exportEntityStatusToFile: 単一エンティティでのJSON出力")
    void testExportSingleEntity() throws IOException {
        // テスト用エンティティデータの作成
        JsonObject entity = createTestEntityData("adam", "male", "ACGTACGTACGTACGT", 100.5, 64.0, 200.3);
        List<JsonObject> entityList = List.of(entity);
        
        // JSON出力を実行
        jsonExportService.exportEntityStatusToFile(entityList, testPath.toString());
        
        // ファイルが作成されたことを確認
        assertTrue(Files.exists(testPath), "JSONファイルが作成されているはず");
        
        // JSON内容の検証
        validateJsonContent(testPath, 1);
        
        // エンティティデータの詳細検証
        String content = Files.readString(testPath);
        JsonObject json = JsonParser.parseString(content).getAsJsonObject();
        JsonArray entities = json.getAsJsonArray("entities");
        JsonObject exportedEntity = entities.get(0).getAsJsonObject();
        
        assertEquals("adam", exportedEntity.get("entity_id").getAsString());
        assertEquals("male", exportedEntity.get("gender").getAsString());
        assertEquals("ACGTACGTACGTACGT", exportedEntity.get("dna").getAsString());
        
        JsonObject position = exportedEntity.getAsJsonObject("position");
        assertEquals(100.5, position.get("x").getAsDouble(), 0.001);
        assertEquals(64.0, position.get("y").getAsDouble(), 0.001);
        assertEquals(200.3, position.get("z").getAsDouble(), 0.001);
    }

    /**
     * テスト用のエンティティデータを作成するヘルパーメソッド
     */
    private JsonObject createTestEntityData(String entityId, String gender, String dna, 
                                          double x, double y, double z) {
        JsonObject entity = new JsonObject();
        entity.addProperty("entity_id", entityId);
        entity.addProperty("gender", gender);
        entity.addProperty("dna", dna);
        
        JsonObject position = new JsonObject();
        position.addProperty("x", x);
        position.addProperty("y", y);
        position.addProperty("z", z);
        entity.add("position", position);
        
        return entity;
    }

    /**
     * JSONファイルの内容を検証するヘルパーメソッド
     */
    private void validateJsonContent(Path filePath, int expectedEntityCount) throws IOException {
        String content = Files.readString(filePath);
        JsonObject json = JsonParser.parseString(content).getAsJsonObject();
        
        // 必須フィールドの存在確認
        assertTrue(json.has("timestamp"), "timestampフィールドが存在するはず");
        assertTrue(json.has("entities"), "entitiesフィールドが存在するはず");
        
        // エンティティ配列の確認
        JsonArray entities = json.getAsJsonArray("entities");
        assertEquals(expectedEntityCount, entities.size(), 
            "エンティティ数が期待値と一致するはず");
        
        // 各エンティティの必須フィールド確認
        for (int i = 0; i < entities.size(); i++) {
            JsonObject entity = entities.get(i).getAsJsonObject();
            assertTrue(entity.has("entity_id"), "entity_idフィールドが存在するはず");
            assertTrue(entity.has("gender"), "genderフィールドが存在するはず");
            assertTrue(entity.has("dna"), "dnaフィールドが存在するはず");
            assertTrue(entity.has("position"), "positionフィールドが存在するはず");
            
            JsonObject position = entity.getAsJsonObject("position");
            assertTrue(position.has("x"), "position.xフィールドが存在するはず");
            assertTrue(position.has("y"), "position.yフィールドが存在するはず");
            assertTrue(position.has("z"), "position.zフィールドが存在するはず");
        }
    }
} 