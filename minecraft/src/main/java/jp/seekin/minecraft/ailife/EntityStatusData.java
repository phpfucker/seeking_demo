package jp.seekin.minecraft.ailife;

import java.util.List;

/**
 * AI生命体のステータスデータを表現するクラス
 * 5.1.2で使用される、リアルタイム状態データの内部データ構造
 */
public class EntityStatusData {
    private String id;
    private String gender;
    private List<String> dna;
    private Position position;
    private double health;
    private int age;

    public EntityStatusData() {}

    public EntityStatusData(String id, String gender, List<String> dna, Position position, double health, int age) {
        this.id = id;
        this.gender = gender;
        this.dna = dna;
        this.position = position;
        this.health = health;
        this.age = age;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public List<String> getDna() {
        return dna;
    }

    public void setDna(List<String> dna) {
        this.dna = dna;
    }

    public Position getPosition() {
        return position;
    }

    public void setPosition(Position position) {
        this.position = position;
    }

    public double getHealth() {
        return health;
    }

    public void setHealth(double health) {
        this.health = health;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    /**
     * 位置情報を表現する内部クラス
     */
    public static class Position {
        private double x;
        private double y;
        private double z;

        public Position() {}

        public Position(double x, double y, double z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        public double getX() {
            return x;
        }

        public void setX(double x) {
            this.x = x;
        }

        public double getY() {
            return y;
        }

        public void setY(double y) {
            this.y = y;
        }

        public double getZ() {
            return z;
        }

        public void setZ(double z) {
            this.z = z;
        }

        @Override
        public String toString() {
            return String.format("Position{x=%.2f, y=%.2f, z=%.2f}", x, y, z);
        }
    }

    @Override
    public String toString() {
        return String.format("EntityStatusData{id='%s', gender='%s', dna=%s, position=%s, health=%.1f, age=%d}",
                id, gender, dna, position, health, age);
    }
} 