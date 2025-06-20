import com.google.gson.*;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.event.server.ServerStartingEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;

import java.io.File;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;

/**
 * generated_entities.jsonを読み込み、内容をサーバーログに出力する最小限のMOD
 *
 * - config/generated_entities.json を参照
 * - サーバー起動時に内容を出力
 *
 * MOD ID: ailife
 *
 * 使い方:
 * 1. config/generated_entities.json に個体データ（アダム・イヴ等）を配置
 * 2. サーバーを起動すると、内容がログに出力される
 *
 * このクラスはデータ取得の動作確認用の最小雛形です。
 */
@Mod("ailife")
public class AiLifeMod {
    /**
     * MOD初期化時の処理（現状は何もしない）
     */
    public AiLifeMod() {
        // MOD初期化時の処理
    }

    /**
     * サーバー起動時にgenerated_entities.jsonを読み込み、内容をログ出力する
     *
     * @param event サーバー起動イベント
     */
    @SubscribeEvent
    public void onServerStarting(ServerStartingEvent event) {
        try {
            // configディレクトリのgenerated_entities.jsonを参照
            File jsonFile = new File("config/generated_entities.json");
            if (!jsonFile.exists()) {
                System.out.println("[AiLife] generated_entities.json が見つかりません");
                return;
            }
            // JSONファイルをパース
            JsonArray entities = JsonParser.parseReader(new FileReader(jsonFile, StandardCharsets.UTF_8)).getAsJsonArray();
            System.out.println("[AiLife] === generated_entities.json の内容 ===");
            // 各個体データを出力
            for (JsonElement elem : entities) {
                JsonObject entity = elem.getAsJsonObject();
                String id = entity.get("entity_id").getAsString();
                String name = entity.get("name").getAsString();
                String gender = entity.get("gender").getAsString();
                String model = entity.get("model").getAsString();
                System.out.printf("[AiLife] ID: %s, 名前: %s, 性別: %s, モデル: %s%n", id, name, gender, model);
            }
        } catch (Exception e) {
            // エラー発生時はスタックトレースを出力
            e.printStackTrace();
        }
    }
} 