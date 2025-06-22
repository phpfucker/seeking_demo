package jp.seekin.minecraft.ailife;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

/**
 * StatusDataReader（5.1.2で実装予定）のテストクラス
 * TDD approach: テストを先に書いて、実装を後から行う
 */
public class StatusDataReaderTest {

    private static final String TEST_CONFIG_DIR = "test_config";
    private static final String TEST_STATUS_FILE = TEST_CONFIG_DIR + "/current_entity_status.json";
    private StatusDataReader statusDataReader;

    @BeforeEach
    void setUp() throws IOException {
        // テスト用ディレクトリを作成
        Path configDir = Paths.get(TEST_CONFIG_DIR);
        Files.createDirectories(configDir);
        
        // StatusDataReaderのインスタンスを作成（まだ実装されていない）
        statusDataReader = new StatusDataReader(TEST_CONFIG_DIR);
    }

    @AfterEach
    void tearDown() throws IOException {
        // テスト用ファイルとディレクトリを削除
        Path statusFile = Paths.get(TEST_STATUS_FILE);
        if (Files.exists(statusFile)) {
            Files.delete(statusFile);
        }
        Path configDir = Paths.get(TEST_CONFIG_DIR);
        if (Files.exists(configDir)) {
            Files.delete(configDir);
        }
    }

    @Test
    @DisplayName("正常なステータスJSONファイルを読み込める")
    void testReadValidStatusFile() throws IOException {
        // テストデータ作成
        String testJson = """
        {
          "entities": [
            {
              "id": "adam_001",
              "gender": "male",
              "dna": ["A", "T", "G", "C"],
              "position": {
                "x": 100.5,
                "y": 64.0,
                "z": 200.7
              },
              "health": 20.0,
              "age": 1200
            },
            {
              "id": "eve_001", 
              "gender": "female",
              "dna": ["T", "G", "C", "A"],
              "position": {
                "x": 105.2,
                "y": 64.0,
                "z": 195.3
              },
              "health": 18.5,
              "age": 800
            }
          ],
          "timestamp": "2024-12-21T10:30:00Z",
          "world": "world"
        }
        """;

        // テストファイル作成
        try (FileWriter writer = new FileWriter(TEST_STATUS_FILE)) {
            writer.write(testJson);
        }

        // テスト実行
        List<EntityStatusData> entities = statusDataReader.readStatusData();

        // アサーション
        assertNotNull(entities);
        assertEquals(2, entities.size());
        
        EntityStatusData adam = entities.get(0);
        assertEquals("adam_001", adam.getId());
        assertEquals("male", adam.getGender());
        assertEquals(4, adam.getDna().size());
        assertEquals(100.5, adam.getPosition().getX(), 0.01);
        assertEquals(64.0, adam.getPosition().getY(), 0.01);
        assertEquals(200.7, adam.getPosition().getZ(), 0.01);
        assertEquals(20.0, adam.getHealth(), 0.01);
        assertEquals(1200, adam.getAge());
    }

    @Test
    @DisplayName("ファイルが存在しない場合は空のリストを返す")
    void testReadNonExistentFile() {
        List<EntityStatusData> entities = statusDataReader.readStatusData();
        assertNotNull(entities);
        assertTrue(entities.isEmpty());
    }

    @Test
    @DisplayName("不正なJSONファイルの場合は例外をスローする")
    void testReadInvalidJsonFile() throws IOException {
        // 不正なJSONファイル作成
        try (FileWriter writer = new FileWriter(TEST_STATUS_FILE)) {
            writer.write("{ invalid json content ");
        }

        // 例外がスローされることを確認
        assertThrows(RuntimeException.class, () -> {
            statusDataReader.readStatusData();
        });
    }

    @Test
    @DisplayName("必須フィールドが欠けている場合はスキップする")
    void testReadIncompleteEntityData() throws IOException {
        String testJson = """
        {
          "entities": [
            {
              "id": "adam_001",
              "gender": "male",
              "dna": ["A", "T", "G", "C"],
              "position": {
                "x": 100.5,
                "y": 64.0,
                "z": 200.7
              }
            },
            {
              "gender": "female",
              "dna": ["T", "G", "C", "A"]
            }
          ]
        }
        """;

        try (FileWriter writer = new FileWriter(TEST_STATUS_FILE)) {
            writer.write(testJson);
        }

        List<EntityStatusData> entities = statusDataReader.readStatusData();
        
        // idが存在するエンティティのみが読み込まれる
        assertEquals(1, entities.size());
        assertEquals("adam_001", entities.get(0).getId());
    }

    @Test
    @DisplayName("整形されたデータ構造が正しく作成される")
    void testFormattedDataStructure() throws IOException {
        String testJson = """
        {
          "entities": [
            {
              "id": "adam_001",
              "gender": "male", 
              "dna": ["A", "T", "G", "C"],
              "position": {
                "x": 100.5,
                "y": 64.0,
                "z": 200.7
              },
              "health": 20.0,
              "age": 1200
            }
          ]
        }
        """;

        try (FileWriter writer = new FileWriter(TEST_STATUS_FILE)) {
            writer.write(testJson);
        }

        // 整形されたデータマップを取得
        Map<String, Object> formattedData = statusDataReader.getFormattedDataMap();
        
        assertNotNull(formattedData);
        assertTrue(formattedData.containsKey("entities"));
        assertTrue(formattedData.containsKey("entityCount"));
        assertTrue(formattedData.containsKey("maleCount"));
        assertTrue(formattedData.containsKey("femaleCount"));
        
        assertEquals(1, formattedData.get("entityCount"));
        assertEquals(1, formattedData.get("maleCount"));
        assertEquals(0, formattedData.get("femaleCount"));
    }
} 