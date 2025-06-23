package jp.seekin.minecraft.ailife;

import net.minecraft.core.BlockPos;
import java.util.Map;
import java.util.HashMap;
import java.util.Collections;
import java.time.Instant;
import java.util.Objects;

/**
 * AI生命体の特定時点での状態を表すイミュータブルなクラス。
 * このクラスは以下の情報を保持します：
 * - 位置情報
 * - 体力と満腹度
 * - 収集したリソース
 * - 他のエンティティとの相互作用
 * - 現在の活動
 */
public class EntityState {
    private final BlockPos position;
    private final double health;
    private final double hunger;
    private final Map<String, Double> resources;
    private final Map<String, Integer> interactions;
    private final String currentActivity;
    private final Instant timestamp;

    /**
     * EntityStateのビルダークラス。
     */
    public static class Builder {
        private BlockPos position;
        private double health = 20.0;  // デフォルト値
        private double hunger = 20.0;  // デフォルト値
        private final Map<String, Double> resources = new HashMap<>();
        private final Map<String, Integer> interactions = new HashMap<>();
        private String currentActivity;

        public Builder(BlockPos position) {
            this.position = position;
        }

        public Builder health(double health) {
            if (health < 0 || health > 20.0) {
                throw new IllegalArgumentException("Health must be between 0 and 20");
            }
            this.health = health;
            return this;
        }

        public Builder hunger(double hunger) {
            if (hunger < 0 || hunger > 20.0) {
                throw new IllegalArgumentException("Hunger must be between 0 and 20");
            }
            this.hunger = hunger;
            return this;
        }

        public Builder addResource(String type, double amount) {
            Objects.requireNonNull(type, "Resource type cannot be null");
            if (amount < 0) {
                throw new IllegalArgumentException("Resource amount cannot be negative");
            }
            resources.put(type, amount);
            return this;
        }

        public Builder addInteraction(String entityId, int count) {
            Objects.requireNonNull(entityId, "Entity ID cannot be null");
            if (count < 0) {
                throw new IllegalArgumentException("Interaction count cannot be negative");
            }
            interactions.put(entityId, count);
            return this;
        }

        public Builder currentActivity(String activity) {
            this.currentActivity = Objects.requireNonNull(activity, "Activity cannot be null");
            return this;
        }

        public EntityState build() {
            return new EntityState(this);
        }
    }

    private EntityState(Builder builder) {
        this.position = Objects.requireNonNull(builder.position, "Position cannot be null");
        this.health = builder.health;
        this.hunger = builder.hunger;
        this.resources = Collections.unmodifiableMap(new HashMap<>(builder.resources));
        this.interactions = Collections.unmodifiableMap(new HashMap<>(builder.interactions));
        this.currentActivity = Objects.requireNonNull(builder.currentActivity, "Activity cannot be null");
        this.timestamp = Instant.now();
    }

    /**
     * 新しいEntityStateビルダーを作成します。
     * @param position エンティティの位置
     * @return 新しいビルダーインスタンス
     */
    public static Builder builder(BlockPos position) {
        return new Builder(position);
    }

    // Getters
    public BlockPos getPosition() { return position; }
    public double getHealth() { return health; }
    public double getHunger() { return hunger; }
    public Map<String, Double> getResources() { return resources; }
    public Map<String, Integer> getInteractions() { return interactions; }
    public String getCurrentActivity() { return currentActivity; }
    public Instant getTimestamp() { return timestamp; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        EntityState that = (EntityState) o;
        return Double.compare(that.health, health) == 0 &&
               Double.compare(that.hunger, hunger) == 0 &&
               Objects.equals(position, that.position) &&
               Objects.equals(resources, that.resources) &&
               Objects.equals(interactions, that.interactions) &&
               Objects.equals(currentActivity, that.currentActivity) &&
               Objects.equals(timestamp, that.timestamp);
    }

    @Override
    public int hashCode() {
        return Objects.hash(position, health, hunger, resources, 
                          interactions, currentActivity, timestamp);
    }

    @Override
    public String toString() {
        return String.format(
            "EntityState{pos=%s, health=%.1f, hunger=%.1f, activity='%s', time=%s}",
            position, health, hunger, currentActivity, timestamp
        );
    }
} 