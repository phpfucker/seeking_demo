package jp.seekin.minecraft.ailife;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * JSONファイル構造の妥当性テスト
 * 
 * <p>テスト対象:</p>
 * <ul>
 *   <li>実装済み: initial_adam_eve.jsonの構造妥当性</li>
 *   <li>実装済み: generated_entities.jsonの構造妥当性</li>
 *   <li>実装済み: 必須フィールドの存在確認</li>
 *   <li>実装済み: データ型とフォーマット検証</li>
 * </ul>
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */
@DisplayName("JSONファイル構造 実装済み機能テスト")
public class JsonFileStructureTest {
    
    private Path testConfigDir;
    private Path testInitialFile;
    private Path testGeneratedFile;
    
    @BeforeEach
    void setUp() throws IOException {
        // テスト用ディレクトリとファイルの準備
        testConfigDir = Paths.get("test-config-json");
        testInitialFile = testConfigDir.resolve("test_initial_adam_eve.json");
        testGeneratedFile = testConfigDir.resolve("test_generated_entities.json");
        
        Files.createDirectories(testConfigDir);
        
        // テスト用の初期JSONファイルを作成
        createTestInitialAdamEveJson();
        createTestGeneratedEntitiesJson();
        
        System.out.println("JSONファイル構造テスト環境セットアップ完了: " + testConfigDir.toAbsolutePath());
    }
    
    @AfterEach
    void tearDown() throws IOException {
        // テストファイルのクリーンアップ
        Files.deleteIfExists(testInitialFile);
        Files.deleteIfExists(testGeneratedFile);
        Files.deleteIfExists(testConfigDir);
        
        System.out.println("JSONファイル構造テスト環境クリーンアップ完了");
    }
    
    @Test
    @DisplayName("実装済み: initial_adam_eve.json構造妥当性テスト")
    void testInitialAdamEveJsonStructure() throws IOException {
        // JSONファイルの読み込み
        JsonArray entities;
        try (FileReader reader = new FileReader(testInitialFile.toFile(), StandardCharsets.UTF_8)) {
            entities = JsonParser.parseReader(reader).getAsJsonArray();
        }
        
        // 基本構造の確認
        assertNotNull(entities, "JSONが正常に読み込まれるはず");
        assertEquals(2, entities.size(), "初期データは2体（adam/eve）であるはず");
        
        // 各エンティティの詳細確認
        JsonObject adam = null;
        JsonObject eve = null;
        
        for (JsonElement elem : entities) {
            JsonObject entity = elem.getAsJsonObject();
            String entityId = entity.get("entity_id").getAsString();
            
            if ("adam".equals(entityId)) {
                adam = entity;
            } else if ("eve".equals(entityId)) {
                eve = entity;
            }
        }
        
        assertNotNull(adam, "adamのデータが存在するはず");
        assertNotNull(eve, "eveのデータが存在するはず");
        
        // adamの詳細確認
        validateEntityStructure(adam, "adam", "male", "ACGTACGTACGTACGT");
        
        // eveの詳細確認
        validateEntityStructure(eve, "eve", "female", "TGCATGCATGCATGCA");
        
        System.out.println("initial_adam_eve.json構造妥当性テスト完了");
    }
    
    @Test
    @DisplayName("実装済み: generated_entities.json構造妥当性テスト")
    void testGeneratedEntitiesJsonStructure() throws IOException {
        // JSONファイルの読み込み
        JsonArray entities;
        try (FileReader reader = new FileReader(testGeneratedFile.toFile(), StandardCharsets.UTF_8)) {
            entities = JsonParser.parseReader(reader).getAsJsonArray();
        }
        
        // 基本構造の確認
        assertNotNull(entities, "JSONが正常に読み込まれるはず");
        assertTrue(entities.size() >= 2, "generated_entities.jsonは最低2体（adam/eve）を含むはず");
        
        // 各エンティティの構造確認
        for (JsonElement elem : entities) {
            JsonObject entity = elem.getAsJsonObject();
            String entityId = entity.get("entity_id").getAsString();
            
            // 必須フィールドの存在確認
            validateRequiredFields(entity, entityId);
            
            // データ型の確認
            validateFieldTypes(entity, entityId);
        }
        
        System.out.println("generated_entities.json構造妥当性テスト完了");
    }
    
