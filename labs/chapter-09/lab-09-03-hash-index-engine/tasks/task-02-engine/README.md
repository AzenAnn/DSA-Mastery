# Task 02：散列索引引擎（50 分）

实现 `contracts/hash_index.hpp` 中的 `hashindex::make_chaining` 与 `hashindex::make_open_addressing`。链地址法每个槽一条链；开放定址法支持线性与平方探测，删除写墓碑标记、查找遇墓碑继续、遇空槽停止。
