#ifndef TOWER_H
#define TOWER_H

#include <cmath>
#include <string>

// Base Tower class
class Tower {
protected:
    std::string name;
    int range;
    int upgradeLevel;

public:
    Tower(std::string name, int range)
        : name(name), range(range), upgradeLevel(0) {}

    virtual ~Tower() {}

    virtual void attack() = 0;
    virtual void update() = 0;
    virtual void upgrade() {
        upgradeLevel++;
    }

    std::string getName() const { return name; }
    int getRange() const { return range; }
    int getUpgradeLevel() const { return upgradeLevel; }

    double calculateDistance(double x1, double y1, double x2, double y2) const {
        return std::sqrt(std::pow(x2 - x1, 2) + std::pow(y2 - y1, 2));
    }
};

// Derived classes
class GunTower : public Tower {
public:
    GunTower() : Tower("Gun Tower", 100) {}

    void attack() override {
        // Gun tower attack logic
    }
    void update() override {
        // Update logic for Gun tower
    }
};

class LaserTower : public Tower {
public:
    LaserTower() : Tower("Laser Tower", 150) {}

    void attack() override {
        // Laser tower attack logic
    }
    void update() override {
        // Update logic for Laser tower
    }
};

class IceTower : public Tower {
public:
    IceTower() : Tower("Ice Tower", 80) {}

    void attack() override {
        // Ice tower attack logic
    }
    void update() override {
        // Update logic for Ice tower
    }
};

class TeslaTower : public Tower {
public:
    TeslaTower() : Tower("Tesla Tower", 120) {}

    void attack() override {
        // Tesla tower attack logic
    }
    void update() override {
        // Update logic for Tesla tower
    }
};

class BombTower : public Tower {
public:
    BombTower() : Tower("Bomb Tower", 90) {}

    void attack() override {
        // Bomb tower attack logic
    }
    void update() override {
        // Update logic for Bomb tower
    }
};

#endif // TOWER_H
