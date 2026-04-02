cmake_minimum_required(VERSION 3.10)

# Set the project name and version
project(TowerDefenseGame VERSION 1.0)

# Specify the C++ standard
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Find Pistache library
find_package(Pistache REQUIRED)

# Add the executable
add_executable(TowerDefenseGame main.cpp)

# Link Pistache library
target_link_libraries(TowerDefenseGame Pistache::Pistache)