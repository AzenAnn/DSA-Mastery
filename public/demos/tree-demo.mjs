import {
  BINARY_PRESETS, FOREST_PRESETS, binaryOrder, threadingTrace,
  morrisTrace, flattenTrace, forestTrace, forestToBinary,
} from "./tree-algorithms.mjs";

const kind = document.body.dataset.demo;
const configs = {
  threaded: { modes: [["threading", "中序线索化"], ["morris", "Morris 中序遍历"]], preset: "textbook" },
  forest: { modes: [["postorder", "后根 / 后序森林 ↔ 中序"], ["preorder", "先根 / 先序森林 ↔ 前序"]], preset: "textbook" },
  flatten: { modes: [["flatten", "原地迭代展开"]], preset: "flatten" },
};
const code = {
  threading: ["递归真实左子树", "若 left 为空：left = prev; ltag = 1", "若 prev.right 为空：right = curr; rtag = 1", "访问 curr; prev = curr", "递归真实右子树", "收尾：prev.right = null; rtag = 1"],
  morris: ["检查 curr.left", "无左孩子：输出 curr", "curr = curr.right", "pred 从左孩子沿 right 找前驱", "首次到达：pred.right = curr", "curr = curr.left", "再次到达：pred.right = null", "输出 curr", "curr = curr.right"],
  flatten: ["检查 curr.left", "pred = curr.left", "沿 right 移动 pred，直到末端", "pred.right = curr.right", "curr.right = curr.left", "curr.left = null", "curr = curr.right"],
  postorder: ["原树 / 森林", "加线：串起右兄弟", "抹线：只保留首孩子边", "left = 首孩子; right = 右兄弟", "原结构后根 / 后序 ↔ 二叉树中序"],
  preorder: ["原树 / 森林", "加线：串起右兄弟", "抹线：只保留首孩子边", "left = 首孩子; right = 右兄弟", "原结构先根 / 先序 ↔ 二叉树前序"],
};
const phaseNames = { ready: "准备", done: "已完成", visit: "访问", descend: "递归进入", inspect: "检查", predecessor: "前驱线索", successor: "后继线索", right: "递归右侧", tail: "末端处理", move: "移动指针", find: "寻找拼接点", scan: "沿右链搜索", create: "建立回边", remove: "拆除回边", attach: "连接原右侧", promote: "左移到右", clear: "清空左侧", original: "原结构", siblings: "加线", "first-child": "抹线", binary: "转换完成" };
const presets = kind === "forest" ? FOREST_PRESETS : BINARY_PRESETS;
const config = configs[kind];
const queryMode = new URLSearchParams(location.search).get("mode");
let mode = config.modes.some(([value]) => value === queryMode) ? queryMode : config.modes[0][0];
let presetId = config.preset;
let frames = [], index = 0, timer = null, selected = null;
let source, originalLayout, binaryLayout, expectedOrder;
let svgCount = 0;
const $ = selector => document.querySelector(selector);

$("#demo").innerHTML = `
  <section class="layout">
    <div class="card">
      <div class="toolbar">
        <label>预设案例<select data-role="dataset" aria-label="选择树形"></select></label>
        <label>演示内容<select data-role="mode" aria-label="选择算法"></select></label>
      </div>
      <div class="controls" aria-label="播放控制">
        <button data-action="reset">↺ 重置</button>
        <button data-action="prev">← 上一步</button>
        <button data-action="play" class="primary">▶ 播放</button>
        <button data-action="next">下一步 →</button>
        <input data-role="timeline" type="range" min="0" value="0" aria-label="时间线进度">
        <select data-role="speed" aria-label="播放速度"><option value="1400">0.5× 慢速</option><option value="800" selected>1× 正常</option><option value="350">2× 快速</option></select>
      </div>
      <div class="meta"><span id="counter"></span><span class="badge" id="status"></span></div>
      <div class="narration" id="narration" aria-live="polite" aria-atomic="true"></div>
      <div class="compare" id="boards">
        <section class="pane" id="left-pane"><h2 id="left-title"></h2><div class="board" id="left-tree"></div><div class="sequence-label" id="left-sequence-label"></div><div class="seqview" id="left-sequence" aria-label="左侧访问序列"></div></section>
        <section class="pane"><h2 id="right-title"></h2><div class="board" id="right-tree"></div><div class="sequence-label" id="right-sequence-label"></div><div class="seqview" id="right-sequence" aria-label="右侧访问序列"></div></section>
      </div>
      <div class="legend" id="legend" aria-label="线型图例"></div>
      <p class="tip">点击节点查看指针；紫色外圈表示选中，青色外圈表示 curr。用“上一步”或拖动时间线，可复看指针修改前后的状态。</p>
    </div>
    <aside class="side">
      <section class="card">
        <h2>当前状态</h2>
        <div class="stats"><div class="stat"><small>curr</small><strong id="curr"></strong></div><div class="stat"><small>prev</small><strong id="prev"></strong></div><div class="stat"><small>pred</small><strong id="pred"></strong></div></div>
        <p id="metrics" class="tip"></p><p id="inspector" class="tip inspector" aria-live="polite"></p>
      </section>
      <section class="card"><h2>对应操作</h2><ol class="code-steps" id="code"></ol></section>
      <section class="card"><h2 id="table-title">指针快照</h2><div id="table"></div><p class="tip" id="table-note"></p></section>
    </aside>
  </section>
  <p class="footer-note" id="footer-note"></p>`;

