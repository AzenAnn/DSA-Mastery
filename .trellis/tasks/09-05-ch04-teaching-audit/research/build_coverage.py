from pathlib import Path
from collections import Counter,defaultdict
import json,re,csv,hashlib

ROOT=Path(__file__).resolve().parents[4]
TASK=Path(__file__).resolve().parent.parent
inv=json.loads((TASK/'research/blind-inventory.json').read_text(encoding='utf-8'))
arts=[r['source'] for r in inv['articles']]
def link(path,line=1,label=None):
    return f'[{label or Path(path).name}](<{(ROOT/path).as_posix()}:{line}>)'
def a(i,line,label=None):return link(arts[i],line,label or f'A{i}:{line}')
grades={'S':'足够支撑','M':'需要合理迁移','G':'存在明显教学缺口'}
# 学科能力、文章证据、判断、最小补充。题面正确性另列，避免混为教学缺口。
caps={
'degree':('以孩子度数和=边数建立方程，检验非负整数解',a(1,98),'S','有 n−1 与度和的证明','保留；要求列方程后代入核验'),
'props':('联立 n=n0+n1+n2 与边数式，解释叶数/层容量',a(2,151)+'；'+a(2,197),'S','数量性质有推导而非孤立公式','保留双计数证明，作答写出消元步骤'),
'complete':('由完整层与最后一层编号确定叶/内部数',a(2,242),'S','1 基编号、父子范围已有算例','保留；用奇偶两种节点总数核验'),
'storage':('区分树高/层数；按固定槽编号检查父存在和空间上界',a(2,242)+'；'+a(2,270),'M','公式与稀疏浪费已教，需把条件译成下标约束','补一棵稀疏右链的最大下标与实际节点数对照'),
'dfs':('按根访问时刻递归展开整棵树的遍历序列',a(3,35)+'；'+a(3,47),'S','三遍路过模型及完整遍历实例直接覆盖','保留；提交节点访问轨迹，不只选项字母'),
'seqshape':('由两序相对次序识别单链/祖先关系，再构造或排除树形',a(3,35)+'；'+a(3,430)+'；'+a(3,602),'M','定义、重构原理及同序自测可组合；需要自行证明约束','加一题平行练习：先后逆序时逐次剥离根，验证中序根必须处在端点'),
'seqadj':('用祖先、左右子树顺序证明相邻或相对位置，画反例',a(3,35)+'；'+a(3,137),'M','定义足以推导，不必逐种关系都给同题答案','补父隔开兄弟的两层反例，保留其他情况独立构造'),
'arraylabel':('先画完全树槽位，按后序槽位填值，再查询层次/前序',a(2,242)+'；'+a(3,35),'M','编号与遍历两项均已教，组合属于合理迁移','增加“槽位不等于节点值”的两行填表示范'),
'preStack':('模拟弹栈、访问、先右后左入栈并解释 LIFO',a(3,194),'S','两种先序非递归方法及压栈理由明确','保留；记录每次栈顶和输出'),
'inStack':('左链压栈→弹出访问→转右；跟踪栈与最大占用',a(3,137),'S','步骤和实现完整','加栈底到栈顶的短表；把 h 写为上界，不认定每棵树都取满'),
'postStack':('解释两子树完成状态，比较 lastVisited 与逆序方法',a(3,249)+'；'+a(3,310),'S','两种方法的机制已展开','修题时写清算法模型；保留两解并让读者手算同一棵树'),
'preCopy':('递归创建节点并保持左右结构，解释选择访问时机',a(2,397)+'；'+a(3,448),'M','递归建树足以迁移到复制，不存在唯一访问时机','将“最适合”改为给定先创建父节点的代码框架'),
'bfs':('用 FIFO 与固定 levelSize 分层，再提取每层统计量',a(3,362)+'；'+a(3,390),'S','按层模板可直接应用，右视图只需取层末','保留；明确真实节点宽度与编号跨度两个名称'),
'height':('以空树为基例合并左右高度，或每批层序计一层',a(6,60)+'；'+a(3,390),'S','两种框架都有可用内容','统一边高/层数口径，以空树和单节点检查'),
'recon':('定根、中序定位、按左规模切对应序列、递归并回验',a(3,448)+'；'+a(3,35),'M','闭区间公式已完整给出，后中/求其他序列是合理迁移','补一张含空子树的多层区间表；保留本题独立完成'),
'unique':('用单孩子反例与子树分块论证唯一性条件',a(3,430)+'；'+a(3,448),'M','条件和反例方向已给，证明需从根的唯一身份展开','改掉“必须有中序”的绝对标题，列互异值与 Full 特例'),
'layerrecon':('用中序集合稳定筛选层序，逐层定根再求结构',a(3,430)+'（仅有唯一性断言，无层中构造步骤）','G','层序左右子树节点可能交错，不能照搬先序连续切片','在 A3 前中重构后补稳定筛选例与错误切片反例'),
'countstruct':('按左子树规模分类计数，证明互斥完备后相乘求和',a(3,448)+'（只有恢复特定树，无结构计数）','G','前置文章未找到 Catalan/结构分类递推；不能拿审查者已有公式当教学','补 C0=1 与 Cn=ΣCk·Cn−1−k 的 n≤3 推导，留 n=4 独立做'),
'huffman':('运用最小权合并、编码叶深与最优性排除选项',a(6,546)+'（明确列为下一章；本章无定义/构造）','G','常规混合题隐藏下章编码前置','移到编码学完后回访，或题前补最小两权合并规则并明确前置'),
'bst':('将全局左<根<右与中序严格递增互相推出',a(3,583)+'（比较表只列用途）；'+a(6,546),'G','BST 只被提及，未教定义、严格递增前提或逆向判定','链接下一章 BST 后再做；若留本章，补定义、非局部反例及重复键约定'),
'expr':('将内部子树作为运算整体，控制入/出子树括号与单目运算',a(3,47)+'；'+link('content/chapter-02-stack-queue/03-applications.md',76,'前置：表达式求值'),'M','三访问时刻与括号前置可迁移；尚无表达式树格式走查','补不同于现题的含单目平行例，并用写指针避免 strcat 反复扫描'),
'destroy':('在释放父前完成孩子的访问与释放',a(2,421)+'；'+a(3,35),'S','创建章节已有销毁代码','保留；空树/单链检验生命周期'),
'thread':('先写遍历序列，再仅对空域填前驱/后继并设置 tag',a(4,97)+'；'+a(4,142)+'；'+a(4,332),'M','中序完整状态表可迁移到指定遍历，需保持真实孩子不变','保留状态表，增加“孩子/线索/端点空值”三列自查'),
'threadstruct':('区分真实孩子、线索标记与首尾空指针',a(4,97)+'；'+a(4,198),'S','结构和构造直接覆盖，但工程解释/计数措辞需纠正','删四叉树断言；分清 n+1 个带 tag 的空域与 n−1 条非空线索'),
'threadpred':('按 tag 与子树最右/最左端定位中序邻居并画非叶反例',a(4,252)+'；'+a(4,273),'S','前后继分情形已教','保留；给最右节点仍带左孩子的变式'),
'threadsucc':('分析单次下降路径与全遍历摊还成本',a(4,252)+'；'+a(4,323),'S','正文已区别 O(h) 单次与全程均摊','单选题统一复杂度参数，允许退化 h=n'),
'postthread':('根据兄弟与父关系决定前驱/后继，说明何时需祖先信息',a(4,338)+'；'+a(4,391)+'；'+a(4,490),'M','结构不对称性有图解，可合理迁移','限定“线性时间、常规顺向、无父指针、无临时改链”的讨论模型'),
'forest':('逐条把二叉左/右边译为原树首孩子/下一兄弟',a(1,206)+'；'+a(5,38),'S','指针语义和图均直接覆盖','保留；每走一条边注明是否改变原树层数'),
'forestmap':('用孩子森林递归解释先根=前序、后根=中序',a(5,188)+'；'+a(5,220),'S','不仅给结论，还给归纳证明','保留证明；题中统一后根/中根别名'),
'forestalias':('把题中的森林中根译为后根，再用前中序重构',a(5,205)+'；'+a(3,448),'G','本文只称后根，另称一般树无中根，跨语境容易误判','补森林“中根/中序”在本题库的递归定义与后根对应，给一次转换示范'),
'forestroots':('重构后从根沿右链逐根计数',a(3,448)+'；'+a(5,174),'M','两项已教，组合并不需要新定理','加“只数根右链、不数全部右边”的检查句'),
'forestcount':('把空右域按每条孩子链/森林根链的末节点分组计数',a(1,206)+'；'+a(5,151),'M','可从语义独立推出，属于有价值的计数迁移','用3个兄弟画链，提示一条链只有一个末端；公式留给读者推'),
'forestheight':('同时考虑根右链长度、各树内部形状与重排',a(5,151)+'；'+a(1,250),'M','可画构造及反例，题面却未交代树形能否改变','补“在所有满足节点数的森林中取最小”，否则需给固定树形'),
'countforest':('对每棵树 ni−1 求和，得森林边数 n−m',a(1,98)+'；'+a(1,84),'M','单树边数证明和森林定义足以推出','保留迁移；要求写求和而非背 n−m'),
'mary':('由每层 k 倍上界求容量，验证最少层可达',a(1,124)+'；'+a(2,177),'M','一般树层容量和二叉求和可以迁移','补达到上界/接近上界的构造说明'),
'parent':('从表示字段推导查父与枚举孩子的成本',a(1,171)+'；'+a(1,254),'S','表示法优劣已明确对照','保留；让读者列实际访问的字段数'),
'forestrerecon':('先前中恢复二叉，再沿根左孩子的右兄弟链数原树孩子',a(3,448)+'；'+a(5,38),'M','恢复与反向映射均已教，组合是合理迁移','提醒根的二叉度≠原树孩子数'),
'geom':('在标准不重叠布局下用左-根-右确定横向逻辑顺序',a(3,35),'M','从遍历语义可推出，但几何图约定需明确','将“几何最左”改为左右子树有序布局中的逻辑顺序'),
'dfsvariant':('观察根所在位置，再交换左右递归优先级匹配 RNL 等遍历',a(3,35)+'；'+a(3,47),'M','三访问时刻可推广到镜像遍历，无须单独背六种代码','保留迁移；写出右子树、根、左子树三段再逐段验证'),
'mixed':('逐项用完全树定义、叶数关系、表达式计算时机与森林映射排除',a(2,75)+'；'+a(2,197)+'；'+a(3,35)+'；'+a(5,220),'S','各项所用规则已有定义和实例','保留；每个错误选项画最小反例，不只证明正确项'),
}
mapping=[
'dfsvariant props forest thread huffman complete forestcount countstruct seqshape arraylabel props forestmap storage seqadj huffman arraylabel threadpred storage mixed forestheight',
'seqshape seqshape seqshape arraylabel dfs dfs preStack preStack preCopy recon unique seqshape',
'seqshape seqadj threadpred dfs inStack bst recon inStack threadsucc bst geom',
'thread seqshape seqshape arraylabel forestalias arraylabel layerrecon dfs postStack height expr recon destroy forestmap',
'layerrecon bfs bfs bfs height bfs bfs bfs',
'seqshape seqshape forestalias forestroots layerrecon recon recon layerrecon recon recon recon unique layerrecon seqshape recon recon recon seqshape',
'thread postthread thread threadpred threadstruct thread threadsucc threadstruct threadsucc threadsucc threadstruct postthread threadpred threadstruct',
'forest degree forest countforest forestroots mary forestheight degree degree degree parent parent forest forest forest forest forestmap forestmap forestrerecon forestcount'
]
flags={
'T01-Q13':'高度需明示按层；教材 A1 使用边高。参考上界31在5层口径下正确。',
'T01-Q20':'题面欠量词：只换既定森林顺序不保证最小6；7节点链使高度至少7。',
'T02-Q09':'“最适合复制”依赖实现框架，后序创建父节点也正确。',
'T02-Q11':'补非空、节点身份互异的统一约定。',
'T03-Q08':'题中引用“上题”实际应回指 Q05；实际最大栈3，非树高4。',
'T03-Q10':'答案D与正文 Morris 一致，应保留；补严格BST/互异节点约定。',
'T04-Q09':'答案仅在解释中追加不临时改链的限制；无该限制 Morris 后序使D也可成立。',
'T05-Q05':'题内已定义层高，但解析归因于教材树高约定不准确。',
'T05-Q07':'实际节点宽3/层高4；按 A6 含空槽宽为8，题需写宽度口径。',
'T05-Q08':'层中唯一需互异值；O(w) 中w应是真实节点宽度。',
'T06-Q11':'答案4层正确，解释句对 D/E 归属表述有歧义，应画出 B 左D、右E。',
'T06-Q18':'高度=n采用层数；A1边高则n−1。',
'T07-Q08':'端点 tag 为 Thread 但指针值仍空；括号“不被填为线索”不准确。',
'T07-Q09':'单选不唯一：C O(h) 与 D O(n) 均成立，退化树 h=n。',
'T07-Q10':'单次后继 O(h) 正确；后序首节点宜说“有左走左，否则走右直到叶”。',
'T07-Q11':'2bit仅抽象标记信息量，示例enum未压位；遍历不只是沿右链。',
'T07-Q12':'“仍需要栈”须限定常规线性顺向模型；父指针等改变结论。',
'T08-Q07':'同 T01-Q20：树形可否选择未定义。',
'T08-Q20':'公式需非空森林；端链数 n−k+1，不是加树数m。'
}
attempts={}
for l in (TASK/'research/first-attempts.md').read_text(encoding='utf-8').splitlines():
    parts=l.strip('|').split('|')
    if l.startswith('|') and re.fullmatch(r'(T\d\d-[QC]\d\d|E\d\d)',parts[0]):attempts[parts[0]]=parts[1:]
