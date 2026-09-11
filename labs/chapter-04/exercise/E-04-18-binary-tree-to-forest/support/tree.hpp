#pragma once
#include <iostream>
#include <vector>

struct GeneralNode {
    int id = 0;
    std::vector<GeneralNode*> children;
};

struct BinaryNode {
    int id = 0;
    BinaryNode* left = nullptr;
    BinaryNode* right = nullptr;
};

std::vector<GeneralNode*> binaryToForest(const BinaryNode* root, std::vector<GeneralNode>& output);
