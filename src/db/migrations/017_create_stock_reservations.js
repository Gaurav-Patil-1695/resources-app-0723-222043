exports.up = function (knex) {
  return knex.schema.createTable('stock_reservations', (table) => {
    table.increments('id').primary();
    table
      .integer('sku_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('skus')
      .onDelete('CASCADE');
    table
      .integer('order_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('orders')
      .onDelete('SET NULL');
    table.integer('quantity').unsigned().notNullable();
    table
      .enu('status', ['reserved', 'confirmed', 'released'], {
        useNative: true,
        enumName: 'reservation_status_enum',
      })
      .notNullable()
      .defaultTo('reserved');
    table.timestamp('expires_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['sku_id']);
    table.index(['order_id']);
  });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('stock_reservations')
    .then(() => knex.raw('DROP TYPE IF EXISTS reservation_status_enum'));
};
