"use strict";

const db = require("../db");
const{ BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


// Related functions for jobs. //

class Job {
    /* Create a job (from data), update db, return new job data.
    *
    * data should be { title, salary, equity, company_handle }
    *
    * Returns { id, title, salary, equity, company_handle }
    *
    * */

    static async create({ title, salary, equity, company_handle }) {
        const res = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle`,
            [
                title,
                salary,
                equity,
                company_handle
            ],
        );
        const job = res.rows[0];

        return job;
    }

    /* Find all jobs.
    *
    * Returns [{ id, title, salary, equity, company_handle }, ...]
    * Filters by query parameter.
    * */

    static async findAll({ minSalary, equity, title } = {}) {
        let jobRes = await db.query(
            `SELECT j.id,
                    j.title,
                    j.salary,
                    j.equity,
                    j.company_handle AS "companyHandle", 
                    c.name AS "companyName"                
                    FROM jobs j
                    LEFT JOIN companies AS c ON c.handle =
                    j.company_handle`);
        let expressions = [];
        let queryVals = [];

        if (title !== undefined) {
            queryVals.push(`%${title}%`);
            expressions.push(`name ILIKE $${queryVals.length}`);
        }

        if (minSalary !== undefined) {
            queryVals.push(minSalary);
            expressions.push(`salary >= $${queryVals.length}`);
        }

        if (equity === true) {
            queryVals.push(equity);
            expressions.push(`equity > 0`)
        }

        if (expressions.length > 0) {
            jobRes += " WHERE " + expressions.join(" AND ");
        }

        // Finalize and return results

        jobRes += " ORDER BY title ";
        const res = await db.query(jobRes, queryVals);
        return res.rows;
    }


    /** Given a job id, return data about job.
     *
     * Returns { id, title, salary, equity, companyHandle }
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const res = await db.query(`
            SELECT id,
                   title,
                   salary,
                   equity,
                   company_handle AS "companyHandle"
                FROM jobs
                WHERE id=$1`,
            [id]);
        
        const job = res.rows[0];
        if (!job) throw new NotFoundError(`No job: ${id}`);

        const companiesRes = await db.query(
            `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
             FROM companies
             WHERE handle = $1`, [job.companyHandle]);
  
        delete job.companyHandle;
        job.company = companiesRes.rows[0];

        return job;
    }


    /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

    static async update(id, data) {
        const { setCols, values} = sqlForPartialUpdate(
            data,{});
        const handleVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                          SET ${setCols}
                          WHERE id = ${handleVarIdx}
                          RETURNING id,
                                    title,
                                    salary,
                                    equity,
                                    company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    static async remove(id) {
        const res = await db.query(
            `DELETE
            FROM jobs
            WHERE id = $1
            RETURNING id`,
            [id]);
        const job = res.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}



module.exports = Job;