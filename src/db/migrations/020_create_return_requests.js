exports.up = function (knex) {
  return knex.schema.createTable('return_requests', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table
      .enu(
        'status',
        ['requested', 'approved', 'rejected', 'picked_up', 'received', 'refund_initiated', 'completed'],
        { useNative: true, enumName: 'return_request_status_enum' }
      )
      .notNullable()
      .defaultTo('requested');
    table.text('reason').notNullable();
    table.text('customer_comment').nullable();
    table.text('admin_comment').nullable();
    table.jsonb('items').nullable();
    table.string('pickup_address_snapshot', 500).nullable();
    table.timestamp('requested_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('resolved_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['order_id']);
  });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('return_requests')
    .then(() => knex.raw('DROP TYPE IF EXISTS return_request_status_enum'));
};
