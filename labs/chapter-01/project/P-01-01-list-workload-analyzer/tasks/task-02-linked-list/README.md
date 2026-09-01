# Lab 01-P-01：线性表双实现与工作负载评测器

在 `student/linked_list.cpp` 中完成 `contracts/linked_list.hpp`。不要修改公共头文件。

关键验收：List 行为与越界契约正确；空表哨兵、尺寸和双向互逆关系始终成立；按下标从较近一端定位；节点分配、释放、跳转和链接写入计数准确；clear 后可复用且不存在浅拷贝所有权。

```powershell
make run TASK=linked-list
```
