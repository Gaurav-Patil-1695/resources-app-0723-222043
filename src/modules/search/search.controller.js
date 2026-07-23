const searchService = require('./search.service');

/**
 * Handle GET /search
 * Performs full-text search with optional faceted filters
 */
async function search(req, res, next) {
  try {
    const { q, filters, page, size } = req.query;

    const parsedFilters = filters ? JSON.parse(filters) : {};
    const parsedPage = parseInt(page, 10) || 1;
    const parsedSize = parseInt(size, 10) || 10;

    const results = await searchService.search({
      query: q,
      filters: parsedFilters,
      page: parsedPage,
      size: parsedSize,
    });

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Handle GET /search/autocomplete
 * Returns autocomplete suggestions for a given query prefix
 */
async function suggest(req, res, next) {
  try {
    const { q, size } = req.query;
    const parsedSize = parseInt(size, 10) || 5;

    const suggestions = await searchService.suggest({
      query: q,
      size: parsedSize,
    });

    return res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { search, suggest };