def cell(s):return str(s).replace('|',' / ').replace('\n','<br>')
def table(headers,rows):return '\n'.join(['|'+'|'.join(headers)+'|','|'+'|'.join('---' for _ in headers)+'|']+['|'+'|'.join(cell(x) for x in row)+'|' for row in rows])+'\n'
rows=[];allrows=[]
for q in inv['choice']:
    key=q['key'];g=int(key[1:3]);num=int(key[-2:]);cap=mapping[g-1].split()[num-1];action,refs,grade,basis,mini=caps[cap]
    raw=json.loads((ROOT/q['source']).read_text(encoding='utf-8'))[num-1]
    att=attempts[key];first='；'.join(att)
    flag=flags.get(key,'参考答案与本次推演相符；未发现影响本题结论的额外问题。')
    allrows.append({'key':key,'category':'选择','source':q['source'],'line':q['line'],'name':q['title'],'skill':action,'article':refs,'support':grades[grade],'attempt':first,'reference':'ABCD'[raw['answer']],'basis':basis,'minimum':mini,'quality':flag})
    rows.append([link(q['source'],q['line'],key)+'<br>'+q['title']+'<br>'+q['id'],action,refs,grades[grade],first+'；参考：'+'ABCD'[raw['answer']],basis+'；'+mini,flag])
