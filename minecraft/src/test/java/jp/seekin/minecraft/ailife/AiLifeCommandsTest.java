package jp.seekin.minecraft.ailife;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 5.3.4 管理者指示コマンドのテストクラス
 */
public class AiLifeCommandsTest {
    /**
     * 5.3.4 管理者指示コマンドのテスト
     * 
     * テスト項目：
     * 1. 管理者指示の設定（set_guidance）
     * 2. 管理者指示のクリア（clear_guidance）
     * 3. 管理者指示の表示（show_guidance）
     * 4. 文字数制限チェック（最大500文字）
     * 5. ファイル永続化
     * 
     * @throws IOException ファイル操作に失敗した場合
     */
    @Test
    public void testGuidanceCommands() throws IOException {
        // テスト用の指示内容
        String guidance = "親の行動パターンを重視して子の特性を決めて";
        String longGuidance = "a".repeat(501); // 501文字の文字列
        
        // テスト用のファイルパス
        Path guidanceFile = Paths.get("config", "current_guidance.txt");
        
        try {
            // 1. set_guidanceコマンドのテスト
            // 正常系：500文字以内の指示を設定
            assertTrue(AiLifeCommands.setGuidance(guidance));
            assertTrue(Files.exists(guidanceFile));
            assertEquals(guidance, Files.readString(guidanceFile));
            
            // 異常系：500文字を超える指示を設定
            assertFalse(AiLifeCommands.setGuidance(longGuidance));
            assertEquals(guidance, Files.readString(guidanceFile)); // 前の値が保持されている
            
            // 2. show_guidanceコマンドのテスト
            assertEquals(guidance, AiLifeCommands.showGuidance());
            
            // 3. clear_guidanceコマンドのテスト
            assertTrue(AiLifeCommands.clearGuidance());
            assertTrue(Files.exists(guidanceFile));
            assertEquals("", Files.readString(guidanceFile));
            
            // クリア後のshow_guidanceテスト
            assertEquals("", AiLifeCommands.showGuidance());
            
        } finally {
            // テストファイルのクリーンアップ
            Files.deleteIfExists(guidanceFile);
        }
    }
} 