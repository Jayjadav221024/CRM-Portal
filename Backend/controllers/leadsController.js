const Lead = require('../models/Lead');
const { paginated, success, error } = require('../utils/response');
const { withCache, invalidatePrefix } = require('../utils/cache');

// ─── List Leads ──────────────────────────────────────────────────────────────
exports.getLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      sortField = 'createdAt',
      sortOrder = 'desc',
      status,
      owner,
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Cap at 100

    // Build a deterministic cache key from all query params
    const cacheKey = `leads:list:${JSON.stringify({
      pageNum, limitNum, sortField, sortOrder, status, owner, search,
    })}`;

    const { data: result, fromCache } = await withCache(cacheKey, async () => {
      const pipeline = Lead.buildListPipeline({
        page: pageNum,
        limit: limitNum,
        sortField,
        sortOrder,
        status,
        owner,
        search,
      });

      const [facetResult] = await Lead.aggregate(pipeline).allowDiskUse(true);

      const data = facetResult?.data || [];
      const total = facetResult?.totalCount?.[0]?.count || 0;

      return { data, total };
    }, 60); // Cache list results for 60 seconds

    const { data, total } = result;
    const totalPages = Math.ceil(total / limitNum);

    return paginated(res, data, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    }, { fromCache });

  } catch (err) {
    console.error('getLeads error:', err);
    return error(res, 'Failed to fetch leads', 500, err.message);
  }
};

// ─── Get Single Lead ─────────────────────────────────────────────────────────
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).lean();
    if (!lead) return error(res, 'Lead not found', 404);
    return success(res, lead);
  } catch (err) {
    return error(res, 'Failed to fetch lead', 500, err.message);
  }
};

// ─── Create Lead ─────────────────────────────────────────────────────────────
exports.createLead = async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    invalidatePrefix('leads:'); // Bust all lead caches
    return success(res, lead, {}, 201);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return error(res, messages.join(', '), 400);
    }
    return error(res, 'Failed to create lead', 500, err.message);
  }
};

// ─── Update Lead ─────────────────────────────────────────────────────────────
exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true, lean: true }
    );
    if (!lead) return error(res, 'Lead not found', 404);
    invalidatePrefix('leads:');
    return success(res, lead);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return error(res, messages.join(', '), 400);
    }
    return error(res, 'Failed to update lead', 500, err.message);
  }
};

// ─── Delete Lead ─────────────────────────────────────────────────────────────
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return error(res, 'Lead not found', 404);
    invalidatePrefix('leads:');
    return success(res, { id: req.params.id }, { message: 'Lead deleted' });
  } catch (err) {
    return error(res, 'Failed to delete lead', 500, err.message);
  }
};

// ─── Global Search ───────────────────────────────────────────────────────────
exports.searchLeads = async (req, res) => {
  try {
    const { q, limit = 15 } = req.query;

    if (!q || q.trim().length < 2) {
      return success(res, [], { message: 'Query too short' });
    }

    const searchTerm = q.trim();
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));

    const cacheKey = `leads:search:${searchTerm}:${limitNum}`;

    const { data: results, fromCache } = await withCache(cacheKey, async () => {
      // Strategy: use $text for full-text index matching + $regex fallback
      // $text is fast (uses index), regex is used as secondary for partial matches
      const textResults = await Lead.aggregate([
        {
          $match: { $text: { $search: searchTerm } },
        },
        {
          $addFields: { score: { $meta: 'textScore' } },
        },
        { $sort: { score: -1 } },
        { $limit: limitNum },
        {
          $project: {
            name: 1, email: 1, company: 1, status: 1, owner: 1, score: 1,
          },
        },
      ]);

      // If text search returns fewer than limit, supplement with regex
      if (textResults.length < limitNum) {
        const existingIds = textResults.map((r) => r._id);
        const remaining = limitNum - textResults.length;
        const regexPattern = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        const regexResults = await Lead.find(
          {
            _id: { $nin: existingIds },
            $or: [
              { name: regexPattern },
              { email: regexPattern },
              { company: regexPattern },
            ],
          },
          { name: 1, email: 1, company: 1, status: 1, owner: 1 }
        )
          .limit(remaining)
          .lean();

        return [...textResults, ...regexResults];
      }

      return textResults;
    }, 30); // Short TTL for search — 30 seconds

    return success(res, results, { fromCache, query: searchTerm });

  } catch (err) {
    console.error('searchLeads error:', err);
    return error(res, 'Search failed', 500, err.message);
  }
};

// ─── Get Distinct Owners (for filter dropdown) ───────────────────────────────
exports.getOwners = async (req, res) => {
  try {
    const { data: owners, fromCache } = await withCache('leads:owners', async () => {
      return Lead.distinct('owner');
    }, 120); // Cache for 2 minutes

    return success(res, owners, { fromCache });
  } catch (err) {
    return error(res, 'Failed to fetch owners', 500, err.message);
  }
};

// ─── Stats / Summary ─────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const { data: stats, fromCache } = await withCache('leads:stats', async () => {
      const result = await Lead.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const total = await Lead.estimatedDocumentCount();
      return { byStatus: result, total };
    }, 120);

    return success(res, stats, { fromCache });
  } catch (err) {
    return error(res, 'Failed to fetch stats', 500, err.message);
  }
};