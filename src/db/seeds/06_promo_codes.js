/**
 * Sample promo codes
 *
 * discount_type: 'percentage' | 'fixed'
 * discount_value: integer — percentage points (e.g. 10 = 10 %) or minor currency units (e.g. 1000 = $10.00)
 * min_order_value: minimum cart total in minor currency units required to apply the code
 * max_uses: null = unlimited
 */
exports.seed = async function (knex) {
  await knex('promo_codes').del();

  await knex('promo_codes').insert([
    {
      id: 1,
      code: 'WELCOME10',
      description: '10% off your first order',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_value: 0,
      max_uses: 1000,
      uses_count: 0,
      is_active: true,
      starts_at: new Date('2024-01-01T00:00:00.000Z'),
      expires_at: new Date('2025-12-31T23:59:59.000Z'),
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 2,
      code: 'SAVE20',
      description: '20% off orders over $100',
      discount_type: 'percentage',
      discount_value: 20,
      min_order_value: 10000,
      max_uses: 500,
      uses_count: 0,
      is_active: true,
      starts_at: new Date('2024-01-01T00:00:00.000Z'),
      expires_at: new Date('2025-06-30T23:59:59.000Z'),
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 3,
      code: 'FLAT15',
      description: '$15 off any order',
      discount_type: 'fixed',
      discount_value: 1500,
      min_order_value: 5000,
      max_uses: null,
      uses_count: 0,
      is_active: true,
      starts_at: new Date('2024-01-01T00:00:00.000Z'),
      expires_at: new Date('2025-12-31T23:59:59.000Z'),
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 4,
      code: 'TECHSALE',
      description: '15% off electronics (no minimum spend)',
      discount_type: 'percentage',
      discount_value: 15,
      min_order_value: 0,
      max_uses: 200,
      uses_count: 0,
      is_active: true,
      starts_at: new Date('2024-03-01T00:00:00.000Z'),
      expires_at: new Date('2024-09-30T23:59:59.000Z'),
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 5,
      code: 'SUMMER30',
      description: '30% off fashion items over $50',
      discount_type: 'percentage',
      discount_value: 30,
      min_order_value: 5000,
      max_uses: 300,
      uses_count: 0,
      is_active: false,
      starts_at: new Date('2024-06-01T00:00:00.000Z'),
      expires_at: new Date('2024-08-31T23:59:59.000Z'),
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 6,
      code: 'VIP50',
      description: '$50 off for VIP customers on orders over $200',
      discount_type: 'fixed',
      discount_value: 5000,
      min_order_value: 20000,
      max_uses: 100,
      uses_count: 0,
      is_active: true,
      starts_at: new Date('2024-01-01T00:00:00.000Z'),
      expires_at: new Date('2025-12-31T23:59:59.000Z'),
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
  ]);
};
