exports.up = function (knex) {
  return knex.schema.createTable('addresses', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('full_name', 150).notNullable();
    table.string('phone', 20).notNullable();
    table.text('line1').notNullable();
    table.text('line2').nullable();
    table.string('city', 100).notNullable();
    table.string('state', 100).notNullable();
    table.string('pin_code', 10).notNullable();
    table.string('country', 100).notNullable().defaultTo('India');
    table.boolean('is_default').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('addresses');
};
