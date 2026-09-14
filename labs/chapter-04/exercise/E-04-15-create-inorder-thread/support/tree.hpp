#pragma once
#include <array>
#include <iostream>
#include <vector>

struct ThreadNode {
    int id = 0;
    ThreadNode* left = nullptr;
    ThreadNode* right = nullptr;
    int ltag = 0;
    int rtag = 0;
};

inline int nodeId(const ThreadNode* node) { return node ? node->id : 0; }

void createInorderThread(ThreadNode* root);