text='# 附录 B：本章 117 道选择题逐题覆盖表\n\n题号按页面题序编制，源 JSON 的 id 原样保留。题名“真题”是本地元数据，未外查原卷。正文证据链接直接指向具体段落起始行。表中的“支撑”评价文章能否支持解题动作；题面/答案错误另列，不把错误题一律算作文章缺口。\n\n'
start=0
for i,counts in enumerate([20,12,11,14,8,18,14,20],1):
    text+=f'## T{i:02}\n\n'+table(['题目与实际来源','所需知识和关键动作','文章段落','支撑程度','先行尝试与核对','判断依据与最小建议','题目质量/限制'],rows[start:start+counts])+'\n';start+=counts

comps={
'T01-C01':('props','S','列双计数方程、Complete编号区间及 Perfect 公式；分问中的高度已定义为层数','参考结论正确；解析202的边端点解释错误。'),
'T01-C02':('height','S','空0、叶1、左右相加；证明每点一次并测试单链','主函数正确；解析400把扩展树外部节点写成原叶数+1，错误。'),
'T01-C03':('height','S','空0、左右最大值+1；后序依赖与栈高说明','实现正确；避免未经分布假设写“平均log n”。'),
'T01-C04':('height','S','返回高度或−1，失衡立即传播；不能只查根','A6:239已有优化推导；普通短路版在单链会于根判失衡，不是该代码的二次时间证据。'),
'T01-C05':('forest','S','双空/一空/值不同/交叉两对子树四类判断','应对应 A6:119，参考代码与反例轨迹有效。'),
'T02-C01':('height','G','沿路径传边深，叶乘权并累计；根深0','题面给的是循环式定义，缺 weight×边数；补一句公式即可把算法部分转为合理迁移。'),
'T03-C01':('expr','M','三访问时刻配合非根内部子树的括号边界；单目左空','strcat 会扫描已有字符串，参考174的 O(n) 分析错误；应维护写指针和容量。'),
'T03-C02':('bst','G','0基槽下标中序、跳空与越界、prev全局单调校验','208把0基称为1-indexed；251按值复制含整数组结构，应改const指针传参并说明键严格性。'),
'T03-C03':('inStack','S','C数组栈保存待访问祖先，沿左走/出栈访问/转右；给完整 trace','491–502的if/else版本是正确算法，不能列为错解；固定1024容量与实际O(h)使用量须区分。'),
'T06-C01':('recon','M','不建树直接填后序数组，维护三组闭区间；给归纳与边界','参考实现正确；从左扫描时右链找根首项为O(n)，197–198的右链/最好复杂度推导错误。'),
'T06-C02':('recon','M','每层分块、构树、写后序，用根唯一和子问题唯一归纳','详解有完整轨迹，宜保留并另做平行教材例；472“必须中序”与505 Full例外冲突。'),
'T08-C01':('height','G','同T02-C01，叶的权乘边深后累计','与T02-C01重复，保留为回访或去重；补公式并共享答案。'),
'T08-C02':('mary','M','度和推叶数，等比级数求最大，一条延伸脊柱求最小','参考两种界和可达构造正确，应保留。'),
'T08-C03':('expr','M','同T03-C01，保留根不加括号与单目格式','与T03-C01重复；strcat复杂度问题同源。'),
'T08-C04':('huffman','G','将比特选择映射到编码Trie，叶表示字符；译码/插入时检测前缀冲突','不要求Huffman最优构造，但编码树及终止状态未教；参考插入伪码还漏两字符相同码的冲突。'),
'T08-C05':('forest','M','用firstChild枚举整条兄弟链，递归各孩子，返回1+最大子高','A1:387高度循环可迁移；参考双向递归的O(max(h,w))不是一般上界，应按转换树深度或最坏n，推荐兄弟循环。')
}
crows=[]
for q in inv['composite']:
    key=q['key'];cap,g,action,flag=comps[key];_,refs,_,basis,mini=caps[cap]
    if key=='T01-C05':refs=a(6,119)
    if key=='T01-C02':refs=a(6,43)
    if key=='T01-C04':refs=a(6,239)
    if key=='T01-C02':mini='保留空/叶/非叶三分；修扩展树外部节点数为原总结点数+1，删除与栈空间有关的绝对化比较'
    if key=='T01-C04':mini='保留高度/-1一次返回法；用带深处失衡的反例验证，重写朴素法复杂度例'
    if key=='T01-C05':mini='保留镜像双节点trace；独立检验值相同但左右位置不对称的树'
    if key=='T08-C05':refs=a(1,387)+'；'+a(5,38)
    if key in ('T02-C01','T08-C01'):refs=a(1,60)+'；'+a(6,371)+'（未定义 WPL）';mini='题面前补 WPL=Σ叶权×根到叶边数；用单节点权非零验证贡献0'
    if key=='T08-C04':refs=a(2,26)+'（只有左右槽；编码树在本章无对应段落）';mini='移到编码章节后回访；或先加0/1路径、字符终止标记、三种前缀冲突的小例'
    first='；'.join(attempts[key]);crows.append([link(q['source'],q['line'],key),action,refs,grades[g],first,link(q['source'],q['answer_line'],'参考解析')+'；'+flag,mini])
    allrows.append({'key':key,'category':'综合','source':q['source'],'line':q['line'],'skill':action,'article':refs,'support':grades[g],'attempt':first,'basis':flag,'minimum':mini})
