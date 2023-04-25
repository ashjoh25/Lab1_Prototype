SELECT
    taskId, title, priority, tasks.categoryId as categoryId, categoryName,
    DATE_FORMAT(dueDate, "%W, %M %D %Y") AS dueDateExtended,
    DATE_FORMAT(dueDate, "%Y-%m-%d") AS dueDateYMD,
    description
FROM
    tasks
JOIN categories
    ON tasks.categoryId = categories.categoryId
WHERE
    taskId = ?