// Pure algorithm traces. Node ids keep pointer identity stable across replay frames.
export function binaryTree(rows) {
  return {
    root: rows[0]?.[0] ?? null,
    nodes: rows.map(([id, left = null, right = null]) => ({ id, left, right })),
  };
}

export const BINARY_PRESETS = {
  textbook: { label: "课本示例 A / B C / D E", tree: binaryTree([
    ["A", "B", "C"], ["B", "D", "E"], ["C"], ["D"], ["E"],
  ]) },
  flatten: { label: "先序示例 1,2,3,4,5,6", tree: binaryTree([
    ["1", "2", "5"], ["2", "3", "4"], ["3"], ["4"], ["5", null, "6"], ["6"],
  ]) },
  nested: { label: "拼接点仍有左孩子", tree: binaryTree([
    ["1", "2", "5"], ["2", "3", "4"], ["3"], ["4", "7"], ["7"], ["5", null, "6"], ["6"],
  ]) },
  left: { label: "长左链 A → B → C → D", tree: binaryTree([
    ["A", "B"], ["B", "C"], ["C", "D"], ["D"],
  ]) },
  right: { label: "长右链 A → B → C → D", tree: binaryTree([
    ["A", null, "B"], ["B", null, "C"], ["C", null, "D"], ["D"],
  ]) },
  single: { label: "单节点 A", tree: binaryTree([["A"]]) },
  empty: { label: "空树", tree: binaryTree([]) },
};

export const FOREST_PRESETS = {
  textbook: { label: "课本多叉树：A 的三个孩子", roots: ["A"], nodes: [
    { id: "A", children: ["B", "C", "D"] }, { id: "B", children: [] },
    { id: "C", children: ["E"] }, { id: "D", children: [] }, { id: "E", children: [] },
  ] },
  forest: { label: "森林：三棵树 A、F、H", roots: ["A", "F", "H"], nodes: [
    { id: "A", children: ["B", "C"] }, { id: "B", children: ["D", "E"] },
    { id: "C", children: [] }, { id: "D", children: [] }, { id: "E", children: [] },
    { id: "F", children: ["G"] }, { id: "G", children: [] }, { id: "H", children: [] },
  ] },
  chain: { label: "单孩子链：A → B → C → D", roots: ["A"], nodes: [
    { id: "A", children: ["B"] }, { id: "B", children: ["C"] },
    { id: "C", children: ["D"] }, { id: "D", children: [] },
  ] },
  single: { label: "单节点 A", roots: ["A"], nodes: [{ id: "A", children: [] }] },
  empty: { label: "空森林", roots: [], nodes: [] },
};

export function binaryOrder(tree, order = "inorder") {
  const byId = new Map(tree.nodes.map(node => [node.id, node]));
  const result = [];
  function visit(id) {
    if (id === null) return;
    const node = byId.get(id);
    if (order === "preorder") result.push(id);
    visit(node.left);
    if (order === "inorder") result.push(id);
    visit(node.right);
  }
  visit(tree.root);
  return result;
}

function recorder(tree, tagged = false) {
  const nodes = tree.nodes.map(node => ({ ...node, ...(tagged ? { ltag: 0, rtag: 0 } : {}) }));
  const byId = new Map(nodes.map(node => [node.id, node]));
  const frames = [];
  const state = { curr: null, prev: null, pred: null, output: [], stack: [], temporary: [], scans: 0 };
  function record(phase, message, line, extra = {}) {
    const previous = frames.at(-1);
    const changes = [];
    for (let i = 0; previous && i < nodes.length; i++) {
      for (const slot of ["left", "right"]) {
        const tag = slot === "left" ? "ltag" : "rtag";
        if (previous.nodes[i][slot] !== nodes[i][slot] || previous.nodes[i][tag] !== nodes[i][tag]) {
          changes.push({ from: nodes[i].id, slot, before: previous.nodes[i][slot], after: nodes[i][slot] });
        }
      }
    }
    frames.push(structuredClone({ ...state, nodes, changes, phase, message, line, ...extra }));
  }
  return { nodes, byId, frames, state, record };
}