text+='# 附录 C：本章 16 道综合题逐题覆盖表\n\n同题在不同组出现仍逐次计入；WPL、表达式转换各重复一次，因此为14个不同题干任务。每道多问题的各分问都已纳入先行尝试。综合题是纸笔/本地编辑器作业，未发现其所称 OJ wrapper 或独立测试文件。\n\n'+table(['题目与来源','关键动作（覆盖各分问）','文章段落','支撑程度','先行解法记录','参考核验/题目问题','最小补充'],crows)

ecode=[
('S',6,207,'FIFO遇空后禁非空','补公共层序解析，统一#与null；加入1 # 2，标准实现应输出false而非抛异常'),
('M',6,71,'保留孔位的编号跨度与逐层归一化','补真实跨度仍可溢出的反例；统一int接口与uint64实现，规定答案上界或使用大整数'),
('S',3,194,'显式栈先右后左、访问轨迹','补公共解析；区分该栈单链只占1与递归单链占h'),
('M',3,390,'分层输出后按奇偶层反转或镜像填表','补公共解析；保留vector+reverse为入门可行解，删无实测的100%缓存命中断言'),
('M',3,390,'每层最后节点，不沿整棵树右链','补公共解析；用左子树更深的反例检验'),
('M',3,448,'前中区间切分并组合后序和层序输出','加区间空/单点/左右不等大的表；声明n≥1或规定n=0输出；哈希复杂度用期望O(n)'),
('M',3,448,'后根与中序划分，求前序/层序','保留后中作为迁移练习；给一组区间长度验算，不直接公布本题树'),
('G',6,305,'维护已展开前缀与待访问子树；原地改三条指针','改掉最右链端=原先序末的证明；使用pred仍有左子树的变式，并检查地址/left为空'),
('S',6,119,'成对节点、镜像结构与值一起比较','补公共解析；保留相同值不同结构反例'),
('S',6,171,'枚举子树根+完整相同树比较','补公共解析，明确空模式约定；两行读取用getline，测试行尾空格'),
('S',6,371,'下发十进制前缀、仅叶结算、左右贡献相加','補公共解析；规定路径数字及总和上界，10个9链作范围反例'),
('M',6,397,'下发剩余和、push/pop恢复、按叶输出全部路径','補公共解析；补负数不能提前剪枝、左先输出约定、O(n+S)输出成本'),
('M',6,481,'单侧高度返回与双侧长度更新分开','補公共解析；把直径放在最大路径和前，添加非根最优路径的状态表'),
('G',6,455,'分清未找到/找到一个目标/已找到LCA的返回语义','改一侧非空意味着两点都在其侧的错误说明；补局部只含p的trace，明确值唯一，getline读附参'),
('M',6,481,'单侧gain、跨点候选、负贡献舍弃、全负非空解','補公共解析；本题已标挑战且有公式，不需再给同题答案；补混合正负走查及非空输入约定'),
('G',1,270,'无向邻接表、父方向、子树规模、换根两遍','缺换根推导；可作为选修桥：割边两侧距离±w、从根1到所有根、迭代order避免深递归'),
('G',6,481,'恰选j含根的状态、−∞与逐孩子背包合并','二叉单值汇总不足以教会k维背包；补状态语义/新旧表/负数实例，或明确ch14前置；先删错误样例'),
('G',6,31,'带权树双扫直径、恢复路径、中心充分性、边上坐标','文章只提直径目标，无中心方法；增加独立选修桥并修E18距离方向及3个错误期望'),
('M',6,481,'下一步方向为两个状态、接子树相反状态、允许重启','可作为已标挑战的状态扩展；補公共解析与两状态表，给10^5深链的迭代方案'),
('G',1,84,'无根结构不变量、重心、共享规范ID、排序合并','无重心/规范化教学；给独立选修前置，避免逐层长字符串复制；修错误样例及网页代码')]
binary={1,2,3,4,5,8,9,10,11,12,13,14,15,19}
erows=[]
for q in inv['exercise']:
    k=int(q['key'][1:]);g,ai,ln,act,mini=ecode[k-1];refs=a(ai,ln)
    if k>=16 and k!=19:refs+='（仅基础/类比，无该方法正文）'
    first='；'.join(attempts[q['key']]);whole='G' if k in binary or g=='G' else g
    note='公共G1：压缩层序解析未教且starter未提供。' if k in binary else ''
    erows.append([link(q['source'],16,q['key'])+'<br>'+re.search(r'^# (.+)$',(ROOT/q['source']).read_text(encoding='utf-8'),re.M).group(1),act,refs,'算法：'+grades[g]+'<br>完整交付：'+grades[whole],first,note+mini,link(str(Path(q['source']).parent/'solution/main.cpp'),1,'标准实现')])
    allrows.append({'key':q['key'],'category':'代码','source':q['source'],'line':16,'skill':act,'article':refs,'support':grades[whole],'algorithm_support':grades[g],'attempt':first,'basis':note,'minimum':mini})
