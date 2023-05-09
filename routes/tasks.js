const DEBUG = true;

const express = require('express')
const db = require('/db/db_connection');
const fs = require("fs");
const path = require("path");

let tasksRouter = express.Router();

const read_categories_all_sql = fs.readFileSync(path.join(__dirname, "..", 
                                "db", "queries", "crud", "read_categories_all.sql"),
                                {encoding : "UTF-8"});

// define a route for the assignment list page
const read_tasks_all_sql = fs.readFileSync(path.join(__dirname, "..", 
                                    "db", "queries", "crud", "read_tasks_all.sql"),
                                    {encoding : "UTF-8"});

assignmentsRouter.get("/",  ( req, res ) => {
    
    db.execute(read_tasks_all_sql, [req.oidc.user.sub], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            //make second follow up query before responding
            db.execute(read_categories_all_sql, [req.oidc.user.sub], (error2, results2) => {
                if (DEBUG)
                    console.log(error2 ? error2 : results2);
                if (error2)
                    res.status(500).send(error2); //Internal Server Error
                else {
                    let data = {tasklist: results, categorylist: results2}; // results is still an array, get first (only) element
                    res.render('tasks', data); 
                    // What's passed to the rendered view: 
                    //  hwlist: [
                    //     { assignmentId: __ , title: __ , priority: __ , subjectName: __ , subjectId: __ ,  dueDateFormatted: __ },
                    //     { assignmentId: __ , title: __ , priority: __ , subjectName: __ , subjectId: __ ,   dueDateFormatted: __ },
                    //     ...                    
                    //  ]
                    //  subjectlist : [
                    //     {subjectId: ___, subjectName: ___}, ...
                    //  ]
                    //  
                }
            });
        }
    });
});

// define a route for the assignment detail page
const read_task_detail_sql = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "read_task_detail.sql"),
    {encoding : "UTF-8"});

tasksRouter.get( "/:id",  ( req, res ) => {
    db.execute(read_task_detail_sql, [req.params.id, req.oidc.user.sub], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else if (results.length == 0)
            res.status(404).send(`No assignment found with id = "${req.params.id}"` ); // NOT FOUND
        else {
            //make second follow up query before responding
            db.execute(read_categories_all_sql,[req.oidc.user.sub], (error2, results2) => {
                if (DEBUG)
                    console.log(error2 ? error2 : results2);
                if (error2)
                    res.status(500).send(error2); //Internal Server Error
                else {
                    let data = {task: results[0], categorylist: results2}; // results is still an array, get first (only) element
                    res.render('detail', data); 
                    // What's passed to the rendered view: 
                    //  hw: { id: ___ , title: ___ , priority: ___ , 
                    //    subject: ___ , dueDateExtended: ___ , 
                    //    dueDateYMD: ___ , description: ___ 
                    //  }
                    //  subjectlist : [
                    //     {subjectId: ___, subjectName: ___}, ...
                    //  ]
                    //  

                }
            });
        }
    });
});

// define a route for assignment CREATE
const create_task_sql = fs.readFileSync(path.join(__dirname, "..", 
    "db", "queries", "crud", "insert_task.sql"),
    {encoding : "UTF-8"});

tasksRouter.post("/", ( req, res ) => {
    db.execute(create_task_sql, [req.body.title, req.body.priority, req.body.categoryId, eq.body.dueDate, req.oidc.user.sub], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            //results.insertId has the primary key (assignmentId) of the newly inserted row.
            res.redirect(`/tasks/${results.insertId}`);
        }
    });
});

// define a route for assignment UPDATE
const update_task_sql = fs.readFileSync(path.join(__dirname, "..", 
                                "db", "queries", "crud", "update_task.sql"),
                                {encoding : "UTF-8"});

tasksRouter.post("/:id", ( req, res ) => {
    db.execute(update_task_sql, [req.body.title, req.body.priority, req.body.categoryId, req.body.dueDate, req.body.description, req.params.id], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/tasks/${req.params.id}`);
        }
    });
});

// define a route for task DELETE
const delete_task_sql = fs.readFileSync(path.join(__dirname, "..",
    "db", "queries", "crud", "delete_task.sql"),
    {encoding : "UTF-8"});

tasksRouter.get("/:id/delete",  ( req, res ) => {
    db.execute(delete_task_sql, [req.params.id, req.oidc.user.sub], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/tasks");
        }
    });
});
    
module.exports = tasksRouter;