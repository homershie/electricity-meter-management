const path = require('path');
const fs = require('fs');
const jsonServer = require('json-server');

const server = jsonServer.create();
const dbFile = path.join(__dirname, 'db.json');
const router = jsonServer.router(dbFile);
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

// ---------- Helpers for DB ----------
function readNodes() {
  return router.db.get('nodes').value();
}
function writeNodes(nodes) {
  router.db.set('nodes', nodes).write();
}
function findNode(nodes, id) {
  return nodes.find(n => n.id === id);
}
function isDescendant(nodes, ancestorId, maybeDescendantId) {
  if (maybeDescendantId == null) return false;
  let cur = findNode(nodes, maybeDescendantId);
  const guard = new Set();
  while (cur) {
    if (cur.id === ancestorId) return true;
    if (cur.parent_id == null) return false;
    if (guard.has(cur.id)) return false;
    guard.add(cur.id);
    cur = findNode(nodes, cur.parent_id);
  }
  return false;
}

// ---------- Tree building (flat=false) ----------
function buildTree(nodes) {
  const byId = new Map(nodes.map(n => [n.id, { id: n.id, name: n.name, parent_id: n.parent_id, children: [] }]));
  const roots = [];

  // attach to parent
  for (const n of nodes) {
    const node = byId.get(n.id);
    if (n.parent_id == null) {
      roots.push(node);
    } else {
      const parent = byId.get(n.parent_id);
      if (parent) parent.children.push(node);
      else roots.push(node); // dangling parent -> treat as root
    }
  }

  // annotate depth
  const annotateDepth = (node, depth) => {
    node.depth = depth;
    for (const child of node.children) annotateDepth(child, depth + 1);
  };
  for (const r of roots) annotateDepth(r, 1);

  // Remove parent_id in final payload to match sample exactly
  const stripParentId = (node) => {
    const { id, name, depth, children } = node;
    return {
      id, name, depth,
      children: children.map(stripParentId)
    };
  };
  return roots.map(stripParentId);
}

// ---------- Custom GET /nodes with ?flat=boolean ----------
server.get('/nodes', (req, res, next) => {
  const flatParam = req.query.flat;
  // default = true for backward compatibility
  const flat = (flatParam === undefined) ? true : !(String(flatParam).toLowerCase() === 'false' || String(flatParam) === '0');

  if (flat) {
    // Delegate to default router (flat array)
    return router.db.get('nodes').value()
      ? res.jsonp(readNodes())
      : res.jsonp([]);
  } else {
    const nodes = readNodes();
    const forest = buildTree(nodes);
    // If only a single root, return object; otherwise return array of roots
    if (forest.length === 1) return res.jsonp(forest[0]);
    return res.jsonp(forest);
  }
});

// ---------- Custom PATCH /nodes/move ----------
server.patch('/nodes/move', (req, res) => {
  const { target_parent_id, node_ids } = req.body || {};

  if (!Array.isArray(node_ids) || node_ids.length === 0) {
    return res.status(400).jsonp({ success: false, error: 'node_ids must be a non-empty array' });
  }

  const nodes = readNodes();

  if (target_parent_id !== null) {
    const target = findNode(nodes, Number(target_parent_id));
    if (!target) {
      return res.status(400).jsonp({ success: false, error: 'target_parent_id does not exist' });
    }
  }

  for (const id of node_ids) {
    const node = findNode(nodes, Number(id));
    if (!node) {
      return res.status(400).jsonp({ success: false, error: `node ${id} not found` });
    }
    if (target_parent_id === node.id) {
      return res.status(400).jsonp({ success: false, error: 'Cannot move node under itself' });
    }
    if (isDescendant(nodes, node.id, target_parent_id)) {
      return res.status(400).jsonp({ success: false, error: 'Cannot move node under its own descendant' });
    }
  }

  const moved = [];
  const idSet = new Set(node_ids.map(Number));
  const newNodes = nodes.map(n => {
    if (idSet.has(n.id)) {
      moved.push(n.id);
      return { ...n, parent_id: target_parent_id };
    }
    return n;
  });

  writeNodes(newNodes);
  return res.jsonp({ success: true, moved });
});

// ---------- Fallback default routes (for other resources) ----------
server.use(router);

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`JSON Server with custom routes is running on http://localhost:${port}`);
});