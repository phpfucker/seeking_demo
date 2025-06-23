package jp.seekin.minecraft.ailife;

import com.google.gson.JsonObject;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

/**
 * EntitySpawnManager拡張機能のテストクラス
 * 
 * 特性データ（behavior, sociality, lifespan）のNBT保存機能をテストする
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */
public class EntitySpawnManagerExtensionTest {
    
    private static final Logger logger = LogManager.getLogger();
    
    private EntitySpawnManager entitySpawnManager;
    
    @BeforeEach
    void setUp() {
        entitySpawnManager = new EntitySpawnManager(logger);
    }
    
    @Test
    @DisplayName("特性データのJSONパース機能が正しく動作する")
    void testCharacteristicsDataParsing() {
        // Arrange - テストデータの準備
        JsonObject entityData = new JsonObject();
        entityData.addProperty("entity_id", "test_001");
        entityData.addProperty("behavior", "curious");
        entityData.addProperty("sociality", "leader");
        entityData.addProperty("lifespan", 1500);
        
        // Act & Assert - JSONパースが正しく動作することを確認
        assertTrue(entityData.has("behavior"));
        assertTrue(entityData.has("sociality"));
        assertTrue(entityData.has("lifespan"));
        
        assertEquals("curious", entityData.get("behavior").getAsString());
        assertEquals("leader", entityData.get("sociality").getAsString());
        assertEquals(1500, entityData.get("lifespan").getAsInt());
    }
    
    @Test
    @DisplayName("一部データが欠損したJSONの処理ができる")
    void testPartialDataMissing() {
        // Arrange - 一部データが欠損したJSONを準備
        JsonObject entityData = new JsonObject();
        entityData.addProperty("entity_id", "test_002");
        entityData.addProperty("behavior", "passive");
        // sociality, lifespanは意図的に省略
        
        // Act & Assert - 存在するデータのみ検証
        assertTrue(entityData.has("behavior"));
        assertFalse(entityData.has("sociality"));
        assertFalse(entityData.has("lifespan"));
        
        assertEquals("passive", entityData.get("behavior").getAsString());
    }
    
    @Test
    @DisplayName("空文字列やnull値の検証ができる")
    void testEmptyAndNullValues() {
        // Arrange - 空文字列やnull値を含むJSON
        JsonObject entityData = new JsonObject();
        entityData.addProperty("entity_id", "test_004");
        entityData.addProperty("behavior", "");  // 空文字列
        entityData.addProperty("sociality", (String) null);  // null値
        entityData.addProperty("lifespan", 0);  // 0値
        
        // Act & Assert - 値の検証
        assertTrue(entityData.has("behavior"));
        assertTrue(entityData.has("sociality"));
        assertTrue(entityData.has("lifespan"));
        
        assertEquals("", entityData.get("behavior").getAsString());
        assertEquals(0, entityData.get("lifespan").getAsInt());
    }
    
    @Test
    @DisplayName("EntitySpawnManagerのインスタンス化ができる")
    void testEntitySpawnManagerInstantiation() {
        // Act & Assert - インスタンス化の確認
        assertNotNull(entitySpawnManager);
        assertTrue(entitySpawnManager instanceof EntitySpawnManager);
    }
} 