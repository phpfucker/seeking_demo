package jp.seekin.minecraft.ailife;

import com.google.gson.JsonObject;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;

/**
 * エンティティ関連のユーティリティメソッドを提供するクラス
 * 
 * <p>このクラスは以下のユーティリティ機能を提供します：</p>
 * <ul>
 *   <li>JSONフィールドの安全な取得</li>
 *   <li>モデル名に基づくエンティティタイプの決定</li>
 *   <li>エンティティ関連の共通処理</li>
 * </ul>
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */
public class EntityUtils {
    
    /**
     * JSONオブジェクトから必須の文字列フィールドを安全に取得する
     * 
     * @param jsonObject 対象のJSONオブジェクト
     * @param fieldName 取得するフィールド名
     * @param fieldDescription フィールドの説明（エラーメッセージ用）
     * @return フィールドの文字列値
     * @throws IllegalArgumentException フィールドが存在しないか空文字列の場合
     */
    public static String getRequiredJsonString(JsonObject jsonObject, String fieldName, String fieldDescription) {
        if (!jsonObject.has(fieldName)) {
            throw new IllegalArgumentException(fieldDescription + "フィールド '" + fieldName + "' が見つかりません");
        }
        String value = jsonObject.get(fieldName).getAsString();
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldDescription + "フィールド '" + fieldName + "' が空です");
        }
        return value.trim();
    }

    /**
     * モデル名に基づいて適切なエンティティタイプを決定する
     * 
     * @param model モデル名（例: "villager", "witch"）
     * @return 対応するEntityType、未対応の場合はnull
     */
    public static EntityType<? extends LivingEntity> determineEntityType(String model) {
        if (model == null || model.trim().isEmpty()) {
            return null;
        }
        
        String lowerModel = model.toLowerCase();
        if (lowerModel.contains("villager")) {
            return EntityType.VILLAGER;
        } else if (lowerModel.contains("witch")) {
            return EntityType.WITCH;
        }
        return null;
    }
    
    // このクラスはユーティリティクラスなので、インスタンス化を防ぐ
    private EntityUtils() {
        throw new AssertionError("このクラスはインスタンス化できません");
    }
} 