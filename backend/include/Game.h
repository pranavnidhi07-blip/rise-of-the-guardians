#ifndef GAME_H
#define GAME_H

#include <vector>
#include <memory>
#include <unordered_map>

// Constants for tower costs and enemies per wave
const int TOWER_COST = 100;
const int ENEMIES_PER_WAVE = 5;

class GameState {
public:
    // Add game state data and methods here
};

class GameMap {
public:
    // Add map properties and methods for managing map
};

class Tower {
    // Tower class definition
};

class Enemy {
    // Enemy class definition
};

class Game {
private:
    GameState gameState;
    GameMap gameMap;
    std::vector<std::shared_ptr<Tower>> towers;
    std::vector<std::shared_ptr<Enemy>> enemies;
    // Add wave management data

public:
    void placeTower(int x, int y);
    void startWave();
    void endWave();
    void spawnEnemy();
    void updateGameLoop();
    static std::shared_ptr<Tower> createTower();
    static std::shared_ptr<Enemy> createEnemy();

    const std::vector<std::shared_ptr<Tower>>& getTowers() const;
    const std::vector<std::shared_ptr<Enemy>>& getEnemies() const;
    const GameMap& getMap() const;
    const GameState& getGameState() const;
};

#endif // GAME_H