text+='# 附录 D：20 道代码题逐题覆盖表\n\n“算法支撑”与“完整交付”分开：14题共同受 G1 输入建树缺口影响，不据此宣称14种算法都没教。完整交付还包括解析、数据表示、实现、复杂度和边界；每行先行记录保留具体步骤与复杂度。E15–E20 已标挑战，挑战身份可以允许更远迁移，但不能替代缺失前置或替错误合同开脱。\n\n'+table(['题目与实际来源','关键动作','文章段落','支撑程度','先行设计/复杂度/边界','判断与最小补充','核验来源'],erows)

selfs=[
(1,450,'11条边，度和11','degree','S',''),(1,451,'得到孩子子树森林（可空/单棵）；新增根连接各树根','countforest','M',''),(1,452,'parent字段定位O(1)，枚举需扫所有parent','parent','S',''),(1,453,'nextSibling连接同父同层兄弟，非原父子','forest','S',''),(1,454,'parent+children；插删时两侧同步、唯一父且无环','parent','M',''),
(2,552,'不同，左右槽有序','storage','S',''),(2,553,'Full不一定Complete；Perfect一定Complete','props','S',''),(2,554,'32与63；从根第1层起按倍增求和','props','S',''),(2,555,'18；消去n1','props','S',''),(2,556,'5层，最后内部编号15（1基）','complete','S',''),(2,557,'2n−(n−1)=n+1；销毁不能跟线索回走','threadstruct','S',''),(2,558,'A的右孩子B；C显式destroy、C++unique_ptr离域释放','storage','S',''),
(3,602,'A→右B→右C；逐层中序根在首','seqshape','M',''),(3,603,'栈后进先出，右先入才能左先访问','preStack','S',''),(3,604,'特定单栈框架无法判断右树完成，会重访或漏访；其他框架可不用该变量','postStack','S','题应限定前文lastVisited方法，双栈法无需该变量。'),(3,605,'互异节点且每个内部节点恰有两个孩子足够；单孩子方向不确定','unique','M',''),(3,606,'Perfect：DFS O(log n)，BFS Θ(n)；Full并不保证log n高度','bfs','M','本章Full叫满，题却需要Perfect口径；Full梳形树高度可Θ(n)。'),
(4,581,'普通空域101；tag为Thread的域101，其中非空线索99、端点空值2','threadstruct','S','必须说明“线索指针”数的是域还是非空连接。'),(4,582,'中序前驱，不保证父节点；首节点可为空','threadpred','S',''),(4,583,'无左兄弟需找父，有左兄弟还要找其最后访问者；父信息可由栈或从根重找','postthread','M','“必须父指针”过强；应限定效率与模型。'),(4,584,'ltag=rtag=Thread，两个指针均nullptr','threadstruct','S',''),(4,585,'两者遍历O(n)，显式栈O(h)上界、已建线索树O(1)辅助；另计建线索成本','threadsucc','S',''),
(5,333,'左指向首孩子或空；右为空（根无兄弟）','forest','S',''),(5,334,'n2+n3，后续两棵树全在根右子树','forest','M',''),(5,335,'无统一默认的根插入孩子序列的位置；可以另行定义一种约定','forestmap','S','不要说逻辑上“不能定义”。'),(5,336,'B D E C A','forestmap','S','同页答案已暴露；其附加“不能唯一确定多叉树”断言错误。'),(5,337,'固定两指针适应不等孩子数、免固定大数组空槽；随机第k孩子变慢','forest','M',''),
(6,538,'要保留两端之间空槽，真实节点的紧凑序号丢失孔位','bfs','M','需明确所求是编号跨度宽。'),(6,539,'自底向上每点一次，返回高度/-1；朴素重复求高一般O(n²)上界，链短路并非Θ(n²)','height','S','修正文错误复杂度例；不把上界说成每个输入的耗时。'),(6,540,'兄弟路径混入前一分支，回溯要恢复到父路径','expr','S','实际证据A6:397，保留push/pop配对。'),(6,541,'遇p立即返回；在两目标都存在的整树中p就是LCA，局部返回语义需说清','recon','M','实际证据A6:455；局部返回p不代表已找到q。'),(6,542,'上报只能接父的一支；全局候选可以左右两支经过当前点','height','S','实际证据A6:481；这部分已有有效解释。')]
srows=[];idx=Counter()
for ai,ln,answer,cap,g,flag in selfs:
    idx[ai]+=1;key=f'A{ai}-S{idx[ai]:02}';action,refs,_,basis,mini=caps[cap]
    if ai==6:refs=a(6,{538:71,539:239,540:397,541:455,542:481}[ln])
    prompt=(ROOT/arts[ai]).read_text(encoding='utf-8').splitlines()[ln-1]
    srows.append([link(arts[ai],ln,key),prompt,refs,grades[g],answer,flag or '题意可由对应正文推导；无独立官方评分。',mini if ai!=6 else '保留对应方法；以上述边界/返回含义检验，纠正口径后再自测'])
    allrows.append({'key':key,'category':'文章自测','source':arts[ai],'line':ln,'skill':prompt,'article':refs,'support':grades[g],'attempt':answer,'basis':flag,'minimum':mini})
