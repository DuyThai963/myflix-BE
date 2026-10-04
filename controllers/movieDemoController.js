const { MOCK_MOVIES } = require("../data/mockMovies");

// Helper: Phân trang mảng dữ liệu chuẩn schema PhimAPI cũ
function paginate(array, page = 1, limit = 12) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, parseInt(limit, 10) || 12);
  const startIndex = (p - 1) * l;
  const items = array.slice(startIndex, startIndex + l);
  const totalItems = array.length;

  return {
    items,
    params: {
      pagination: {
        totalItems,
        totalItemsPerPage: l,
        currentPage: p,
        pageRanges: 5
      }
    }
  };
}

// 1. GET /api/home - Trang chủ
exports.getHomeData = (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const { items, params } = paginate(MOCK_MOVIES, page, 12);

    return res.status(200).json({
      status: true,
      msg: "Demo Showcase API (Open Source Media)",
      data: {
        seoOnPage: {
          titleHead: "MyFlix - Xem Phim Trực Tuyến & Xem Chung Realtime",
          descriptionHead: "Dự án xem phim demo chuẩn Portfolio không dính bản quyền",
          og_image: [MOCK_MOVIES[0].poster_url]
        },
        items: items,
        params: params.pagination
      }
    });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

// 2. GET /api/movie/:slug - Chi tiết phim & danh sách tập phát stream
exports.getMovieDetail = (req, res) => {
  try {
    const { slug } = req.params;
    let movie = MOCK_MOVIES.find((m) => m.slug === slug);

    // Fallback nếu không tìm thấy slug cụ thể để player không bị vỡ
    if (!movie) {
      movie = MOCK_MOVIES[0];
    }

    return res.status(200).json({
      status: true,
      msg: "success",
      movie: movie,
      episodes: movie.episodes,
      data: {
        item: movie,
        movie: movie,
        episodes: movie.episodes
      }
    });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

// 3. GET /api/danh-sach/:slug hoặc /api/category/:slug
exports.getListBySlug = (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 12 } = req.query;

    let filtered = [...MOCK_MOVIES];

    if (slug === "phim-bo" || slug === "tv-shows") {
      filtered = filtered.filter((m) => m.type === "series");
    } else if (slug === "phim-le") {
      filtered = filtered.filter((m) => m.type === "single");
    } else if (slug === "hoat-hinh") {
      filtered = filtered.filter((m) =>
        m.category.some((c) => c.slug === "hoat-hinh")
      );
    } else {
      // Tìm theo slug thể loại tương ứng
      const byCategory = filtered.filter((m) =>
        m.category.some((c) => c.slug === slug)
      );
      if (byCategory.length > 0) {
        filtered = byCategory;
      }
    }

    if (filtered.length === 0) {
      filtered = MOCK_MOVIES;
    }

    const { items, params } = paginate(filtered, page, limit);

    return res.status(200).json({
      status: true,
      msg: "success",
      data: {
        titlePage: "Danh sách " + slug,
        items: items,
        params: params.pagination
      }
    });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

// 4. GET /api/search?keyword=...
exports.searchMovies = (req, res) => {
  try {
    const keyword = (req.query.keyword || req.query.q || "").toLowerCase().trim();
    const { page = 1, limit = 12 } = req.query;

    let matched = MOCK_MOVIES;
    if (keyword) {
      matched = MOCK_MOVIES.filter(
        (m) =>
          m.name.toLowerCase().includes(keyword) ||
          m.origin_name.toLowerCase().includes(keyword) ||
          m.content.toLowerCase().includes(keyword)
      );
    }

    const { items, params } = paginate(matched, page, limit);

    return res.status(200).json({
      status: true,
      msg: "success",
      data: {
        titlePage: 'Kết quả tìm kiếm cho: "' + keyword + '"',
        items: items,
        params: params.pagination
      }
    });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};
