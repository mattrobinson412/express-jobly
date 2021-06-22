"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const { findAll } = require("./company.js");
const Job = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// ========================== create() //

describe("create", async function () {
    const newJob = {
        title: "old",
        salary: 100000,
        equity: "0",
        company_handle: "c1"
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({
          ...newJob,
          id: expect.any(Number)
        });
    });
});

// ========================== findAll() //

describe("findAll", function () {
    test("works: no filter", async function () {
      let jobs = await Job.findAll();
      expect(jobs).toEqual([
        {
          id: 1,
          title: "new",
          salary: 1,
          equity: "0",
          companyHandle: 'c1',
          companyName: "C1",
        },
        {
          id: 2,
          title: "old",
          salary: 2,
          equity: "0",
          companyHandle: 'c2',
          companyName: "C2",
        },
        {
          id: 3,
          title: "new",
          salary: 3,
          equity: "0.2",
          companyHandle: 'c3',
          companyName: "C3",
        },
      ]);
    });
  
    test("works: by title", async function () {
      let jobs = await Job.findAll({ title: "new" });
      expect(jobs).toEqual([
        {
            id: 1,
            title: "new",
            salary: 1,
            equity: "0",
            companyHandle: 'c1',
            companyName: "C1",
        },
        {
            id: 3,
            title: "new",
            salary: 3,
            equity: "0.2",
            companyHandle: 'c3',
            companyName: "C3",
        },
      ]);
    });
  
    test("works: by min salary", async function () {
      let jobs = await Job.findAll({ minSalary: 2 });
      expect(jobs).toEqual([
        {
            id: 2,
            title: "old",
            salary: 2,
            equity: "0",
            companyHandle: 'c2',
            companyName: "C2"
        },
        {
            id: 3,
            title: "new",
            salary: 3,
            equity: "0.2",
            companyHandle: 'c3',
            companyName: "C3"
        },
      ]);
    });
  
    test("works: by equity", async function () {
      let jobs = await Job.findAll({ hasEquity: true });
      expect(jobs).toEqual([
        {
            id: 3,
            title: "new",
            salary: 3,
            equity: "0.2",
            companyHandle: 'c3',
            companyName: "C3",
        },
      ]);
    });
  
    test("works: empty list on nothing found", async function () {
      let jobs = await Job.findAll({ title: "nope" });
      expect(jobs).toEqual([]);
    });
  });


  // ===================== get() //

  describe("get", async function () {
    test("works", async function () {
      const job = await Job.get(1);
      expect(job).toEqual([
        {
          id: 1,
          title: "new",
          salary: 1,
          equity: "0",
          company: {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          },
        }
      ]);
    });

    test("not found if no such job", async function () {
      try {
        const job = await Job.get("nah");
      fail();

      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      };
    });
  });


  // ==================== update() //

  describe("update", async function () {
    const updateData = {
      title: "newer",
      salary: 10000,
      equity: "0.5"
    };

    test("works", async function () {
      const job = await Job.update(1, updateData);
      expect(job).toEqual({
        id: 1,
        companyHandle: "c1",
        ...updateData
      });
    });

    test("works: null fields", async function () {
      const updateDataNull = {
        title: "newer",
        salary: null,
        equity: null
      };
      let job = await Job.update(1, updateDataNull);
      expect(job).toEqual({
        id: 1,
        ...updateDataNull
      });
    });

    test("not found if no such job", async function () {
      try {
        const job = await Job.update("nah", updateData);
        fail();

      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      };
    });

    test("bad request with no data", async function () {
      try {
        const job = await Job.update(1, {});
        fail();

      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      };
    });
  });


  /************************************** remove */

  describe("remove", async function () {
    test("works", async function () {
      await Job.remove(1);
      const res = await db.query(`
        SELECT id FROM jobs WHERE id = $1`, [1]);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
      try {
        await Job.remove("nah");
        fail();

      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      };
    });
  });