const ui = { timeline: $("[data-role=timeline]"), speed: $("[data-role=speed]"), mode: $("[data-role=mode]"), dataset: $("[data-role=dataset]"), play: $("[data-action=play]"), prev: $("[data-action=prev]"), next: $("[data-action=next]") };
function option(value, label) { const node = document.createElement("option"); node.value = value; node.textContent = label; return node; }
ui.dataset.replaceChildren(...Object.entries(presets).map(([key, value]) => option(key, value.label)));
ui.mode.replaceChildren(...config.modes.map(([value, label]) => option(value, label)));
ui.mode.value = mode;
ui.dataset.value = presetId;

// Layout follows only original child edges; threading/Morris snapshots may contain cycles.
function layoutBinary(tree) {
  const positions = {}, byId = new Map(tree.nodes.map(node => [node.id, node]));
  let position = 0, depthMax = 0;
  function walk(id, depth) {
    if (id === null) return;
    const node = byId.get(id);
    walk(node.left, depth + 1);
    positions[id] = { x: 70 + position++ * 76, y: 65 + depth * 100 };
    depthMax = Math.max(depthMax, depth);
    walk(node.right, depth + 1);
  }
  walk(tree.root, 0);
  const width = Math.max(300, 140 + Math.max(0, position - 1) * 76);
  if (position === 1) positions[tree.root].x = width / 2;
  return { positions, width, height: Math.max(230, depthMax * 100 + 150) };
}

function layoutForest(forest) {
  const positions = {}, byId = new Map(forest.nodes.map(node => [node.id, node]));
  let leaf = 0, depthMax = 0;
  function walk(id, depth) {
    const node = byId.get(id);
    depthMax = Math.max(depthMax, depth);
    const xs = node.children.map(child => walk(child, depth + 1));
    const x = xs.length ? (xs[0] + xs.at(-1)) / 2 : 70 + leaf++ * 90;
    positions[id] = { x, y: 65 + depth * 100 };
    return x;
  }
  forest.roots.forEach(id => { walk(id, 0); leaf += .5; });
  const width = Math.max(300, 140 + Math.max(0, leaf - 1) * 90);
  if (forest.nodes.length === 1) positions[forest.roots[0]].x = width / 2;
  return { positions, width, height: Math.max(230, depthMax * 100 + 140) };
}

function nodeEdges(nodes, temporary = [], forest = false) {
  return nodes.flatMap(node => ["left", "right"].filter(slot => node[slot] !== null).map(slot => {
    const tag = slot === "left" ? node.ltag : node.rtag;
    const type = tag === 1 ? (slot === "left" ? "predecessor" : "successor")
      : slot === "right" && temporary.includes(node.id) ? "temporary"
        : forest ? (slot === "left" ? "first-child" : "sibling") : "child";
    return { from: node.id, to: node[slot], slot, type };
  }));
}

function originalForestEdges() {
  return source.nodes.flatMap(node => node.children.map((child, i) => ({ from: node.id, to: child, slot: "child", type: "child", first: i === 0 })));
}

const NS = "http://www.w3.org/2000/svg";
function svgElement(tag, attributes = {}, text) {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (text !== undefined) element.textContent = text;
  return element;
}