text+='# 附录 E：32 道文章自测逐题覆盖表\n\n除 A5-S04 有同页参考答案外，其余自测没有独立评分答案，本表列审查推导。文章中教学示例、思考提示与答案一起出现的内容按“已教示范”读取，不假装是盲做题。\n\n'+table(['题目与来源','完整自测任务','正文证据','支撑程度','审查推导/规范答案要点','题面限制','最小建议'],srows)

xrows=[];xmap=['forestalias forestroots forest forestroots forest forestmap forestmap forest bst forest forest forestroots forest forest forest forest','dfsvariant forestmap forestmap forestmap forestmap seqshape seqshape dfs seqshape']
xattempt={}
for l in (TASK/'research/associated-attempts.md').read_text(encoding='utf-8').splitlines():
    p=l.strip('|').split('|')
    if l.startswith('|') and re.match(r'X\d\d-[QC]\d\d$',p[0]):xattempt[p[0]]=p[1]
for q in json.loads((TASK/'research/associated-blind.json').read_text(encoding='utf-8')):
    g=int(q['key'][1:3]);num=int(q['key'][-2:]);raw=json.loads((ROOT/q['source']).read_text(encoding='utf-8'))[num-1];cap=xmap[g-1].split()[num-1];action,refs,grade,basis,mini=caps[cap]
    src=(ROOT/q['source']).read_text(encoding='utf-8').splitlines();ln=next(i+1 for i,l in enumerate(src) if f'"id": "{q["id"]}"' in l)
    xrows.append([link(q['source'],ln,q['key'])+'<br>'+q['id'],action,refs,grades[grade],xattempt[q['key']]+'；参考'+'ABCD'[raw['answer']],mini])
    allrows.append({'key':q['key'],'category':'关联选择','source':q['source'],'line':ln,'skill':action,'article':refs,'support':grades[grade],'attempt':xattempt[q['key']],'reference':'ABCD'[raw['answer']],'minimum':mini})
