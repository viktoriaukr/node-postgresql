process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testInvoice;

beforeEach(async () => {
  const cRes = await db.query(`INSERT INTO companies(code, name, description)
    VALUES ('apple', 'Apple Computer', 'Maker of OSX.') RETURNING code, name`);
  const res = await db.query(`
    INSERT INTO invoices (id, comp_code, amt, paid, paid_date)
    VALUES (1,'apple', 100, false, null)
    RETURNING id, comp_code
  `);
  testInvoice = res.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM invoices`);
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("Get a list of invoices", async () => {
    const res = await request(app).get("/invoices");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ invoices: [testInvoice] });
  });
});

describe("GET /invoices/:id", () => {
  test("Gets a single invoice", async () => {
    const res = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: 1,
        amt: 100,
        paid: false,
        add_date: "2023-10-20T05:00:00.000Z",
        paid_date: null,
        company: {
          code: "apple",
          name: "Apple Computer",
          description: "Maker of OSX.",
        },
      },
    });
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/invoices/0`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /invoices", () => {
  test("Creates a single invoice", async () => {
    const res = await request(app)
      .post("/invoices")
      .send({ comp_code: "apple", amt: 255 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        comp_code: "apple",
        amt: 255,
        add_date: "2023-10-20T05:00:00.000Z",
        id: expect.any(Number),
        paid: false,
        paid_date: null,
      },
    });
  });
});

describe("PATCH /invoices/:id", () => {
  test("Updates a single invoice", async () => {
    const res = await request(app)
      .patch(`/invoices/${testInvoice.id}`)
      .send({ comp_code: "apple", amt: 255 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        comp_code: "apple",
        amt: 255,
        add_date: "2023-10-20T05:00:00.000Z",
        id: expect.any(Number),
        paid: false,
        paid_date: null,
      },
    });
  });
  test("Responds with 404 for invalid id", async () => {
    const res = await request(app)
      .patch(`/invoices/0`)
      .send({ name: "iPhone", description: "Cell phone" });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /invoices/:id", () => {
  test("Deletes a single invoice", async () => {
    const res = await request(app).delete(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ msg: "Success" });
  });
});
