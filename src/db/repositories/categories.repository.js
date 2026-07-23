const db = require('../knex');

const TABLE = 'categories';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findBySlug = (slug) =>
  db(TABLE).where({ slug }).first();

const findAll = ({ limit = 100, offset = 0 } = {}) =>
  db(TABLE).limit(limit).offset(offset);

const findRoots = () =>
  db(TABLE).whereNull('parent_id');

const findChildren = (parentId) =>
  db(TABLE).where({ parent_id: parentId });

const findDescendants = async (parentId) => {
  const results = [];
  const queue = [parentId];
  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = await db(TABLE).where({ parent_id: currentId });
    for (const child of children) {
      results.push(child);
      queue.push(child.id);
    }
  }
  return results;
};

const findAncestors = async (categoryId) => {
  const ancestors = [];
  let current = await db(TABLE).where({ id: categoryId }).first();
  while (current && current.parent_id) {
    current = await db(TABLE).where({ id: current.parent_id }).first();
    if (current) ancestors.unshift(current);
  }
  return ancestors;
};

const findBreadcrumb = async (categoryId) => {
  const ancestors = await findAncestors(categoryId);
  const self = await findById(categoryId);
  return self ? [...ancestors, self] : ancestors;
};

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

const findTree = async () => {
  const all = await db(TABLE).select('*');
  const map = {};
  const roots = [];
  for (const node of all) {
    map[node.id] = { ...node, children: [] };
  }
  for (const node of all) {
    if (node.parent_id && map[node.parent_id]) {
      map[node.parent_id].children.push(map[node.id]);
    } else if (!node.parent_id) {
      roots.push(map[node.id]);
    }
  }
  return roots;
};

module.exports = {
  findById,
  findBySlug,
  findAll,
  findRoots,
  findChildren,
  findDescendants,
  findAncestors,
  findBreadcrumb,
  create,
  updateById,
  deleteById,
  findTree,
};