    @Test
    @DisplayName("実装済み: 必須フィールド存在確認テスト")
    void testRequiredFieldsPresence() throws IOException {
        JsonArray entities;
        try (FileReader reader = new FileReader(testInitialFile.toFile(), StandardCharsets.UTF_8)) {
            entities = JsonParser.parseReader(reader).getAsJsonArray();
        }
        
        String[] requiredFields = {
            "entity_id", "name", "gender", "parent_ids", "generation", 
            "dna", "model", "texture", "animation", "behavior", 
            "sociality", "lifespan"
        };
        
        for (JsonElement elem : entities) {
            JsonObject entity = elem.getAsJsonObject();
            String entityId = entity.get("entity_id").getAsString();
            
            for (String field : requiredFields) {
                assertTrue(entity.has(field), 
                    String.format("エンティティ '%s' に必須フィールド '%s' が存在するはず", entityId, field));
                
                JsonElement fieldElement = entity.get(field);
                assertNotNull(fieldElement, 
                    String.format("エンティティ '%s' のフィールド '%s' がnullではないはず", entityId, field));
            }
        }
        
        System.out.println("必須フィールド存在確認テスト完了");
    }
    
    @Test
    @DisplayName("実装済み: データ型検証テスト")
    void testDataTypeValidation() throws IOException {
        JsonArray entities;
        try (FileReader reader = new FileReader(testInitialFile.toFile(), StandardCharsets.UTF_8)) {
            entities = JsonParser.parseReader(reader).getAsJsonArray();
        }
        
        for (JsonElement elem : entities) {
            JsonObject entity = elem.getAsJsonObject();
            String entityId = entity.get("entity_id").getAsString();
            
            // 文字列フィールドの確認
            String[] stringFields = {"entity_id", "name", "gender", "dna", "model", "texture", "animation", "behavior", "sociality"};
            for (String field : stringFields) {
                assertTrue(entity.get(field).isJsonPrimitive(), 
                    String.format("エンティティ '%s' のフィールド '%s' は文字列であるはず", entityId, field));
                assertFalse(entity.get(field).getAsString().trim().isEmpty(), 
                    String.format("エンティティ '%s' のフィールド '%s' は空文字列ではないはず", entityId, field));
            }
            
            // 数値フィールドの確認
            assertTrue(entity.get("generation").isJsonPrimitive(), 
                String.format("エンティティ '%s' のgenerationは数値であるはず", entityId));
            assertTrue(entity.get("generation").getAsInt() > 0, 
                String.format("エンティティ '%s' のgenerationは正の数であるはず", entityId));
            
            assertTrue(entity.get("lifespan").isJsonPrimitive(), 
                String.format("エンティティ '%s' のlifespanは数値であるはず", entityId));
            assertTrue(entity.get("lifespan").getAsInt() > 0, 
                String.format("エンティティ '%s' のlifespanは正の数であるはず", entityId));
            
            // 配列フィールドの確認
            assertTrue(entity.get("parent_ids").isJsonArray(), 
                String.format("エンティティ '%s' のparent_idsは配列であるはず", entityId));
        }
        
        System.out.println("データ型検証テスト完了");
    }
    
    @Test
    @DisplayName("実装済み: DNA配列フォーマット検証テスト")
    void testDnaFormatValidation() throws IOException {
        JsonArray entities;
        try (FileReader reader = new FileReader(testInitialFile.toFile(), StandardCharsets.UTF_8)) {
            entities = JsonParser.parseReader(reader).getAsJsonArray();
        }
        
        for (JsonElement elem : entities) {
            JsonObject entity = elem.getAsJsonObject();
            String entityId = entity.get("entity_id").getAsString();
            String dna = entity.get("dna").getAsString();
            
            // DNA長の確認
            assertEquals(16, dna.length(), 
                String.format("エンティティ '%s' のDNAは16文字であるはず", entityId));
            
            // DNA塩基の確認（A, C, G, Tのみ）
            assertTrue(dna.matches("[ACGT]+"), 
                String.format("エンティティ '%s' のDNAはA, C, G, Tのみで構成されるはず", entityId));
            
            // 既知のDNA確認
            if ("adam".equals(entityId)) {
                assertEquals("ACGTACGTACGTACGT", dna, "adamのDNAが期待値と一致するはず");
            } else if ("eve".equals(entityId)) {
                assertEquals("TGCATGCATGCATGCA", dna, "eveのDNAが期待値と一致するはず");
            }
        }
        
        System.out.println("DNA配列フォーマット検証テスト完了");
    }
    
    @Test
    @DisplayName("実装済み: 性別データ検証テスト")
    void testGenderDataValidation() throws IOException {
        JsonArray entities;
        try (FileReader reader = new FileReader(testInitialFile.toFile(), StandardCharsets.UTF_8)) {
            entities = JsonParser.parseReader(reader).getAsJsonArray();
        }
        
        boolean hasMale = false;
        boolean hasFemale = false;
        
        for (JsonElement elem : entities) {
            JsonObject entity = elem.getAsJsonObject();
            String entityId = entity.get("entity_id").getAsString();
            String gender = entity.get("gender").getAsString();
            
            // 有効な性別値の確認
            assertTrue(gender.equals("male") || gender.equals("female"), 
                String.format("エンティティ '%s' の性別は'male'または'female'であるはず", entityId));
            
            if ("male".equals(gender)) hasMale = true;
            if ("female".equals(gender)) hasFemale = true;
            
            // 既知の性別確認
            if ("adam".equals(entityId)) {
                assertEquals("male", gender, "adamの性別はmaleであるはず");
            } else if ("eve".equals(entityId)) {
                assertEquals("female", gender, "eveの性別はfemaleであるはず");
            }
        }
        
        // 両方の性別が存在することを確認
        assertTrue(hasMale, "male個体が存在するはず");
        assertTrue(hasFemale, "female個体が存在するはず");
        
        System.out.println("性別データ検証テスト完了");
    }
    
