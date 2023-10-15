const express = require('express');
const nunjucks = require('nunjucks');
const bodyParser = require('body-parser');

const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

const port = 3000;
const db = new sqlite3.Database('db.sqlite');

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

db.run(`
CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo TEXT NOT NULL,
    checked BOOLEAN DEFAULT 0
  );
`);

app.get('/', async (req, res) => {
    db.all('SELECT * FROM todos ORDER BY checked ASC', [], (err, todos) => {
        if(err){
            throw err;
        }

        res.render('index.html', {
            todos
        });
    });
});

app.post('/todo', (req, res) => {
    db.run("INSERT INTO todos (todo) VALUES ($todo)", {
        $todo: req.body.todo
    });

    res
        .status(201)
        .header('HX-Trigger', 'refreshTodos')
        .render('_partials/createForm.html');
});

app.get('/todo', (req, res) => {
    db.all('SELECT * FROM todos ORDER BY checked ASC', [], (err, todos) => {
        if(err){
            throw err;
        }

        res.render('_partials/todos.html', {
            todos
        });
    });
});

app.post('/todo/:id', (req, res) => {
    const id = req.params.id;
    const checked = req.body.checked || 0;

    db.run("UPDATE todos SET checked = $checked WHERE id = $id", {
        $id: id,
        $checked: checked
    });

    res
        .status(200)
        .header('HX-Trigger', 'refreshTodos')
        .send();
});

app.delete('/todo/:id', (req, res) => {
    const id = req.params.id;

    db.run("DELETE FROM todos WHERE id = $id", {
        $id: id
    });

    res
        .status(204)
        .header('HX-Trigger', 'refreshTodos')
        .send();
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});