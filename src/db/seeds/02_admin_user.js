/**
 * Seed default admin user for development
 *
 * Default credentials:
 *   email:    admin@example.com
 *   password: Admin1234!
 *
 * The password hash below is a bcrypt hash (cost 12) of "Admin1234!"
 */
const ADMIN_PASSWORD_HASH =
  '$2b$12$KIXn7ovFNMjwNGsEb5gWyOzVj8rJZ3lV0pq.9u1IkHfUdNfQ7Jqby';

exports.seed = async function (knex) {
  await knex('users').where({ email: 'admin@example.com' }).del();

  const [userId] = await knex('users')
    .insert({
      first_name: 'System',
      last_name: 'Admin',
      email: 'admin@example.com',
      password_hash: ADMIN_PASSWORD_HASH,
      is_active: true,
      email_verified: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    })
    .returning('id');

  const resolvedUserId = typeof userId === 'object' ? userId.id : userId;

  await knex('user_roles')
    .where({ user_id: resolvedUserId })
    .del();

  await knex('user_roles').insert({
    user_id: resolvedUserId,
    role_id: 3, // admin
    created_at: new Date('2024-01-01T00:00:00.000Z'),
  });
};
