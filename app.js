//set up the server
const DEBUG = true;
const express = require( "express" );
const logger = require("morgan");
const path = require("path");
const fs = require("fs");
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');
const dotenv = require('dotenv');
dotenv.config();

const helmet = require("helmet"); //add this
const db = require('./db/db_connection');
const res = require("express/lib/response");
const app = express();
const port = process.env.PORT || 8080;

//Configure Express to use certain HTTP headers for security
//Explicitly set the CSP to allow certain sources

  
  
// Configure Express to use EJS
app.set( "views",  path.join(__dirname , "views"));
app.set( "view engine", "ejs" );

// Configure Express to use certain HTTP headers for security
//Explicitly set the CSP to alow the source of Materialize
app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'cdnjs.cloudflare.com'],
        styleSrc: ["'self'", 'cdnjs.cloudflare.com', 'fonts.googleapis.com'],
        fontSrc: ["'self'", 'fonts.googleapis.com']
      }
    }
})); 

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
  };

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// Configure Express to parse URL-encoded POST request bodies (traditional forms)
app.use( express.urlencoded({ extended: false }) );

// define middleware that logs all incoming requests
app.use(logger("dev"));

// define middleware that serves static resources in the public directory
app.use(express.static(path.join(__dirname , 'public')));

app.use((req, res, next) => {
    res.locals.isLoggedIn = req.oidc.isAuthenticated();
    res.locals.user = req.oidc.user;
    next();
})

app.get('/authtest', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

// req.isAuthenticated is provided from the auth router
app.get('/test', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
  });

// define a route for the default home page
app.get( "/", ( req, res ) => {
    res.render('index');
});

const read_categories_all_sql = fs.readFileSync(path.join(__dirname, "db", "queries", "crud", "read_categories_all.sql"), {encoding : "UTF-8"});

// define a route for the task list page
const read_tasks_all_sql = fs.readFileSync(path.join(__dirname, "db", "queries", "crud", "read_tasks_all.sql"), {encoding : "UTF-8"});

app.get( "/stuff", ( req, res ) => {
    db.execute(read_tasks_all_sql, req.oidc.user.email, (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error2)
            res.status(500).send(error2); //Internal Server Error
        else {
            db.execute(read_categories_all_sql, (error2, results2) => {
                if (DEBUG)
                    console.log(error2 ? error2 : results2);
                if (error2)
                    res.status(500).sendStatus(error2);
                else {
                    let data = {tasklist: results, categorylist: results2}
                    res.render('tasks', data);
;                }
            })
        }
    });
} );

//define a rout for the task detail page
const read_task_detail_sql = fs.readFileSync(path.join(__dirname, "db", "queries", "crud", "read_task_detail.sql"), {encoding : "UTF-8"});


app.get( "/views/stuff/:id", requiresAuth(), ( req, res ) => {
    db.execute(read_task_detail_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else if (results.length == 0)
            res.status(404).send(`No task found with id = "${req.params.id}"` ); // NOT FOUND
        else {
            
            db.execute(read_categories_all_sql, (error2, results2) => {
                if (DEBUG)
                    console.log(error2 ? error2 : results2);
                if (error2)
                    res.status(500).send(error2); //Internal Server Error
                else {
                    let data = {task: results[0], categorylist: results2};
                    res.render('item', data);
                    // data's object structure: 
                    //  { hwlist: [
                    //     {  id: __ , title: __ , priority: __ , subject: __ ,  dueDateFormatted: __ },
                    //     {  id: __ , title: __ , priority: __ , subject: __ ,  dueDateFormatted: __ },
                    //     ...],
                    //     subjectlist : [
                    //         {subjectId: ___, subjectName: ___}, ...
                    //     ]
                    //  }
                }
            })


        }
    });
});

// define a route for task CREATE
const create_task_sql = fs.readFileSync(path.join(__dirname, "db", "queries", "crud", "create_task.sql"), {encoding : "UTF-8"});
    
app.post("/views/stuff", (req, res) => {
    db.execute(create_task_sql, [req.body.title, req.body.priority, req.body.category, req.body.dueDate, req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error);
        else {
            res.redirect(`/views/stuff/${results.insertId}`);
        }
    })
})

// define a route for assignment UPDATE
const update_task_sql = fs.readFileSync(path.join(__dirname, "db", "queries", "crud", "update_task.sql"), {encoding : "UTF-8"});

app.post("/views/stuff/:id", (req, res) => {
    db.execute(update_task_sql, [req.body.title, req.body.quantity, req.body.category, req.body.dueDate, req.body.description, req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error);
        else {
            res.redirect(`/views/stuff/${req.params.id}`);
        }
    });
});
// define a route for item DELETE
const delete_task_sql = `
    DELETE 
    FROM
        tasks
    WHERE
        id = ?
`
app.get("/views/stuff/:id/delete", requiresAuth(), ( req, res ) => {
    db.execute(delete_task_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/views/stuff");
        }
    });
});

const read_subjects_all_alphabetical_sql = `
    SELECT
        categoryId, categoryName
    FROM
        categories
    Where
        userId = ?
    ORDER BY
        categoryName ASC
`

app.get('/categories', requiresAuth(), (req, res) => {
    db.execute(read_subjects_all_alphabetical_sql, [req.oidc.user.sub], (error, results) => {
        if (DEBUG)
            console.log(error ? error : results);
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/categories");
        }
    })
});

const create_subject_sql = `
    INSERT INTO categories
        (categoryName, userId)
    VALUES
        (?, ?)
`

app.post('/categories', requiresAuth(), (req, res) => {
    db.execute(create_subject_sql, [req.body.categoryName, req.oidc.user.sub],)
})
// // define a route for item Create
// const create_item_sql = `
//     INSERT INTO stuff
//         (item, quantity, userid)
//     VALUES
//         (?, ?, ?)
// `
// app.post("/views/stuff", ( req, res ) => {
//     db.execute(create_item_sql, [req.body.name, req.body.quantity, req.oidc.user.email], (error, results) => {
//         if (error) {
//             res.status(500).send(error);} //Internal Server Error
//         else {
//             //results.insertId has the primary key (id) of the newly inserted element.
//             res.redirect(`/stuff/item/${results.insertId}`);
//         }
    
// });

// // define a route for item UPDATE
// const update_item_sql = `
//     UPDATE
//         stuff
//     SET
//         item = ?,
//         quantity = ?,
//         description = ?
//     WHERE
//         id = ?
//     AND
//         userid = ?
// `
// app.post("/views/stuff/item/:id", requiresAuth(), ( req, res ) => {
//     db.execute(update_item_sql, [req.body.name, req.body.quantity, req.body.description, req.params.id, req.oidc.user.email], (error, results) => {
//         if (error)
//             res.status(500).send(error); //Internal Server Error
//         else {
//             res.redirect(`/stuff/item/${req.params.id}`);
//         }
//     });
// })});

app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );