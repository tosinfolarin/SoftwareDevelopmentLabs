const db = require('../services/db');
const { Programme } = require('./programme');

async function getAllProgrammes() {
    var sql = "SELECT * from Programmes"
    const results = await db.query(sql);
    var rows = [];
    for (var row of results) {
    	    // Use our Programme class to neatly format the object going to the template
        rows.push(new Programme(row.id, row.name));
    }
    return rows;
}

module.exports = {
   getAllProgrammes,
}