xp=next((ROOT/'labs/chapter-05/theory').glob('T-05-01*/README.md')).relative_to(ROOT).as_posix()
xrows.append([link(xp,47,'X01-C01'),'13节点逐指针转换、两次遍历、一般性证明',a(5,151)+'；'+a(5,220),grades['S'],xattempt['X01-C01'],'保留指针对照表；参考238“沿右指针向上回溯”错；280把正确的分别转换再串根当错路，需改。'])
allrows.append({'key':'X01-C01','category':'关联综合','source':xp,'line':47,'skill':'森林转换+证明','article':a(5,151),'support':grades['S'],'attempt':xattempt['X01-C01'],'minimum':'保留表格，改正向上回溯和拼接错路解释'})
text+='# 附录 F：关联 ch5 的26题\n\nX01=T-05-01，X02=T-05-02；两组README:26反向引用本章。纳入以避免漏掉关联练习，单独计数，未扩大为整个ch5审查。X01-C01定位时已暴露部分答案；三道重复选择题也已见本章答案，其余先留尝试再核对。\n\n'+table(['题目与来源','关键动作','对应文章','支撑程度','尝试与核对','最小补充/限制'],xrows)

assert len(allrows)==211,len(allrows)
assert len({r['key'] for r in allrows})==211
(TASK/'coverage-tables.md').write_text(text,encoding='utf-8')
(TASK/'research/coverage.json').write_text(json.dumps(allrows,ensure_ascii=False,indent=2),encoding='utf-8')
with (TASK/'coverage.csv').open('w',encoding='utf-8-sig',newline='') as f:
    fields=['key','category','source','line','skill','article','support','algorithm_support','attempt','reference','basis','minimum','quality'];w=csv.DictWriter(f,fields,extrasaction='ignore');w.writeheader();w.writerows(allrows)
print('Coverage',len(allrows),Counter(r['category'] for r in allrows))
for cat in ['选择','综合','代码','文章自测','关联选择']:print(cat,Counter(r['support'] for r in allrows if r['category']==cat))
print('Code algorithm',Counter(r['algorithm_support'] for r in allrows if r['category']=='代码'))
