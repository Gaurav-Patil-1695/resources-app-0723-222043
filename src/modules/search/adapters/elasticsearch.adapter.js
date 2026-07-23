'use strict';

const { Client } = require('@elastic/elasticsearch');

/**
 * Elasticsearch adapter — client wrapper, index mapping helpers, and query builders.
 */

let clientInstance = null;

/**
 * Returns a singleton Elasticsearch client.
 *
 * @returns {Client}
 */
function getClient() {
  if (!clientInstance) {
    const node = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
    const username = process.env.ELASTICSEARCH_USERNAME || '';
    const password = process.env.ELASTICSEARCH_PASSWORD || '';

    const options = { node };

    if (username && password) {
      options.auth = { username, password };
    }

    clientInstance = new Client(options);
  }

  return clientInstance;
}

// ---------------------------------------------------------------------------
// Index mapping helpers
// ---------------------------------------------------------------------------

/**
 * Creates an index with the provided mapping if it does not already exist.
 *
 * @param {string} index - Index name.
 * @param {object} mapping - Elasticsearch mapping object ({ properties: { ... } }).
 * @param {object} [settings] - Optional index settings.
 * @returns {Promise<object>}
 */
async function createIndex(index, mapping, settings = {}) {
  const client = getClient();

  const exists = await client.indices.exists({ index });
  if (exists) {
    return { acknowledged: true, alreadyExists: true };
  }

  const body = { mappings: mapping };
  if (Object.keys(settings).length > 0) {
    body.settings = settings;
  }

  return client.indices.create({ index, body });
}

/**
 * Deletes an index.
 *
 * @param {string} index
 * @returns {Promise<object>}
 */
async function deleteIndex(index) {
  const client = getClient();
  return client.indices.delete({ index });
}

/**
 * Puts (updates) the mapping for an existing index.
 *
 * @param {string} index
 * @param {object} mapping - { properties: { ... } }
 * @returns {Promise<object>}
 */
async function putMapping(index, mapping) {
  const client = getClient();
  return client.indices.putMapping({ index, body: mapping });
}

/**
 * Retrieves the mapping for an index.
 *
 * @param {string} index
 * @returns {Promise<object>}
 */
async function getMapping(index) {
  const client = getClient();
  return client.indices.getMapping({ index });
}

/**
 * Refreshes an index so that recently indexed documents become searchable.
 *
 * @param {string} index
 * @returns {Promise<object>}
 */
async function refreshIndex(index) {
  const client = getClient();
  return client.indices.refresh({ index });
}

// ---------------------------------------------------------------------------
// Document helpers
// ---------------------------------------------------------------------------

/**
 * Indexes (upserts) a single document.
 *
 * @param {string} index
 * @param {string|number} id
 * @param {object} document
 * @returns {Promise<object>}
 */
async function indexDocument(index, id, document) {
  const client = getClient();
  return client.index({ index, id: String(id), body: document });
}

/**
 * Bulk-indexes an array of documents.
 * Each item should have { id, document } shape.
 *
 * @param {string} index
 * @param {Array<{ id: string|number, document: object }>} items
 * @returns {Promise<object>}
 */
async function bulkIndex(index, items) {
  if (!items || items.length === 0) {
    return { errors: false, items: [] };
  }

  const client = getClient();

  const body = items.flatMap(({ id, document }) => [
    { index: { _index: index, _id: String(id) } },
    document,
  ]);

  return client.bulk({ refresh: false, body });
}

/**
 * Deletes a document by id.
 *
 * @param {string} index
 * @param {string|number} id
 * @returns {Promise<object>}
 */
async function deleteDocument(index, id) {
  const client = getClient();
  return client.delete({ index, id: String(id) });
}

// ---------------------------------------------------------------------------
// Query builders
// ---------------------------------------------------------------------------

/**
 * Builds a simple multi-field full-text match query.
 *
 * @param {string} queryText - The search string.
 * @param {string[]} fields - Fields to search across.
 * @param {object} [options]
 * @param {string} [options.operator='or'] - 'and' | 'or'
 * @param {string} [options.fuzziness='AUTO'] - Fuzziness value.
 * @returns {object} Elasticsearch query DSL object.
 */
function buildMultiMatchQuery(queryText, fields, options = {}) {
  const { operator = 'or', fuzziness = 'AUTO' } = options;

  return {
    multi_match: {
      query: queryText,
      fields,
      operator,
      fuzziness,
    },
  };
}

/**
 * Builds a term query (exact match on keyword fields).
 *
 * @param {string} field
 * @param {*} value
 * @returns {object}
 */