export function threadingTrace(tree) {
  const { byId, frames, state, record } = recorder(tree, true);
  record("ready", "从普通二叉树开始。实线是孩子；只把空指针改成线索，prev 初始为空。", -1);
  function visit(id) {
    if (id === null) return;
    const node = byId.get(id);
    state.curr = id;
    state.stack.push(id);
    record("descend", `进入 ${id}，先递归处理它的左子树。`, 0);
    visit(node.left);
    state.curr = id;
    record("inspect", `回到 ${id}；上一个中序访问节点 prev = ${state.prev ?? "nullptr"}。`, 1);
    if (node.left === null) {
      node.left = state.prev;
      node.ltag = 1;
      record("predecessor", `${id}.left = ${state.prev ?? "nullptr"}，ltag = Thread(1)。${state.prev === null ? "它是中序第一个节点，没有前驱。" : "空左指针现在指向中序前驱。"}`, 1);
    }
    const previous = byId.get(state.prev);
    if (previous && previous.right === null) {
      previous.right = id;
      previous.rtag = 1;
      record("successor", `${previous.id}.right = ${id}，rtag = Thread(1)，建立上一个节点的后继线索。`, 2);
    }
    state.prev = id;
    state.output.push(id);
    record("visit", `完成 ${id} 的线索处理，令 prev = ${id}；中序访问序列增加 ${id}。`, 3);
    record("right", `继续处理 ${id} 的真实右子树；Thread(1) 指针不是孩子，不递归进入。`, 4);
    if (node.rtag === 0) visit(node.right);
    state.stack.pop();
  }
  visit(tree.root);
  state.curr = null;
  if (state.prev !== null) {
    byId.get(state.prev).right = null;
    byId.get(state.prev).rtag = 1;
    record("tail", `最后一个节点 ${state.prev} 的 right = nullptr、rtag = Thread(1)，表示没有后继。`, 5);
  }
  record("done", tree.root === null ? "空树无需线索化，访问序列为空。" : "线索化完成。原有孩子边保持不变，空指针已按中序前驱/后继标记。点击节点检查指针表。", -1);
  return frames;
}

export function morrisTrace(tree) {
  const { byId, frames, state, record } = recorder(tree);
  state.curr = tree.root;
  record("ready", "从未线索化的普通树开始。Morris 只临时借用空右指针，结束后必须全部恢复。", -1);
  while (state.curr !== null) {
    const node = byId.get(state.curr);
    state.pred = null;
    record("inspect", `检查 curr = ${node.id} 是否有左子树。`, 0);
    if (node.left === null) {
      state.output.push(node.id);
      record("visit", `${node.id} 没有左孩子，直接输出它。`, 1);
      state.curr = node.right;
      record("move", `沿 ${node.id}.right 移到 ${state.curr ?? "nullptr"}${state.temporary.includes(node.id) ? "，这次走的是临时回边。" : "。"}`, 2);
    } else {
      state.pred = node.left;
      record("find", `从左孩子 ${state.pred} 出发，寻找 ${node.id} 的中序前驱。`, 3);
      while (byId.get(state.pred).right !== null && byId.get(state.pred).right !== node.id) {
        state.pred = byId.get(state.pred).right;
        state.scans++;
        record("scan", `pred 沿右指针前进到 ${state.pred}；遇空或指回 curr 时停止。`, 3);
      }
      const pred = byId.get(state.pred);
      if (pred.right === null) {
        pred.right = node.id;
        state.temporary.push(pred.id);
        record("create", `第一次到达 ${node.id}：建立临时回边 ${pred.id}.right → ${node.id}。`, 4);
        state.curr = node.left;
        record("move", `进入左子树 ${state.curr}；之后通过这条回边回到 ${node.id}。`, 5);
      } else {
        pred.right = null;
        state.temporary = state.temporary.filter(id => id !== pred.id);
        record("remove", `第二次到达 ${node.id}：左子树已完成，拆除 ${pred.id} → ${node.id}，恢复空右指针。`, 6);
        state.output.push(node.id);
        record("visit", `现在输出 ${node.id}，然后进入其右侧。`, 7);
        state.curr = node.right;
        record("move", `curr 移到 ${state.curr ?? "nullptr"}。`, 8);
      }
    }
  }
  state.pred = null;
  record("done", "Morris 中序遍历完成；临时回边数为 0，所有 left/right 已恢复为原树。", -1);
  return frames;
}

