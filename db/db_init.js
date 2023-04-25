// (Re)Sets up the database, including a little bit of sample data
const db = require("./db_connection");

/**** Delete existing table, if any ****/

const drop_tasks_table_sql = "DROP TABLE IF EXISTS tasks;"

db.execute(drop_tasks_table_sql);

const drop_categories_table_sql = "DROP TABLE IF EXISTS categories;"

db.execute(drop_categories_table_sql);

/**** Create tables  ****/

const create_categories_table_sql = `
    CREATE TABLE categories (
        categoryId INT NOT NULL AUTO_INCREMENT,
        categoryName VARCHAR(45) NOT NULL,
        userId VARCHAR(225) NULL,
        PRIMARY KEY (categoryId));
`

db.execute(create_categories_table_sql);

const create_tasks_table_sql = `
    CREATE TABLE tasks
        taskid INT NOT NULL AUTO_INCREMENT,
        title VARCHAR(45) NOT NULL,
        priority INT NULL,
        categoryId INT NOT NULL,
        dueDate DATE NULL,
        description VARCHAR(150) NULL,
        userId VARCHAR(255) NULL,
        PRIMARY KEY (taskid),
        INDEX taskCategory_idx (categoryId ASC),
        CONSTRAINT taskCategory
            FOREIGN KEY (categoryId)
            REFERENCES categories (categoryId)
            ON DELETE RESTRICT
            ON UPDATE CASCADE);
`   
db.execute(create_tasks_table_sql);

const delete_tasks_table_sql = "DELETE FROM tasks;"

db.execute(delete_tasks_table_sql);

const delete_categories_table_sql = "DELETE FROM categories;"

db.execute(delete_categories_table_sql);

/**** Create some sample categories and tasks ****/

const insert_category_sql = `
    INSERT INTO categories 
        (categoryId, categoryName) 
    VALUES 
        (?, ?);
`

db.execute(insert_category_sql, [1, 'Work']);

db.execute(insert_category_sql, [2, 'School']);

db.execute(insert_category_sql, [3, 'Personal']);

db.execute(insert_category_sql, [4, 'Social']);

const insert_task_sql = `
    INSERT INTO tasks
        (title, priority, categoryId, dueDate, description)
    VALUES
        (?, ?, ?, ?, ? );
`

//categoryId: 2 => 'School'
db.execute(insert_task_sql, ['MUN Position Paper', 10, 2, '2023-05-26', 
        'Submit position paper to Turnitin.']);

//categoryId: 3 => 'Personal'
db.execute(insert_task_sql, ['Clean Desk', 8, 3, '2023-06-01', null]);

//categoryId: 1 => 'Work'
db.execute(insert_task_sql, ['Complete Resume', 5, 1, '2023-06-07', null]);

/**** Create some additional categories and tasks that aren't in the prototypes ****/

db.execute(insert_category_sql, [5, 'Health and Fitness']);

db.execute(insert_category_sql, [6, 'Hobbies']);

//categoryId: 1 => 'Work'
db.execute(insert_task_sql, ['Send Out Resumes', 7, 1, '2023-05-23', 'Apply to at least three places.']);

//categoryId: 4 => 'Social'
db.execute(insert_task_sql, ['Buy birthday gift for Cloe!', 1, 4, null, 'Maybe pens.']);

//categoryId: 5 => 'Health and Fitness'
db.execute(insert_task_sql, ['Go to the Gym', null, 5, '2023-06-06', null]);

//categoryId: 6 => 'Hobbies'
db.execute(insert_task_sql, ['Crochet something', null, 6, null, 'Already have project started.']);

db.end();