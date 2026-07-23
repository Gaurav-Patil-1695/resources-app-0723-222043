/**
 * Sample category tree
 *
 * Structure:
 *   Electronics
 *     └── Phones & Tablets
 *     └── Computers & Laptops
 *     └── Audio
 *   Fashion
 *     └── Men
 *     └── Women
 *     └── Kids
 *   Home & Garden
 *     └── Furniture
 *     └── Kitchen
 *   Sports & Outdoors
 *     └── Fitness
 *     └── Camping
 */
exports.seed = async function (knex) {
  await knex('categories').del();

  // Root categories
  await knex('categories').insert([
    {
      id: 1,
      name: 'Electronics',
      slug: 'electronics',
      parent_id: null,
      sort_order: 1,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 2,
      name: 'Fashion',
      slug: 'fashion',
      parent_id: null,
      sort_order: 2,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 3,
      name: 'Home & Garden',
      slug: 'home-garden',
      parent_id: null,
      sort_order: 3,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 4,
      name: 'Sports & Outdoors',
      slug: 'sports-outdoors',
      parent_id: null,
      sort_order: 4,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
  ]);

  // Child categories
  await knex('categories').insert([
    // Electronics children
    {
      id: 10,
      name: 'Phones & Tablets',
      slug: 'phones-tablets',
      parent_id: 1,
      sort_order: 1,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 11,
      name: 'Computers & Laptops',
      slug: 'computers-laptops',
      parent_id: 1,
      sort_order: 2,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 12,
      name: 'Audio',
      slug: 'audio',
      parent_id: 1,
      sort_order: 3,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    // Fashion children
    {
      id: 20,
      name: 'Men',
      slug: 'fashion-men',
      parent_id: 2,
      sort_order: 1,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 21,
      name: 'Women',
      slug: 'fashion-women',
      parent_id: 2,
      sort_order: 2,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 22,
      name: 'Kids',
      slug: 'fashion-kids',
      parent_id: 2,
      sort_order: 3,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    // Home & Garden children
    {
      id: 30,
      name: 'Furniture',
      slug: 'furniture',
      parent_id: 3,
      sort_order: 1,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 31,
      name: 'Kitchen',
      slug: 'kitchen',
      parent_id: 3,
      sort_order: 2,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    // Sports & Outdoors children
    {
      id: 40,
      name: 'Fitness',
      slug: 'fitness',
      parent_id: 4,
      sort_order: 1,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 41,
      name: 'Camping',
      slug: 'camping',
      parent_id: 4,
      sort_order: 2,
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
  ]);
};
