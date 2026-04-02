#pragma once

#include <iostream>
#include <string>

// Base Class: Enemy
class Enemy {
protected:
    std::string name;
    int health;
    int damage;
    float speed;

public:
    Enemy(std::string name, int health, int damage, float speed)
        : name(name), health(health), damage(damage), speed(speed) {}

    virtual void attack() = 0;
    virtual void takeDamage(int amount) {
        health -= amount;
        if (health <= 0) {
            std::cout << name << " has been defeated!\n";
        }
    }
    virtual void move() = 0;
};

// Derived Class: BasicEnemy
class BasicEnemy : public Enemy {
public:
    BasicEnemy() : Enemy("Basic Enemy", 100, 10, 1.0f) {}
    void attack() override {
        std::cout << "Basic Enemy attacks for " << damage << " damage!\n";
    }
    void move() override {
        std::cout << "Basic Enemy moves at speed " << speed << "!\n";
    }
};

// Derived Class: HeavyEnemy
class HeavyEnemy : public Enemy {
public:
    HeavyEnemy() : Enemy("Heavy Enemy", 250, 20, 0.5f) {}
    void attack() override {
        std::cout << "Heavy Enemy attacks for " << damage << " damage!\n";
    }
    void move() override {
        std::cout << "Heavy Enemy moves at speed " << speed << "!\n";
    }
};

// Derived Class: FastEnemy
class FastEnemy : public Enemy {
public:
    FastEnemy() : Enemy("Fast Enemy", 80, 15, 2.0f) {}
    void attack() override {
        std::cout << "Fast Enemy attacks for " << damage << " damage!\n";
    }
    void move() override {
        std::cout << "Fast Enemy moves at speed " << speed << "!\n";
    }
};

// Derived Class: FlyingEnemy
class FlyingEnemy : public Enemy {
public:
    FlyingEnemy() : Enemy("Flying Enemy", 120, 12, 1.5f) {}
    void attack() override {
        std::cout << "Flying Enemy attacks for " << damage << " damage!\n";
    }
    void move() override {
        std::cout << "Flying Enemy flies at speed " << speed << "!\n";
    }
};

// Derived Class: BossEnemy
class BossEnemy : public Enemy {
public:
    BossEnemy() : Enemy("Boss Enemy", 500, 50, 0.75f) {}
    void attack() override {
        std::cout << "Boss Enemy attacks for " << damage << " damage!\n";
    }
    void move() override {
        std::cout << "Boss Enemy moves at speed " << speed << "!\n";
    }
};

