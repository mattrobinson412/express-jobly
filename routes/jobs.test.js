"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        company_handle: "c1",
        title: "new",
        salary: 60000,
        equity: "0.1"
    };

    test("ok for admin", async function () {
        const res = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: newJob,
        });
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });
    
    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: 50000,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                id: 25
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});


/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
            [
                {
                    companyName: "C1",
                    companyHandle: "c1",
                    title: "new",
                    salary: 100000,
                    equity: "0.2",
                    id: 1,
                },
                {
                    companyName: "C2",
                    companyHandle: "c2",
                    title: "new",
                    salary: 50000,
                    equity: "0.3",
                    id: 2,
                },
                {
                    companyName: "C3",
                    companyHandle: "c3",
                    title: "old",
                    salary: 120000,
                    equity: "0.4",
                    id: 3,
                },
            ],
        });
    });
    test("ok for minSalary", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ minSalary: 100000 });
        expect(resp.body).toEqual({
            jobs: [
                {
                    companyName: "C1",
                    companyHandle: "c1",
                    title: "new",
                    salary: 100000,
                    equity: "0.2",
                    id: 1,
                },
                {
                    companyName: "C3",
                    companyHandle: "c3",
                    title: "old",
                    salary: 120000,
                    equity: "0.4",
                    id: 3,
                },
            ],
        });
    });

    test("works: filtering on all filters", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ minSalary: 100000, title: "new" });
        expect(resp.body).toEqual({
            jobs: [
                {
                    companyName: "C1",
                    companyHandle: "c1",
                    title: "new",
                    salary: 100000,
                    equity: "0.2",
                    id: 1,
                },
            ],
        });
    });

    test("bad request if invalid filter key", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ minSalary: 100000, nope: "nope" });
        expect(resp.statusCode).toEqual(400);
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
      });
});


/************************************** GET /jobs/:handle */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get("/jobs/1");
        expect(resp.body).toEqual({
            job: {
                title: "new",
                salary: 100000,
                equity: "0.2",
                id: 1,
                company: {
                    handle: "c1",
                    name: "C1",
                    description: "Desc1",
                    numEmployees: 1,
                    logoUrl: "http://c1.img",
                },
            },
        });
    });

    test("not found for such job", async function () {
        const resp = await request(app).get('/jobs/0');
        expect(resp.statusCode).toEqual(404);
    });
});


/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .patch("/jobs/1")
            .send({
                title: "J-New",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "J-New",
                salary: 100000,
                equity: "0.2",
                companyHandle: "c1",
            },
        });
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .patch("/jobs/1")
            .send({
                title: "J-New",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch("/jobs/1")
            .send({
                title: "J-New",
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request on handle change attempt", async function () {
        const resp = await request(app)
            .patch("/jobs/1")
            .send({
                title: "J-New",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch("/jobs/1")
            .send({
                salary: "fire",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});


/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .delete("/jobs/1")
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: "1" })
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .delete("/jobs/1")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete("/jobs/1");
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for such job", async function () {
        const resp = await request(app)
            .delete("/jobs/nope")
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
})