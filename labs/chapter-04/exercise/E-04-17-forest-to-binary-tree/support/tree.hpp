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

BinaryNode* forestToBinary(const std::vector<GeneralNode*>& roots, std::vector<BinaryNode>& output);