function buildTermQuery(field, value) {
  return { term: { [field]: value } };
}

/**
 * Builds a terms query (match any of several values).
 *
 * @param {string} field
 * @param {Array<*>} values
 * @returns {object}
 */
function buildTermsQuery(field, values) {
  return { terms: { [field]: values } };
}

/**
 * Builds a range query.
 *
 * @param {string} field
 * @param {object} range - Any combination of { gte, gt, lte, lt }.
 * @returns {object}
 */
function buildRangeQuery(field, range) {
  return { range: { [field]: range } };
}

/**
 * Builds a bool query combining must, should, filter, and must_not clauses.
 *
 * @param {object} clauses
 * @param {object[]} [clauses.must]
 * @param {object[]} [clauses.should]
 * @param {object[]} [clauses.filter]
 * @param {object[]} [clauses.mustNot]
 * @param {number}   [clauses.minimumShouldMatch]
 * @returns {object}
 */
function buildBoolQuery({
  must = [],
  should = [],
  filter = [],
  mustNot = [],
  minimumShouldMatch,
} = {}) {
  const bool = {};

  if (must.length > 0) bool.must = must;
  if (should.length > 0) {
    bool.should = should;
    if (minimumShouldMatch !== undefined) {
      bool.minimum_should_match = minimumShouldMatch;
    }
  }
  if (filter.length > 0) bool.filter = filter;
  if (mustNot.length > 0) bool.must_not = mustNot;

  return { bool };
}

/**
 * Builds a nested query.
 *
 * @param {string} path - Nested path.
 * @param {object} query - Inner query.
 * @param {string} [scoreMode='avg']
 * @returns {object}
 */
function buildNestedQuery(path, query, scoreMode = 'avg') {
  return { nested: { path, query, score_mode: scoreMode } };
}

/**
 * Builds a match_all query.
 *
 * @returns {object}
 */
function buildMatchAllQuery() {
  return { match_all: {} };
}

/**
 * Builds a standard pagination/sort wrapper around a query.
 *
 * @param {object} query - Elasticsearch query DSL object.
 * @param {object} [options]
 * @param {number} [options.from=0]
 * @param {number} [options.size=10]
 * @param {Array<object>} [options.sort=[]] - e.g. [{ created_at: { order: 'desc' } }]
 * @param {string[]} [options.sourceIncludes] - Fields to include in _source.
 * @param {string[]} [options.sourceExcludes] - Fields to exclude from _source.
 * @returns {object} Full request body.
 */
function buildSearchBody(query, options = {}) {
  const {
    from = 0,
    size = 10,
    sort = [],
    sourceIncludes,
    sourceExcludes,
  } = options;

  const body = { query, from, size };

  if (sort.length > 0) {
    body.sort = sort;
  }

  if (sourceIncludes || sourceExcludes) {
    body._source = {};
    if (sourceIncludes) body._source.includes = sourceIncludes;
    if (sourceExcludes) body._source.excludes = sourceExcludes;
  }

  return body;
}

// ---------------------------------------------------------------------------
// Search execution
// ---------------------------------------------------------------------------

/**
 * Executes a search request.
 *
 * @param {string} index
 * @param {object} body - Full Elasticsearch request body.
 * @returns {Promise<{ total: number, hits: Array<{ id: string, score: number, source: object }> }>}
 */
async function search(index, body) {
  const client = getClient();
  const response = await client.search({ index, body });

  const hitsWrapper = response.hits || response.body?.hits;
  const total =
    typeof hitsWrapper.total === 'number'
      ? hitsWrapper.total
      : hitsWrapper.total?.value ?? 0;

  const hits = (hitsWrapper.hits || []).map((hit) => ({
    id: hit._id,
    score: hit._score,
    source: hit._source,
  }));

  return { total, hits };
}

/**
 * Counts documents matching a query.
 *
 * @param {string} index
 * @param {object} query - Elasticsearch query DSL object.
 * @returns {Promise<number>}
 */
async function count(index, query) {
  const client = getClient();
  const response = await client.count({ index, body: { query } });
  return response.count ?? response.body?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Client
  getClient,

  // Index mapping helpers
  createIndex,
  deleteIndex,
  putMapping,
  getMapping,
  refreshIndex,

  // Document helpers
  indexDocument,
  bulkIndex,
  deleteDocument,

  // Query builders
  buildMultiMatchQuery,
  buildTermQuery,
  buildTermsQuery,
  buildRangeQuery,
  buildBoolQuery,
  buildNestedQuery,
  buildMatchAllQuery,
  buildSearchBody,

  // Search execution
  search,
  count,
};
