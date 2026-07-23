exports.up = function (knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .enu(
        'type',
        [
          'order_confirmed',
          'order_shipped',
          'order_delivered',
          'order_cancelled',
          'payment_success',
          'payment_failed',
          'refund_initiated',
          'refund_completed',
          'return_update',
          'promotional',
          'system',
        ],
        { useNative: true, enumName: 'notification_type_enum' }
      )
      .notNullable();
    table.string('title', 255).notNullable();
    table.text('body').notNullable();
    table.jsonb('data').nullable();
    table
      .enu('channel', ['email', 'sms', 'push', 'in_app'], {
        useNative: true,
        enumName: 'notification_channel_enum',
      })
      .notNullable();
    table.boolean('is_read').notNullable().defaultTo(false);
    table.boolean('is_broadcast').notNullable().defaultTo(false);
    table
      .enu('delivery_status', ['pending', 'sent', 'failed'], {
        useNative: true,
        enumName: 'notification_delivery_status_enum',
      })
      .notNullable()
      .defaultTo('pending');
    table.timestamp('read_at').nullable();
    table.timestamp('sent_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['user_id']);
    table.index(['is_broadcast']);
  });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('notifications')
    .then(() =>
      knex.raw(
        'DROP TYPE IF EXISTS notification_type_enum; DROP TYPE IF EXISTS notification_channel_enum; DROP TYPE IF EXISTS notification_delivery_status_enum;'
      )
    );
};
