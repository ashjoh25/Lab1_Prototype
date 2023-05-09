const DEBUG = true;

const express = require('express')
const db = require('../db/db_connection');
const fs = require("fs");
const path = require("path");

let categoriesRouter = express.Router();

const read_categories_all_alphabetical_sql = fs.readFileSync(path.join(__dirname,  "..", 
"db", "queries", "crud", "read_categories_all_alphabetical.sql"),
    {encoding : "UTF-8"});

categoriesRouter.get('/', (req, res) => {
    db.execute(read_categories_all_alphabetical_sql, [req.oidc.user.sub], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.render("categories", {categorieslist: results});
        }
    });
});

const create_category_sql = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "insert_category.sql"),
    {encoding : "UTF-8"});

categoriesRouter.post('/', (req, res) => {
    db.execute(create_category_sql, [req.body.categoryName, req.oidc.user.sub], (error, results) =>{
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/categories");
        }
    });
});

const delete_category_sql = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "delete_category.sql"),
    {encoding : "UTF-8"});

categoriesRouter.get("/categories/:id/delete", (req, res) => {
    db.execute(delete_category_sql, [req.params.id, req.oidc.user.sub], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error){
            //special error if any assignments associated with the subject
            if (error.code == "ER_ROW_IS_REFERENCED_2"){
                res.status(500).send("There are tasks still associated with that category!")
            }
            else 
                res.status(500).send(error); //Internal Server Error
        }
        else {
            res.redirect("/categories");
        }
    })
})

module.exports = categoriesRouter;