const express = require("express");
const ExpressError = require("../expressError");
const router = new express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT id, comp_code FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (e) {
    return next(e);
  }
});

//{invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(
      `SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, i.comp_code, c.name, c.description FROM invoices AS i INNER JOIN companies AS c ON (i.comp_code = c.code) WHERE id=$1`,
      [id]
    );
    if (results.rows.length === 0) {
      throw new ExpressError("Invalid company code, page not found", 404);
    }

    let data = results.rows[0];
    let invoice = {
      id: data.id,
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
    };
    return res.json({ invoice: invoice });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );
    return res.json({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt } = req.body;
    const results = await db.query(
      `UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, id]
    );
    if (results.rows.length === 0) {
      throw new ExpressError("Invalid company code, page not found", 404);
    }
    return res.json({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// Updated code for further study section

// router.patch("/:id", async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { amt, paid } = req.body;
//     let paidDate = null;
//     const curr = await db.query(`SELECT paid  FROM invoices WHERE id = $1`, [
//       id,
//     ]);
//     if (curr.rows.length === 0) {
//       throw new ExpressError("Invalid company code, page not found", 404);
//     }
//     let currentDate = curr.rows[0].paid_date;
//     if (!currentDate && paid) {
//       paidDate = new Date();
//     } else if (!paid) {
//       paidDate = null;
//     } else {
//       paidDate = currentDate;
//     }
//     const results = await db.query(
//       `UPDATE invoices SET amt = $1, paid=$2, paid_date=$3 WHERE id = $4 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
//       [amt, paid, paidDate, id]
//     );
//     return res.json({ invoice: results.rows[0] });
//   } catch (e) {
//     return next(e);
//   }
// });

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(`DELETE FROM invoices WHERE id=$1`, [id]);
    return res.json({ msg: "Success" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
