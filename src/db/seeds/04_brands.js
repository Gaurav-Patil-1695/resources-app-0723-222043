/**
 * Sample brands
 */
exports.seed = async function (knex) {
  await knex('brands').del();

  await knex('brands').insert([
    {
      id: 1,
      name: 'TechNova',
      slug: 'technova',
      description: 'Innovative consumer electronics and smart devices',
      logo_url: null,
      website_url: 'https://technova.example.com',
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 2,
      name: 'UrbanThread',
      slug: 'urbanthread',
      description: 'Contemporary urban fashion for all ages',
      logo_url: null,
      website_url: 'https://urbanthread.example.com',
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 3,
      name: 'HomeBase',
      slug: 'homebase',
      description: 'Quality furniture and home accessories',
      logo_url: null,
      website_url: 'https://homebase.example.com',
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 4,
      name: 'PeakGear',
      slug: 'peakgear',
      description: 'High-performance sports and outdoor equipment',
      logo_url: null,
      website_url: 'https://peakgear.example.com',
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 5,
      name: 'SoundWave',
      slug: 'soundwave',
      description: 'Premium audio equipment and accessories',
      logo_url: null,
      website_url: 'https://soundwave.example.com',
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
    },
  ]);
};
