const express = require("express");
const router = express.Router();
const movieDemoController = require("../controllers/movieDemoController");

// Các API chuẩn cho Frontend MyFlix
router.get("/home", movieDemoController.getHomeData);
router.get("/movie/:slug", movieDemoController.getMovieDetail);
router.get("/danh-sach/:slug", movieDemoController.getListBySlug);
router.get("/the-loai/:slug", movieDemoController.getListBySlug);
router.get("/category/:slug", movieDemoController.getListBySlug);
router.get("/search", movieDemoController.searchMovies);

module.exports = router;
