const express = require("express");
const ExpressError = require("../expressError");
const router = new express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT i.code AS industry_code, i.industry, ARRAY_AGG(b.comp_code) AS company_codes
      FROM industries AS i
      LEFT JOIN branches AS b ON i.code = b.industry_code
      GROUP BY i.code, i.industry;`
    );
    return res.json({ industries: results.rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    const results = await db.query(
      `INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry`,
      [code, industry]
    );
    return res.json({ industry: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
