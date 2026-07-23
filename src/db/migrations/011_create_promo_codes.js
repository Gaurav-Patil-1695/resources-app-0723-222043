exports.up = function (knex) {
  return knex.schema.createTable('promo_codes', (table) => {
    table.increments('id').primary();
    table.string('code', 50).notNullable().unique();
    table.text('description').nullable();
    table
      .enu('discount_type', ['percentage', 'flat'], {
        useNative: true,
        enumName: 'discount_type_enum',
      })
      .notNullable();
    table.decimal('discount_value', 12, 2).notNullable();
    table.decimal('min_order_value', 12, 2).nullable();
    table.decimal('max_discount_amount', 12, 2).nullable();
    table.integer('usage_limit').unsigned().nullable();
    table.integer('usage_count').unsigned().notNullable().defaultTo(0);
    table.integer('per_user_limit').unsigned().nullable();
    table.jsonb('rules').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('valid_from').nullable();
    table.timestamp('valid_until').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('promo_codes')
    .then(() => knex.raw('DROP TYPE IF EXISTS discount_type_enum'));
};