export function flattenTrace(tree) {
  const { byId, frames, state, record } = recorder(tree);
  state.curr = tree.root;
  record("ready", "左侧保留原树，右侧逐条执行指针修改。绿色粗线为新增边，红色虚线与叉号表示本步删除的边。", -1);
  while (state.curr !== null) {
    const node = byId.get(state.curr);
    state.pred = null;
    record("inspect", `处理 curr = ${node.id}。${node.left === null ? "没有左子树，无需拼接。" : "先为左子树寻找拼接点。"}`, 0);
    if (node.left !== null) {
      state.pred = node.left;
      record("find", `pred 从左孩子 ${state.pred} 出发，沿 right 找到末端。`, 1);
      while (byId.get(state.pred).right !== null) {
        state.pred = byId.get(state.pred).right;
        state.scans++;
        record("scan", `pred 沿右指针前进到 ${state.pred}。它仍可能有左孩子。`, 2);
      }
      byId.get(state.pred).right = node.right;
      record("attach", `${state.pred}.right = ${node.right ?? "nullptr"}：把原右子树接在拼接点后面。`, 3);
      node.right = node.left;
      record("promote", `${node.id}.right = ${node.left}：把原左子树接到 curr 的右侧。下一步再清空左指针。`, 4);
      node.left = null;
      record("clear", `${node.id}.left = nullptr：断开原左孩子边，完成本次拼接。`, 5);
    }
    state.output.push(node.id);
    state.curr = node.right;
    record("move", `节点 ${node.id} 已就位，curr 沿新 right 移到 ${state.curr ?? "nullptr"}。`, 6);
  }
  state.pred = null;
  record("done", tree.root === null ? "空树展开后仍为空。" : "展开完成：所有 left 均为空，沿 right 得到原树的先序序列。", -1);
  return frames;
}

export function forestToBinary(forest) {
  const nodes = forest.nodes.map(node => ({ id: node.id, left: node.children[0] ?? null, right: null }));
  const byId = new Map(nodes.map(node => [node.id, node]));
  for (const siblings of [forest.roots, ...forest.nodes.map(node => node.children)]) {
    for (let i = 0; i + 1 < siblings.length; i++) byId.get(siblings[i]).right = siblings[i + 1];
  }
  return { root: forest.roots[0] ?? null, nodes };
}

export function forestOrder(forest, order = "postorder") {
  const byId = new Map(forest.nodes.map(node => [node.id, node]));
  const result = [];
  function visit(id) {
    if (order === "preorder") result.push(id);
    for (const child of byId.get(id).children) visit(child);
    if (order === "postorder") result.push(id);
  }
  forest.roots.forEach(visit);
  return result;
}

export function forestTrace(forest, order = "postorder") {
  const binary = forestToBinary(forest);
  const leftOrder = forestOrder(forest, order);
  const rightOrder = binaryOrder(binary, order === "postorder" ? "inorder" : "preorder");
  const { frames, state, record } = recorder(binary);
  const modes = order === "postorder" ? "原树后根 / 森林后序 ↔ 二叉树中序" : "原树先根 / 森林先序 ↔ 二叉树前序";
  record("original", "先看原结构。节点字母就是两侧共同的身份；点击任意节点可查看对应关系。", 0, { stage: 0, rightOutput: [] });
  record("siblings", "加线：同一父节点的孩子按顺序连成兄弟链；森林各根也按顺序相连。", 1, { stage: 1, rightOutput: [] });
  record("first-child", "抹线：每个父节点只保留通往第一个孩子的边，其他孩子由兄弟链串起来。", 2, { stage: 2, rightOutput: [] });
  record("binary", "转换布局：左指针代表第一个孩子，右指针代表下一个兄弟。节点身份与兄弟次序均未改变。", 3, { stage: 3, rightOutput: [] });
  for (let i = 0; i < leftOrder.length; i++) {
    if (leftOrder[i] !== rightOrder[i]) throw new Error("Traversal correspondence failed");
    state.curr = leftOrder[i];
    state.output.push(leftOrder[i]);
    record("visit", `第 ${i + 1} 次访问：两侧同时输出 ${leftOrder[i]}。${modes}。`, 4, { stage: 3, rightOutput: rightOrder.slice(0, i + 1) });
  }
  state.curr = null;
  record("done", leftOrder.length ? "遍历完成，两侧的每次输出一一对应。转换后二叉树的右孩子是原结构的兄弟，不是原树的孩子。" : "空森林对应空二叉树，两侧访问序列都为空。", -1, { stage: 3, rightOutput: rightOrder });
  return frames;
}
