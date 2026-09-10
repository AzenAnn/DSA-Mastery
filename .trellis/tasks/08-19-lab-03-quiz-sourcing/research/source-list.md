# Lab 3.1 / 3.2 选择题候选清单与出处核对（待用户确认）

> 状态：**已确认定稿并写入 quiz.json**（2026-08-19）。每道题均标注主要出处与交叉核对来源；答案以核对后的内容为准（不同版本的选项字母可能不同，写入时按选定版本原样保留）。
>
> 年份策略（用户要求）：涉及出题年份的题尽量新。当前入选的最早年份为 **2017（中科院）**；2015 统考、2013 中山、2012 软考、2009 软考、2009 自考等一律不入选，仅列入备选/弃用区。

---

## 一、Lab 03-01 串基础（新建 15 道）

| # | 考点 | 题面摘要（选项答案） | 主要出处 | 交叉核对 | 核对状态 |
|---|---|---|---|---|---|
| 1 | 串是特殊线性表 | 串是一种特殊的线性表，其特殊性体现在（ ）。A.可以顺序存储 B.数据元素是一个字符 C.可以链式存储 D.数据元素可以是多个字符 → **B** | 严蔚敏《数据结构（C语言版）》第4章习题 4.2(1)（[CSDN 答案](https://blog.csdn.net/weixin_44919169/article/details/128129679)） | 东北大学自测卷答案 Q1（李春葆，[cucdc](http://download.cucdc.com/wenku/1c9ad9fd0dab40e984f14d9fa52bb767.html)）；金锄头串单元测试 Q1（[链接](https://www.jinchutou.com/shtml/824ed7689ed77f52574b9633f8a56837.html)）；超星 MOOC Q4 | ✓ 多源一致 |
| 2 | 串的叙述辨析 | 串下面关于串的的叙述中，（ ）是不正确的？A.串是字符的有限序列 B.空串是由空格构成的串 C.模式匹配是串的一种重要运算 D.串既可以采用顺序存储，也可以采用链式存储 → **B** | 严蔚敏 4.2(2)（[CSDN 答案](https://blog.csdn.net/weixin_44919169/article/details/128129679)） | 金锄头 Q2（选项重排，答案对应“空串由空格构成”）；超星 MOOC Q1（D 为错误项）；电大 2022 形考册 Q24 | ✓ 多源一致 |
| 3 | 串长定义 | 串的长度是指（ ）。A.串中所含不同字符的个数 B.串中所含非空格字符的个数 C.串中所含字符的个数 D.串中所含不同字母的个数 → **C** | 严蔚敏 4.2(5)（[CSDN 答案](https://blog.csdn.net/weixin_44919169/article/details/128129679)）；金锄头 Q5 同题同答案 | 超星 MOOC Q2（A）；电大 2022 形考册 Q22（B） | ✓ 内容一致，字母因版本而异 |
| 4 | 空串与空格串 | 空串与空格字符构成的串的差别在于（ ）。A.没有差别 B.两串的长度不相等 C.两串的长度相等 D.两串包含的字符不同 → **B** | 《数据结构》习题·串（WUST 习题3 OCR 存档，[renrendoc](https://www.renrendoc.com/paper/291194606.html)） | 电大 2022 形考册 Q26（不相同）；超星 MOOC Q1（空串≠空格串） | ✓ 多源一致 |
| 5 | 两串相等条件 | 两个字符串相等的条件是（ ）。A.两串的长度相等 B.两串包含的字符相同 C.两串的长度相等，并且两串包含的字符相同 D.两串的长度相等，并且对应位置上的字符相同 → **D** | WUST 习题3 Q4（[renrendoc](https://www.renrendoc.com/paper/291194606.html)）；2022 数据结构与算法习题库 Q5（[renrendoc](https://www.renrendoc.com/paper/216642409.html)） | 电大 2022 形考册 Q27 | ✓ 多源一致 |
| 6 | 连接/求子串/求长组合 | 设 s1='ABCDEFG'，s2='PQRST'，con 连接、subs 求子串、len 求长，则 con(subs(s1,2,len(s2)), subs(s1,len(s2),2)) 的结果是（ ）。A.BCDEF B.BCDEFG C.BCPQRST D.BCDEFEF → **D** | 李春葆《数据结构》习题（东北大学自测卷答案 Q3，[cucdc](http://download.cucdc.com/wenku/1c9ad9fd0dab40e984f14d9fa52bb767.html)）；2022 习题库 Q3 | 与严蔚敏 4.2(8) 同型题一致（[语雀](https://www.yuque.com/cai4/cai4blog/ewuon3iu8dume237)） | ✓ 多源一致 |
| 7 | 子串个数（真题） | 若串 S="SOFTWARE"，其子串的数目最多是（ ）。A.35 B.36 C.37 D.38 → **C** | **长沙理工大学 2018 年 850 数据结构真题**（[educity](https://www.educity.cn/tiku/60146288.html)） | 金锄头 Q9（software 子串数 37）；2022 习题库 Q1；牛客同名题（[nowcoder](https://www.nowcoder.com/questionTerminal/939250fe276340d798e136c997f8fe0c)） | ✓ 多源一致 |
| 8 | 非空子串个数公式 | 有 n 个字符的字符串的非空子串个数最多有（ ）。A.n(n-1)/2 B.n-1 C.n D.n(n+1)/2 → **D** | 金锄头串单元测试 Q6（[链接](https://www.jinchutou.com/shtml/824ed7689ed77f52574b9633f8a56837.html)） | 长沙理工 2018 解析（含空串 n(n+1)/2+1） | ✓ |
| 9 | 取子串运算结果 | 函数 SubStr(S,m,n) 从第 m 个字符开始连续取 n 个字符，若 S="tsinghua"，则 SubStr(S,3,4) 抽取的子串是（ ）。A."ghua" B."tsin" C."nghu" D."ingh" → **C** | 金锄头串单元测试 Q10（[链接](https://www.jinchutou.com/shtml/824ed7689ed77f52574b9633f8a56837.html)） | 手工按 1-based 核验（tsinghua 第3~6位 = nghu） | ✓ |
| 10 | 串的叙述辨析（正确的是） | 下面的说法中，只有（ ）是正确的。A.串是一种特殊的线性表 B.串的长度必须不小于零 C.串中元素只能是字母 D.空串就是空白串 → **A** | 2022 电大《数据结构（本）》形成性考核册 作业2 Q19（[renrendoc](https://www.renrendoc.com/paper/200413140.html)） | 2022 习题库 Q4；2001/2019 自考 02331 Q6；中山大学 2013 每日一题（[juejin](https://juejin.cn/post/7035675927191224334)） | ✓ 多源一致 |
| 11 | 串长/空串/线性结构（软考真题） | 以下关于字符串的叙述中，正确的是（57）。A.包含任意个空格字符的字符串称为空串 B.字符串不是线性数据结构 C.字符串的长度是指串中所含字符的个数 D.字符串的长度是指串中所含非空格字符的个数 → **C** | **2017 年上半年软件设计师上午题 第57题**（[rkpass](https://www.rkpass.cn/tk_timu/6_485_57_xuanze.html)；[51cto](https://rk.51cto.com/article/394295.html)；[CSDN 真题专项](https://blog.csdn.net/weixin_50843918/article/details/135136624)） | 考网（[kaowang](http://www.kaowang.cn/shiti/1537341.html)）；educity 软考每日题（[educity](https://www.educity.cn/tiku/91970.html)） | ✓ 多源一致 |
| 12 | 存储方式选择 | 若串中字符经常发生变化，则采用（ ）存储方式最合适。A.定长顺序 B.堆 C.链式 D.散列 → **C** | 超星 MOOC《数据结构》串练习 Q3（[mooc1](https://mooc1.chaoxing.com/mooc-ans/ztnodedetailcontroller/visitnodedetail?courseId=203330653&knowledgeId=142466857)） | MOOC 第五周同类题（[CSDN](https://blog.csdn.net/weixin_46226815/article/details/107726559)） | ✓ |
| 13 | 两种基本存储（考研真题） | 串的两种基本的存储方式是（ ）。A.顺序存储和链式存储 B.顺序存储和堆存储 C.堆存储和链式存储 D.堆存储和数组存储 → **A** | **中国科学院大学 2016**（王道微博每日一题 day81，[CSDN](https://blog.csdn.net/Mancuojie/article/details/120792334)） | 电大 2022 形考册填空（顺序存储和链式存储）；严蔚敏/王道教材表述 | ✓ 多源一致 |
| 14 | 链串结点大小 | 字符串采用结点大小为 1 的链表作为其存储结构，是指（ ）。A.链表的长度为1 B.链表中只存放1个字符 C.链表的每个链结点的数据域中不仅只存放了一个字符 D.链表的每个链结点的数据域中只存放了一个字符 → **D** | WUST 习题3 Q9（[renrendoc](https://www.renrendoc.com/paper/291194606.html)） | 严蔚敏/王道“结点大小为1”定义（每个结点数据域只存 1 个字符） | ✓ |
| 15 | 存储密度 | 链串结点 NodeSize=6，字符占 1 字节、指针占 2 字节，该链串的存储密度为（ ）。A.1/3 B.1/2 C.2/3 D.3/4 → **D** | 02331《数据结构》预测卷（九）（[educity](https://www.educity.cn/tiku/10623029.html)） | MOOC 第五周存储密度 3/4 题（[CSDN](https://blog.csdn.net/weixin_46226815/article/details/107726559)） | ✓ 多源一致 |

### 3.1 备选（未入选，可换入）

- 2009 下半年软考 Q62：块链（结点大小相同）上串替换最不方便 → **D**（[educity](https://www.educity.cn/tiku/5105.html)）。年份偏旧，故不入选。
- 中科院 2016 之外可换：WUST 习题3 Q2 子串在主串中的位置（答案 D 与通行定义一致，可作为备份）。
- 电大 2022 形考册 Q23（"English" 非空子串个数 28）：答案需再核，暂不入选。

---

## 二、Lab 03-02 模式匹配（现有 10 道 + 新增 5 道 = 15 道）

### 保留的现有 10 道（含 1 道替换）

| # | id | 题面摘要（答案） | 出处 | 处理 |
|---|---|---|---|---|
| 1 | ds-drill-string-001 | 求 S2 在 S1 中首次出现位置的运算称为（模式匹配）→ **C** | 王道《数据结构》习题集 4.2 | 保留 |
| 2 | ds-drill-string-002 | KMP 指示主串的指针（不会变小）→ **B** | 王道 4.2 | 保留 |
| 3 | ds-drill-string-003 | 朴素匹配/KMP 复杂度 O(mn)/O(m+n) → **C** | 王道 4.2 | 保留 |
| 4 | ds-drill-string-004 | 失配时 j 的位移方式（j=next[j]）→ **D** | 王道 4.2 | 保留 |
| 5 | ds-drill-string-005 | 失配时 i 的位移方式（i 不变）→ **B** | 王道 4.2 | 保留 |
| 6 | ds-drill-string-006 | S='aabaaaba'、T='aaab'，KMP 比较次数 9 → **B** | 王道 4.2 | 保留 |
| 7 | ds-drill-string-007 | 同题 nextval 比较次数 7 → **C** | 王道 4.2 | 保留 |
| 8 | ds-2019-01 | 2019 统考：KMP 匹配成功比较次数 10 → **B** | 2019 年 408 统考真题 | 保留 |
| 9 | ds-2024-01 | 2024 统考：模式串 aabaab 的 nextval 最大滑动距离 5 → **A** | 2024 年 408 统考真题 | 保留 |
| 10 | ~~ds-2015-01~~ | ~~2015 统考：失配时 i=j=5，下次 i=5,j=2~~ | 2015 年 408 统考真题 | **弃用（年份偏旧，按用户要求替换）** |
| 10' | ds-ucas-2018 | 现有字符串 s='aabaabaabaac'，模式串 t='aabaac'，KMP 第（ ）次匹配成功 → **A.3** | **中国科学院大学 2018**（王道微博每日一题 day102，[juejin](https://juejin.cn/post/7021510919146602509)；[CSDN](https://blog.csdn.net/yanlei233/article/details/120861179)） | 替换 2015 统考 |

### 新增 5 道

| # | id（拟定） | 题面摘要（答案） | 主要出处 | 交叉核对 | 核对状态 |
|---|---|---|---|---|---|
| 11 | ds-xiyou-2019 | 已知模式串 s='abcabaa'，则该模式串的 next 函数值序列是（ ）。A.0112123 B.1011232 C.0111212 D.0111232 → **D** | **西安邮电大学 2019 年 826 数据结构 A 考研真题**（[educity](https://www.educity.cn/tiku/60345438.html)） | 中科院 2017 同考点题（王道每日一题 day91，[微信公众号](https://mp.weixin.qq.com/s/a3pJ7Vsro-ZHUopj_BKlhA)） | ✓ 多源一致（定稿时用更新年份的西邮 2019 替代中科院 2017） |
| 12 | ds-yan-next-01 | 串"ababaaababaa"的 next 数组为（ ）。A.011122223456 B.011121223456 C.011234223456 D.011234324546 → **C** | 严蔚敏《数据结构》第4章习题 4.2(3)（[CSDN 练习](https://blog.csdn.net/m0_37243410/article/details/79008467)） | 金锄头 Q3（同答案序列，选项排版不同）；语雀 4.2 答案 C | ✓ 多源一致 |
| 13 | ds-yan-nextval-01 | 串"ababaabab"的 nextval 为（ ）。A.010104101 B.010101011 C.010100011 D.010102101 → **A** | 严蔚敏 4.2(4)（[CSDN 练习](https://blog.csdn.net/m0_37243410/article/details/79008467)） | 金锄头 Q4（010104101）；《数据结构与算法》考研真题精选 | ✓ 多源一致 |
| 14 | ds-bf-trips | 设 S="aaaaaacaaaca"，P="aaac"，使用 BF 算法需要执行的趟数为（ ）。A.7 B.2 C.3 D.4 → **D** | 金锄头串单元测试 Q11（[链接](https://www.jinchutou.com/shtml/824ed7689ed77f52574b9633f8a56837.html)） | 手工模拟核验（第 4 趟在第 7 位匹配成功） | ✓ |
| 15 | ds-mooc-nextval | KMP 中若模式串 T 存在 tj=tk（k=next[j]），且 si≠tj，则下一次不必与 tk 比较，而直接和（ ）比较。A.tk B.tnext[k] C.tnext[j] D.tj → **B** | 超星 MOOC《数据结构》串练习 Q7（[mooc1](https://mooc1.chaoxing.com/mooc-ans/ztnodedetailcontroller/visitnodedetail?courseId=203330653&knowledgeId=142466857)） | 与严蔚敏/王道 nextval 递推规则一致（nextval[j]=nextval[next[j]]） | ✓ 按标准规则核验 |

### 3.2 备选/弃用

- 2012 软考真题：BF 匹配末尾成功最多比较 (n-m+1)*m → **B**（2021 下半年软考综合知识模拟题亦收录，[cnitpm](https://www.cnitpm.com/pm1/110914.html)）。年份偏旧且与王道 Q3 考点重复，不入选。
- 2009 软考 Q62 块链串替换（见 3.1 备选）：考点归 3.1，年份偏旧。
- 2005 年 1 月浙江自考 Q6 朴素匹配最坏失配位置：年份过旧，弃用。
- 自考 02331“目标串长 n、模式串长 n/3 最坏复杂度 O(n²)”：历年题库复用（2001/2019/2021 均见），无法确证单一年份，弃用。

---

## 三、需要你拍板的 3 个点

1. **字符编码（ASCII/UTF-8/GBK）**：数据结构公开题源里几乎找不到编码主题的 4 选 1 题（能找到的都是 Java/C 语言题，出处质量低）。建议：3.1 选择题只覆盖“定义与术语 / ADT 操作 / 三种存储”，README 的“目标/前置知识”把编码改为正文知识点与思考题，不强行出选择题。若你接受，我会同步改 README 措辞。
2. **最小操作子集“五种”**：课程正文（content/chapter-03-string-array/01-string-basics.md）明确写的是五种（StrAssign/StrCompare/StrLength/Concat/SubString），README 与正文一致，无需改措辞；但没有找到该知识点的干净 4 选 1 题源，只能作为完成清单里的口头知识点（由第 6 题的连接/求子串/求长组合间接覆盖）。若你希望有直接对应题，需要接受低质量转载来源。
3. **年份下限**：已按用户“自由发挥”定稿——3.1 最旧为中科院 2016（两种基本存储），3.2 全部真题年份 ≥ 2018（中科院 2018、西邮 2019、2019/2024 统考）。next 数组考点最终采用西邮 2019 而非中科院 2017，年份更新。
