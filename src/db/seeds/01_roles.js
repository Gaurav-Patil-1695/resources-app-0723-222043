/**
 * Seed default roles: customer, staff, admin
 */
exports.seed = async function (knex) {
  await knex('roles').del();

  await knex('roles').insert([
    {
      id: 1,
      name: 'customer',
      description: 'Regular customer with shopping privileges',
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 2,
      name: 'staff',
      description: 'Staff member with order and product management access',
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 3,
      name: 'admin',
      description: 'Administrator with full system access',
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
  ]);
};
