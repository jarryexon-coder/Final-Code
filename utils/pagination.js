class Pagination {
  constructor(model, query = {}, options = {}) {
    this.model = model;
    this.query = query;
    this.options = {
      page: 1,
      limit: 20,
      sort: { createdAt: -1 },
      select: '',
      populate: '',
      lean: true,
      ...options
    };
  }

  async paginate() {
    const { page, limit, sort, select, populate, lean } = this.options;
    const skip = (page - 1) * limit;

    // Build query
    const query = this.model.find(this.query);

    // Apply selections
    if (select) query.select(select);
    if (sort) query.sort(sort);
    if (skip) query.skip(skip);
    if (limit) query.limit(limit);
    if (populate) query.populate(populate);
    if (lean) query.lean();

    // Execute query and count in parallel
    const [docs, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(this.query)
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: docs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
        nextPage: hasNext ? page + 1 : null,
        prevPage: hasPrev ? page - 1 : null
      }
    };
  }

  // Advanced filtering method
  static buildFilterQuery(filters = {}) {
    const query = {};
    
    // Handle different filter types
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      
      if (value === undefined || value === null) return;
      
      switch (key) {
        case 'search':
          query.$text = { $search: value };
          break;
          
        case 'minAge':
        case 'minFantasyPoints':
        case 'minSalary':
          const numKey = key.replace('min', '').toLowerCase();
          query[numKey] = { $gte: parseFloat(value) };
          break;
          
        case 'maxAge':
        case 'maxFantasyPoints':
        case 'maxSalary':
          const maxKey = key.replace('max', '').toLowerCase();
          query[maxKey] = { ...query[maxKey], $lte: parseFloat(value) };
          break;
          
        case 'position':
        case 'team':
        case 'sport':
        case 'status':
          if (value !== 'all') {
            query[key] = value;
          }
          break;
          
        case 'positions':
          if (Array.isArray(value) && value.length > 0) {
            query.position = { $in: value };
          }
          break;
          
        case 'teams':
          if (Array.isArray(value) && value.length > 0) {
            query.team = { $in: value };
          }
          break;
          
        case 'isPremium':
          query.isPremium = value === 'true';
          break;
          
        case 'dateRange':
          if (value.start && value.end) {
            query.createdAt = {
              $gte: new Date(value.start),
              $lte: new Date(value.end)
            };
          }
          break;
          
        default:
          // For custom fields
          query[key] = value;
      }
    });
    
    return query;
  }

  // Sort builder
  static buildSort(sortBy = 'createdAt', order = 'desc') {
    const sortOrder = order === 'asc' ? 1 : -1;
    
    const sortOptions = {
      name: { name: sortOrder },
      fantasyPoints: { fantasyPoints: sortOrder },
      age: { age: sortOrder },
      salary: { salary: sortOrder },
      createdAt: { createdAt: sortOrder },
      updatedAt: { updatedAt: sortOrder },
      rank: { fantasyRank: sortOrder }
    };
    
    return sortOptions[sortBy] || { createdAt: -1 };
  }
}

export default Pagination;
