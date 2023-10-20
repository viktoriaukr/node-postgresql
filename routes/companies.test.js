process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async () => {
  const res = await db.query(`INSERT INTO companies(code, name, description)
    VALUES ('apple', 'Apple Computer', 'Maker of OSX.') RETURNING code, name`);
  testCompany = res.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Get a list of companies", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [testCompany] });
  });
});

describe("GET /companies/:code", () => {
  test("Gets a single company", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: "apple",
        description: "Maker of OSX.",
        invoices: [],
        name: "Apple Computer",
      },
    });
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/companies/0`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /companies", () => {
  test("Creates a single company", async () => {
    const res = await request(app)
      .post("/companies")
      .send({ code: "ibm", name: "IBM", description: "Big blue" });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: { code: "ibm", name: "IBM", description: "Big blue" },
    });
  });
});

describe("PATCH /companies/:code", () => {
  test("Updates a single company info", async () => {
    const res = await request(app)
      .patch(`/companies/${testCompany.code}`)
      .send({ name: "iPhone", description: "Cell phone" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: { code: "apple", name: "iPhone", description: "Cell phone" },
    });
  });
  test("Responds with 404 for invalid id", async () => {
    const res = await request(app)
      .patch(`/companies/0`)
      .send({ name: "iPhone", description: "Cell phone" });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /companies/:code", () => {
  test("Deletes a single company", async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ msg: "Success" });
  });
});
