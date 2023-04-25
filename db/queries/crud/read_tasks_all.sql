SELECT 
    taskId, title, priority, tasks.categoryId as categoryId, categoryName,
    DATE_Format(dueDate, "%m/%d/%Y (%W)")
FROM
    tasks
JOIN categories
    ON tasks.categoryId = categories.categoryId