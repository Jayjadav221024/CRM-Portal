const mongoose = require('mongoose');

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: 150,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    company: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
      maxlength: 100,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'new',
    },
    owner: {
      type: String,
      required: [true, 'Owner is required'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    source: {
      type: String,
      enum: ['website', 'referral', 'cold-call', 'email', 'social', 'other'],
      default: 'other',
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt automatically
    // Optimize read performance by not creating _id buffer
    versionKey: false,
  }
);

// ─── Indexes for Performance ────────────────────────────────────────────────

// Text index for full-text search across name, email, company
// Weighted: name matches count more than email/company
leadSchema.index(
  { name: 'text', email: 'text', company: 'text' },
  {
    weights: { name: 3, email: 2, company: 1 },
    name: 'leads_text_search',
  }
);

// Compound index for common filter + sort combinations
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ owner: 1, createdAt: -1 });
leadSchema.index({ status: 1, owner: 1, createdAt: -1 });

// Index for sorting by name
leadSchema.index({ name: 1 });

// Index for sorting by company
leadSchema.index({ company: 1 });

// ─── Static Methods ──────────────────────────────────────────────────────────

/**
 * Build an aggregation pipeline for paginated, filtered, sorted queries.
 * Using aggregation (vs find) allows a single round-trip for both
 * the data page AND the total count via $facet.
 */
leadSchema.statics.buildListPipeline = function ({
  page = 1,
  limit = 25,
  sortField = 'createdAt',
  sortOrder = 'desc',
  status,
  owner,
  search,
}) {
  const matchStage = {};

  // Text search via MongoDB Atlas/text index
  if (search && search.trim()) {
    matchStage.$text = { $search: search.trim() };
  }

  if (status) matchStage.status = status;
  if (owner) matchStage.owner = new RegExp(`^${owner}$`, 'i');

  const ALLOWED_SORT_FIELDS = ['name', 'email', 'company', 'status', 'owner', 'createdAt'];
  const safeSortField = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : 'createdAt';
  const safeSortOrder = sortOrder === 'asc' ? 1 : -1;

  const sortStage = {};
  // When doing text search, also include text score for relevance
  if (search && search.trim()) {
    sortStage.score = { $meta: 'textScore' };
  }
  sortStage[safeSortField] = safeSortOrder;

  const skip = (Math.max(1, page) - 1) * limit;

  const pipeline = [
    // Add text score projection when searching
    ...(search && search.trim()
      ? [{ $match: matchStage }, { $addFields: { score: { $meta: 'textScore' } } }]
      : [{ $match: matchStage }]),

    {
      $facet: {
        // Data page
        data: [
          { $sort: sortStage },
          { $skip: skip },
          { $limit: limit },
          // Project only needed fields — reduces payload size
          {
            $project: {
              name: 1,
              email: 1,
              company: 1,
              status: 1,
              owner: 1,
              createdAt: 1,
              source: 1,
            },
          },
        ],
        // Total count in one aggregation call
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  return pipeline;
};

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;