function drawTree(container, nodes, edges, layout, frame, changes = []) {
  const { positions, width, height } = layout;
  const prefix = `arrows-${svgCount++}`;
  const svg = svgElement("svg", { viewBox: `0 0 ${width} ${height}`, role: "group", "aria-label": container.id === "left-tree" ? $("#left-title").textContent : $("#right-title").textContent });
  const defs = svgElement("defs");
  for (const [name, color] of Object.entries({ child: "--muted", predecessor: "--purple", successor: "--cyan", temporary: "--yellow", sibling: "--purple", "first-child": "--cyan", added: "--green", removed: "--red" })) {
    const marker = svgElement("marker", { id: `${prefix}-${name}`, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 5, markerHeight: 5, orient: "auto-start-reverse" });
    marker.append(svgElement("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: `var(${color})` }));
    defs.append(marker);
  }
  svg.append(defs);
  const removed = changes.filter(change => change.before !== null && change.before !== change.after).map(change => ({ from: change.from, to: change.before, slot: change.slot, type: "removed" }));
  const allEdges = [...edges, ...removed];
  for (const edge of allEdges) {
    const a = positions[edge.from], b = positions[edge.to];
    if (!a || !b) continue;
    const added = changes.some(change => change.from === edge.from && change.slot === edge.slot && change.after === edge.to && change.before !== change.after);
    const type = edge.type === "removed" ? "removed" : added ? "added" : edge.type;
    // Separate coincident L/R pointers during flatten's three individual writes.
    const sharedTarget = edge.slot === "right" && allEdges.some(other => other.from === edge.from && other.to === edge.to && other.slot === "left");
    const curved = ["predecessor", "successor", "temporary"].includes(edge.type) || sharedTarget || (edge.type === "removed" && mode === "morris");
    let d, labelX, labelY;
    if (curved) {
      const side = edge.slot === "left" ? -1 : 1;
      const sx = a.x + side * 25, tx = b.x + side * 25;
      const control = Math.min(width - 10, Math.max(10, (side === -1 ? Math.min(sx, tx) : Math.max(sx, tx)) + side * 44));
      d = `M ${sx} ${a.y} C ${control} ${a.y}, ${control} ${b.y}, ${tx} ${b.y}`;
      labelX = (sx + 6 * control + tx) / 8;
      labelY = (a.y + b.y) / 2 - 5;
    } else {
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const dx = (b.x - a.x) / length, dy = (b.y - a.y) / length;
      d = `M ${a.x + dx * 25} ${a.y + dy * 25} L ${b.x - dx * 28} ${b.y - dy * 28}`;
      labelX = (a.x + b.x) / 2 + 7;
      labelY = (a.y + b.y) / 2 - 6;
    }
    const path = svgElement("path", { d, class: `edge ${edge.type}${added ? " added" : ""}`, "marker-end": `url(#${prefix}-${type})`, "data-from": edge.from, "data-to": edge.to, "data-slot": edge.slot });
    path.append(svgElement("title", {}, `${edge.from}.${edge.slot} → ${edge.to}${type === "removed" ? "（本步删除）" : ""}`));
    svg.append(path);
    const labels = { predecessor: "前驱", successor: "后继", temporary: "临时", sibling: "右兄弟", "first-child": "首孩子" };
    const childLabel = kind === "threaded" || edge.slot === "child" ? "" : edge.slot === "left" ? "L" : "R";
    if (edge.type !== "removed") svg.append(svgElement("text", { x: labelX, y: labelY, class: "edge-label" }, labels[edge.type] ?? childLabel));
    if (edge.type === "removed") svg.append(svgElement("path", { class: "removed-cross", d: `M ${labelX - 5} ${labelY - 5} l 10 10 m -10 0 l 10 -10` }));
  }
  if (!nodes.length) svg.append(svgElement("text", { x: width / 2, y: height / 2, class: "empty-label" }, "∅ 空结构"));
  for (const node of nodes) {
    const point = positions[node.id];
    if (!point) continue;
    const isSelected = selected === node.id;
    const roles = [frame.curr === node.id ? "curr" : "", frame.prev === node.id ? "prev" : "", frame.pred === node.id ? "pred" : ""].filter(Boolean);
    const g = svgElement("g", { class: `node${frame.output.includes(node.id) ? " visited" : ""}${isSelected ? " selected" : ""}${frame.curr === node.id ? " current" : ""}`, transform: `translate(${point.x},${point.y})`, "data-node": node.id, role: "button", tabindex: 0, "aria-label": `节点 ${node.id}，查看对应关系和指针`, "aria-pressed": String(isSelected) });
    g.append(svgElement("circle", { r: 24 }), svgElement("text", { y: 6 }, node.id));
    if (isSelected) g.append(svgElement("circle", { r: 29, class: "selection-ring" }));
    if (roles.length) g.append(svgElement("text", { y: -34, class: "pointer-label" }, roles.join(" / ")));
    if (node.ltag !== undefined) g.append(svgElement("text", { y: 43, class: "node-tag" }, `L${node.ltag} / R${node.rtag}`));
    svg.append(g);
  }
  container.replaceChildren(svg);
}

function sequence(container, values) {
  container.replaceChildren(...values.map(value => { const span = document.createElement("span"); span.className = "tok"; span.textContent = value; return span; }));
  if (!values.length) container.textContent = "（尚无输出）";
}

function drawTable(frame) {
  const table = document.createElement("table");
  table.className = "pointer-table";
  table.setAttribute("aria-label", kind === "forest" ? "孩子兄弟映射表" : "当前左右指针快照");
  const tagged = mode === "threading";
  const head = document.createElement("thead"), tr = document.createElement("tr");
  for (const value of tagged ? ["节点", "left", "ltag", "right", "rtag"] : ["节点", "left", "right"]) {
    const th = document.createElement("th"); th.scope = "col"; th.textContent = value; tr.append(th);
  }
  head.append(tr); table.append(head);
  const body = document.createElement("tbody");
  for (const node of frame.nodes) {
    const row = document.createElement("tr");
    row.classList.toggle("selected", selected === node.id);
    const cell = document.createElement("td"), button = document.createElement("button");
    button.textContent = node.id; button.dataset.select = node.id;
    button.setAttribute("aria-label", `查看节点 ${node.id} 的指针`);
    cell.append(button); row.append(cell);
    for (const slot of tagged ? ["left", "ltag", "right", "rtag"] : ["left", "right"]) {
      const td = document.createElement("td");
      td.textContent = node[slot] ?? "null";
      const pointerSlot = slot === "ltag" ? "left" : slot === "rtag" ? "right" : slot;
      td.classList.toggle("changed", frame.changes.some(change => change.from === node.id && change.slot === pointerSlot));
      row.append(td);
    }
    body.append(row);
  }
  table.append(body); $("#table").replaceChildren(table);
  const id = selected ?? frame.curr;
  const node = frame.nodes.find(value => value.id === id);
  $("#inspector").textContent = node
    ? kind === "forest" ? `节点 ${id} 在两侧身份相同：left → ${node.left ?? "null"} 是第一个孩子；right → ${node.right ?? "null"} 是下一个兄弟。`
      : `${id}：left → ${node.left ?? "null"}${tagged ? `（${node.ltag ? "前驱线索" : "孩子指针"}）` : ""}；right → ${node.right ?? "null"}${tagged ? `（${node.rtag ? "后继线索" : "孩子指针"}）` : frame.temporary.includes(id) ? "（临时回边）" : ""}。`
    : "点击图中节点或表中按钮，查看当前指针含义。";
}

function render() {
  const frame = frames[index];
  const paired = kind !== "threaded";
  $("#boards").classList.toggle("single", !paired);
  $("#left-pane").hidden = !paired;
  $("#counter").textContent = `步骤 ${index}/${frames.length - 1}`;
  $("#status").textContent = phaseNames[frame.phase] ?? frame.phase;
  $("#status").classList.toggle("done", frame.phase === "done");
  $("#narration").textContent = frame.message;
  ui.timeline.value = index;
  ui.timeline.setAttribute("aria-valuetext", `第 ${index} 步，共 ${frames.length - 1} 步：${phaseNames[frame.phase]}`);
  ui.prev.disabled = index === 0; ui.next.disabled = index === frames.length - 1;
  ui.play.textContent = timer ? "❚❚ 暂停" : index === frames.length - 1 ? "▶ 重播" : "▶ 播放";
  ui.play.setAttribute("aria-pressed", String(timer !== null));
  for (const pointer of ["curr", "prev", "pred"]) $(`#${pointer}`).textContent = frame[pointer] ?? "null";
  $("#prev").closest(".stat").hidden = mode !== "threading";
  $("#pred").closest(".stat").hidden = mode !== "morris" && mode !== "flatten";
  $("#metrics").textContent = mode === "threading" ? `递归调用栈：${frame.stack.join(" → ") || "空"}；已访问 ${frame.output.length} 个节点。`
    : mode === "morris" ? `临时回边：${frame.temporary.length} 条；沿右链寻找前驱：${frame.scans} 次移动。`
      : kind === "flatten" ? `已就位：${frame.output.length}/${frame.nodes.length}；pred 总移动：${frame.scans} 次。`
        : `已同步访问：${frame.output.length}/${frame.nodes.length}；两侧序列${frame.output.join() === frame.rightOutput.join() ? "一致" : "不同"}。`;
  $("#code").querySelectorAll("li").forEach((li, i) => { li.classList.toggle("active", i === frame.line); if (i === frame.line) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current"); });
  if (kind === "forest") {
    $("#left-title").textContent = "原树 / 森林";
    $("#right-title").textContent = frame.stage < 3 ? "孩子兄弟转换过程" : "转换后的二叉树";
    $("#left-sequence-label").textContent = mode === "postorder" ? "后根 / 森林后序输出" : "先根 / 森林先序输出";
    $("#right-sequence-label").textContent = mode === "postorder" ? "二叉树中序输出" : "二叉树前序输出";
    const originalEdges = originalForestEdges();
    drawTree($("#left-tree"), source.nodes, originalEdges, originalLayout, frame);
    let edges = nodeEdges(frame.nodes, [], true);
    if (frame.stage === 0) edges = originalEdges;
    if (frame.stage === 1) edges = [...originalEdges, ...edges.filter(edge => edge.slot === "right")];
    if (frame.stage === 2) edges.push(...originalEdges.filter(edge => !edge.first).map(edge => ({ ...edge, type: "removed" })));
    drawTree($("#right-tree"), frame.nodes, edges, frame.stage < 3 ? originalLayout : binaryLayout, frame);
    sequence($("#left-sequence"), frame.output); sequence($("#right-sequence"), frame.rightOutput);
  } else {
    $("#left-title").textContent = "原树（保持不变）";
    $("#right-title").textContent = mode === "threading" ? "中序线索化现场" : mode === "morris" ? "Morris 临时指针现场" : frame.phase === "done" ? "展开后的先序右链" : "指针重连现场";
    $("#left-sequence-label").textContent = "原树先序（对照目标）";
    $("#right-sequence-label").textContent = kind === "flatten" ? "已就位的先序节点" : "已输出的中序节点";
    if (paired) {
      drawTree($("#left-tree"), source.nodes, nodeEdges(source.nodes), originalLayout, frame);
      sequence($("#left-sequence"), expectedOrder);
    }
    const layout = kind === "flatten" && frame.phase === "done" ? layoutBinary({ root: source.root, nodes: frame.nodes }) : originalLayout;
    drawTree($("#right-tree"), frame.nodes, nodeEdges(frame.nodes, frame.temporary), layout, frame, frame.changes);
    sequence($("#right-sequence"), frame.output);
  }
  drawTable(frame);
  // Expose current progress as DOM state, without publishing a mutable algorithm model.
  $("#demo").dataset.phase = frame.phase;
  $("#demo").dataset.step = index;
}

function pause(redraw = true) {
  if (timer !== null) clearInterval(timer);
  timer = null;
  if (redraw && frames.length) render();
}
function play() {
  if (timer !== null) { pause(); return; }
  if (index === frames.length - 1) index = 0;
  timer = setInterval(() => {
    index++;
    if (index >= frames.length - 1) { index = frames.length - 1; pause(false); }
    render();
  }, Number(ui.speed.value));
  render();
}
function move(to) { pause(false); index = Math.max(0, Math.min(frames.length - 1, to)); render(); }

function load() {
  pause(false); selected = null; index = 0;
  const preset = presets[presetId];
  if (kind === "forest") {
    source = preset;
    frames = forestTrace(source, mode);
    originalLayout = layoutForest(source); binaryLayout = layoutBinary(forestToBinary(source));
  } else {
    source = preset.tree;
    frames = mode === "threading" ? threadingTrace(source) : mode === "morris" ? morrisTrace(source) : flattenTrace(source);
    originalLayout = layoutBinary(source); expectedOrder = binaryOrder(source, "preorder");
  }
  ui.timeline.max = frames.length - 1;
  $("#code").replaceChildren(...code[mode].map(text => { const li = document.createElement("li"); li.textContent = text; return li; }));
  const legend = mode === "threading" ? [["child", "实线：孩子"], ["predecessor", "紫虚线：前驱"], ["successor", "青虚线：后继"]]
    : mode === "morris" ? [["child", "实线：原孩子"], ["temporary", "黄虚线：临时回边"], ["removed", "红虚线 ×：本步拆除"]]
      : kind === "forest" ? [["child", "原树孩子"], ["first-child", "青线：首孩子 / left"], ["predecessor", "紫虚线：右兄弟 / right"], ["removed", "红虚线 ×：抹去"]]
        : [["child", "原有指针"], ["added", "绿粗线：本步新增"], ["removed", "红虚线 ×：本步删除"]];
  if (kind === "threaded") legend.push(["added", "绿粗线：本步新增"]);
  $("#legend").replaceChildren(...legend.map(([type, label]) => { const span = document.createElement("span"); span.className = "key"; const swatch = document.createElement("i"); swatch.className = `swatch ${type}`; swatch.setAttribute("aria-hidden", "true"); span.append(swatch, document.createTextNode(label)); return span; }));
  $("#table-title").textContent = kind === "forest" ? "孩子兄弟映射表" : "指针快照";
  $("#table-note").textContent = mode === "threading" ? "0 = Link（孩子）；1 = Thread（线索）。指向 null 的首尾线索也会在表中标记。"
    : mode === "morris" ? "Morris 不使用 ltag/rtag；临时线索复用 right，完成时所有指针应与原树一致。"
      : kind === "forest" ? "表格始终展示最终映射：left 为第一个孩子，right 为下一个兄弟；单棵树的根没有右兄弟。"
        : "每一步都展示实际指针。重连的中间状态可能暂时有两条指针指向同一节点，下一步再清空旧 left。";
  $("#footer-note").textContent = kind === "forest" ? "两侧以“输出一个节点”为同步单位，分别执行原结构遍历和二叉树遍历；递归调用的数量与时机不必相同。"
    : mode === "threading" ? "线索化算法使用 O(h) 递归栈；线索建成后的中序遍历才可使用 O(1) 辅助空间。"
      : "这里展示的是算法自身的指针操作；为支持回退而保存的演示快照，不计入原算法的辅助空间分析。";
  if (kind === "threaded") {
    $("h1").textContent = mode === "morris" ? "Morris 遍历 · 借一条路，再还原" : "中序线索化 · 指针如何连起来";
    $(".hero p").textContent = mode === "morris"
      ? "跟随 curr 与 pred，观察空右指针如何临时成为返回路径。第一次到达建立回边，第二次到达拆除回边，结束时核对所有指针是否恢复。"
      : "逐步跟随 curr 与 prev，把空指针连向中序前驱和后继；也可切换到 Morris，观察临时回边如何建立、使用，再恢复为空。";
  }
  render();
}

ui.dataset.addEventListener("change", () => { presetId = ui.dataset.value; load(); });
ui.mode.addEventListener("change", () => { mode = ui.mode.value; load(); });
ui.play.addEventListener("click", play);
ui.prev.addEventListener("click", () => move(index - 1));
ui.next.addEventListener("click", () => move(index + 1));
$("[data-action=reset]").addEventListener("click", () => { selected = null; move(0); });
ui.timeline.addEventListener("input", () => move(Number(ui.timeline.value)));
ui.speed.addEventListener("change", () => { if (timer !== null) { pause(false); play(); } });
function selectNode(id) {
  // Rebuild only the diagrams/table; preserve focus after replacing SVG nodes.
  const active = document.activeElement;
  const boardId = active?.closest(".board")?.id;
  const wasTable = active?.hasAttribute("data-select");
  selected = id;
  pause(false); render();
  const target = boardId ? document.getElementById(boardId).querySelector(`[data-node="${CSS.escape(id)}"]`)
    : wasTable ? document.querySelector(`[data-select="${CSS.escape(id)}"]`) : null;
  target?.focus({ preventScroll: true });
}
$("#demo").addEventListener("click", event => {
  const node = event.target.closest("[data-node], [data-select]");
  if (node) selectNode(node.dataset.node ?? node.dataset.select);
});
$("#demo").addEventListener("keydown", event => {
  const node = event.target.closest("[data-node]");
  if (node && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); selectNode(node.dataset.node); }
});
document.addEventListener("keydown", event => {
  if (event.defaultPrevented || event.target.closest("input, select, button, [role=button]")) return;
  if (event.key === "ArrowRight") { event.preventDefault(); move(index + 1); }
  if (event.key === "ArrowLeft") { event.preventDefault(); move(index - 1); }
  if (event.key === " ") { event.preventDefault(); play(); }
});
document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
window.addEventListener("pagehide", () => pause(false));
load();
