exports.up = function (knex) {
  return knex.schema.createTable('refunds', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table
      .integer('payment_attempt_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('payment_attempts')
      .onDelete('RESTRICT');
    table.string('gateway_refund_id', 255).nullable().unique();
    table.decimal('amount', 12, 2).notNullable();
    table
      .enu('status', ['initiated', 'processing', 'success', 'failed'], {
        useNative: true,
        enumName: 'refund_status_enum',
      })
      .notNullable()
      .defaultTo('initiated');
    table.text('reason').nullable();
    table.jsonb('gateway_response').nullable();
    table.timestamp('initiated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['order_id']);
  });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('refunds')
    .then(() => knex.raw('DROP TYPE IF EXISTS refund_status_enum'));
};
