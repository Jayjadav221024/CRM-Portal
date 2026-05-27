const express = require("express");
const router = express.Router();

const Lead = require("../models/Lead");

// Global Search API
router.get("/", async (req, res) => {
  try {
    const query = req.query.q?.trim();

    // Prevent empty searches
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const results = await Lead.aggregate([
      {
        $match: {
          $text: {
            $search: query,
          },
        },
      },

      {
        $addFields: {
          score: {
            $meta: "textScore",
          },
        },
      },

      {
        $sort: {
          score: -1,
        },
      },

      {
        $limit: 10,
      },

      {
        $project: {
          name: 1,
          email: 1,
          company: 1,
          status: 1,
          owner: 1,
          createdAt: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
});

module.exports = router;