    /**
     * エンティティの基本構造を検証するヘルパーメソッド
     */
    private void validateEntityStructure(JsonObject entity, String expectedId, String expectedGender, String expectedDna) {
        assertEquals(expectedId, entity.get("entity_id").getAsString(), 
            expectedId + "のentity_idが正しいはず");
        assertEquals(expectedId, entity.get("name").getAsString(), 
            expectedId + "のnameが正しいはず");
        assertEquals(expectedGender, entity.get("gender").getAsString(), 
            expectedId + "のgenderが正しいはず");
        assertEquals(expectedDna, entity.get("dna").getAsString(), 
            expectedId + "のdnaが正しいはず");
        assertEquals(1, entity.get("generation").getAsInt(), 
            expectedId + "のgenerationが1であるはず");
        assertTrue(entity.get("parent_ids").getAsJsonArray().size() == 0, 
            expectedId + "のparent_idsが空配列であるはず");
    }
    
    /**
     * 必須フィールドの存在を確認するヘルパーメソッド
     */
    private void validateRequiredFields(JsonObject entity, String entityId) {
        String[] requiredFields = {
            "entity_id", "name", "gender", "dna", "model"
        };
        
        for (String field : requiredFields) {
            assertTrue(entity.has(field), 
                String.format("エンティティ '%s' に必須フィールド '%s' が存在するはず", entityId, field));
        }
    }
    
    /**
     * フィールドの型を確認するヘルパーメソッド
     */
    private void validateFieldTypes(JsonObject entity, String entityId) {
        // 文字列フィールド
        String[] stringFields = {"entity_id", "name", "gender", "dna"};
        for (String field : stringFields) {
            if (entity.has(field)) {
                assertTrue(entity.get(field).isJsonPrimitive(), 
                    String.format("エンティティ '%s' のフィールド '%s' は文字列であるはず", entityId, field));
            }
        }
        
        // 数値フィールド
        if (entity.has("generation")) {
            assertTrue(entity.get("generation").isJsonPrimitive(), 
                String.format("エンティティ '%s' のgenerationは数値であるはず", entityId));
        }
    }
    
    /**
     * テスト用のinitial_adam_eve.jsonファイルを作成
     */
    private void createTestInitialAdamEveJson() throws IOException {
        JsonArray entities = new JsonArray();
        
        // adam
        JsonObject adam = new JsonObject();
        adam.addProperty("entity_id", "adam");
        adam.addProperty("name", "adam");
        adam.addProperty("gender", "male");
        adam.add("parent_ids", new JsonArray());
        adam.addProperty("generation", 1);
        adam.addProperty("dna", "ACGTACGTACGTACGT");
        adam.addProperty("model", "models/entity/villager.geo.json");
        adam.addProperty("texture", "textures/entity/villager/villager.png");
        adam.addProperty("animation", "animations/entity/villager.animation.json");
        adam.addProperty("behavior", "curious");
        adam.addProperty("sociality", "leader");
        adam.addProperty("lifespan", 1500);
        entities.add(adam);
        
        // eve
        JsonObject eve = new JsonObject();
        eve.addProperty("entity_id", "eve");
        eve.addProperty("name", "eve");
        eve.addProperty("gender", "female");
        eve.add("parent_ids", new JsonArray());
        eve.addProperty("generation", 1);
        eve.addProperty("dna", "TGCATGCATGCATGCA");
        eve.addProperty("model", "models/entity/villager.geo.json");
        eve.addProperty("texture", "textures/entity/villager/villager.png");
        eve.addProperty("animation", "animations/entity/villager.animation.json");
        eve.addProperty("behavior", "passive");
        eve.addProperty("sociality", "herd");
        eve.addProperty("lifespan", 1500);
        entities.add(eve);
        
        // ファイルに書き込み
        try (FileWriter writer = new FileWriter(testInitialFile.toFile(), StandardCharsets.UTF_8)) {
            writer.write(entities.toString());
        }
    }
    
    /**
     * テスト用のgenerated_entities.jsonファイルを作成
     */
    private void createTestGeneratedEntitiesJson() throws IOException {
        // initial_adam_eve.jsonと同じ内容で作成
        createTestInitialAdamEveJson();
        Files.copy(testInitialFile, testGeneratedFile);
    }
} 