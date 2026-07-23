const { getElasticsearchClient } = require('../../config/elasticsearch');

const SEARCH_INDEX = process.env.ELASTICSEARCH_INDEX || 'main_index';

/**
 * Perform a full-text search with optional faceted filter aggregations.
 *
 * @param {object} params
 * @param {string} params.query        - The search query string
 * @param {object} params.filters      - Key/value map of field filters
 * @param {number} params.page         - 1-based page number
 * @param {number} params.size         - Number of results per page
 * @returns {Promise<object>}
 */
async function search({ query, filters = {}, page = 1, size = 10 }) {
  const client = getElasticsearchClient();
  const from = (page - 1) * size;

  // Build must clauses
  const mustClauses = [];

  if (query && query.trim().length > 0) {
    mustClauses.push({
      multi_match: {
        query: query.trim(),
        type: 'best_fields',
        fields: ['title^3', 'description^2', 'tags', 'content'],
        fuzziness: 'AUTO',
      },
    });
  } else {
    mustClauses.push({ match_all: {} });
  }

  // Build filter clauses from provided facets
  const filterClauses = Object.entries(filters).map(([field, value]) => {
    if (Array.isArray(value)) {
      return { terms: { [field]: value } };
    }
    return { term: { [field]: value } };
  });

  // Build aggregations for facets
  const aggregations = {
    categories: {
      terms: { field: 'category.keyword', size: 20 },
    },
    tags: {
      terms: { field: 'tags.keyword', size: 30 },
    },
    status: {
      terms: { field: 'status.keyword', size: 10 },
    },
  };

  const esQuery = {
    index: SEARCH_INDEX,
    from,
    size,
    body: {
      query: {
        bool: {
          must: mustClauses,
          filter: filterClauses,
        },
      },
      aggregations,
      highlight: {
        fields: {
          title: {},
          description: {},
          content: {},
        },
        pre_tags: ['<em>'],
        post_tags: ['</em>'],
      },
    },
  };

  const response = await client.search(esQuery);
  const hits = response.body || response;

  const total =
    typeof hits.hits.total === 'object'
      ? hits.hits.total.value
      : hits.hits.total;

  const items = hits.hits.hits.map((hit) => ({
    id: hit._id,
    score: hit._score,
    source: hit._source,
    highlight: hit.highlight || {},
  }));

  const facets = {};
  if (hits.aggregations) {
    Object.entries(hits.aggregations).forEach(([facetName, aggResult]) => {
      facets[facetName] = (aggResult.buckets || []).map((bucket) => ({
        key: bucket.key,
        count: bucket.doc_count,
      }));
    });
  }

  return {
    total,
    page,
    size,
    totalPages: Math.ceil(total / size),
    items,
    facets,
  };
}

/**
 * Return autocomplete suggestions for a query prefix.
 *
 * @param {object} params
 * @param {string} params.query  - The prefix string to complete
 * @param {number} params.size   - Maximum number of suggestions
 * @returns {Promise<object>}
 */
async function suggest({ query, size = 5 }) {
  const client = getElasticsearchClient();

  const esQuery = {
    index: SEARCH_INDEX,
    body: {
      suggest: {
        title_suggest: {
          prefix: query ? query.trim() : '',
          completion: {
            field: 'title_suggest',
            size,
            skip_duplicates: true,
            fuzzy: {
              fuzziness: 'AUTO',
            },
          },
        },
      },
      _source: ['title', 'category', 'slug'],
    },
  };

  const response = await client.search(esQuery);
  const body = response.body || response;

  const suggestions = (body.suggest.title_suggest || []).flatMap(
    (suggestion) =>
      suggestion.options.map((option) => ({
        id: option._id,
        text: option.text,
        source: option._source,
        score: option._score,
      }))
  );

  return { suggestions };
}

module.exports = { search, suggest };
