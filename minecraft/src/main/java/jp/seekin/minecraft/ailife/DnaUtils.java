package jp.seekin.minecraft.ailife;

/**
 * DNA関連のユーティリティメソッドを提供するクラス
 * 
 * <p>このクラスは以下のDNA関連機能を提供します：</p>
 * <ul>
 *   <li>エンティティIDからの性別推測</li>
 *   <li>エンティティIDからのDNA推測</li>
 *   <li>文字列からのDNA配列生成</li>
 * </ul>
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */
public class DnaUtils {
    
    /**
     * エンティティIDから性別を推測するメソッド
     * 
     * @param entityId エンティティID
     * @return 推測される性別
     */
    public static String inferGenderFromEntityId(String entityId) {
        if (entityId == null || entityId.trim().isEmpty()) {
            return "unknown";
        }
        
        String lowerCaseId = entityId.toLowerCase();
        if (lowerCaseId.equals("adam")) {
            return "male";
        } else if (lowerCaseId.equals("eve")) {
            return "female";
        } else if (lowerCaseId.contains("female")) {
            // femaleを先に判定（femaleの中にmaleが含まれているため）
            return "female";
        } else if (lowerCaseId.contains("male")) {
            return "male";
        } else {
            // デフォルトでランダムに決定（実際の実装では改善が必要）
            return (entityId.hashCode() % 2 == 0) ? "male" : "female";
        }
    }

    /**
     * エンティティIDからDNAを推測するメソッド
     * 
     * @param entityId エンティティID
     * @return 推測されるDNA
     */
    public static String inferDnaFromEntityId(String entityId) {
        if (entityId == null) return "UNKNOWN";
        
        // 初期個体の既知のDNA
        if (entityId.equals("adam")) {
            return "ACGTACGTACGTACGT";
        } else if (entityId.equals("eve")) {
            return "TGCATGCATGCATGCA";
        } else {
            // その他の個体の場合は、IDに基づいてDNAを生成
            return generateDnaFromString(entityId);
        }
    }

    /**
     * 文字列からDNA配列を生成するメソッド
     * 
     * @param input 入力文字列
     * @return 生成されたDNA配列
     */
    public static String generateDnaFromString(String input) {
        if (input == null || input.isEmpty()) {
            return "AAAAAAAAAAAAAAAA";
        }
        
        StringBuilder dna = new StringBuilder();
        char[] bases = {'A', 'C', 'G', 'T'};
        
        for (int i = 0; i < 16; i++) {
            int index = (input.hashCode() + i) % bases.length;
            if (index < 0) index = -index;
            dna.append(bases[index]);
        }
        
        return dna.toString();
    }
    
    // このクラスはユーティリティクラスなので、インスタンス化を防ぐ
    private DnaUtils() {
        throw new AssertionError("このクラスはインスタンス化できません");
    }
} 