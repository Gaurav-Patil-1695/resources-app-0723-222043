exports.up = function (knex) {
  return knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.string('order_number', 50).notNullable().unique();
    table
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .integer('address_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('addresses')
      .onDelete('RESTRICT');
    table
      .integer('promo_code_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('promo_codes')
      .onDelete('SET NULL');
    table
      .enu(
        'status',
        [
          'pending',
          'confirmed',
          'processing',
          'shipped',
          'delivered',
          'cancelled',
          'refunded',
          'return_requested',
          'returned',
        ],
        { useNative: true, enumName: 'order_status_enum' }
      )
      .notNullable()
      .defaultTo('pending');
    table.decimal('subtotal', 12, 2).notNullable();
    table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('shipping_charge', 12, 2).notNullable().defaultTo(0);
    table.decimal('tax_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('total_amount', 12, 2).notNullable();
    table
      .enu('payment_status', ['pending', 'paid', 'failed', 'refunded'], {
        useNative: true,
        enumName: 'payment_status_enum',
      })
      .notNullable()
      .defaultTo('pending');
    table.text('customer_note').nullable();
    table.jsonb('shipping_address_snapshot').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('orders')
    .then(() =>
      knex.raw(
        'DROP TYPE IF EXISTS order_status_enum; DROP TYPE IF EXISTS payment_status_enum;'
      )
    );
};
