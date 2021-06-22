const request = require("supertest");

const { sqlForPartialUpdate } = require("./sql")

const { BadRequestError } = require("../expressError");
const app = require("../app");
const db = require("../db");


// tests for 'sqlForPartialUpdate()' function //
describe("sqlForPartialUpdate function", function() {
    test('returns {setCols, values}', function () {
        const dataToUpdate = {
            firstName: 'Sam',
            lastName: 'Mono',
            email: 'glasses@gmail.com'
        };
        const jsToSql = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin"
        };
        const sqlize = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(sqlize).toEqual({
            setCols: "\"first_name\"=$1, \"last_name\"=$2, \"email\"=$3",
            values: ["Sam", "Mono", "glasses@gmail.com"]
        });
    });
});