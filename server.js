const apiFenix = require('./api_fenix');
const express = require('express')
const app = express()

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://masters.goncalo-midoes.engineer/"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/api/masters', (req, res) => {
    apiFenix.getMasters('2022/2023').then(masters => {
        res.json(masters)
    })
})
app.get('/api/minors', (req, res) => {
    apiFenix.getMinors('2022/2023').then(minors => {
        res.json(minors)
    })
})

app.get('/api/courses', (req, res) => {
    console.log(req.query)
    if (req.query.master == undefined || req.query.master == '') res.json([]);
    apiFenix.getCourses(req.query.master).then(master => {
        res.json(master)
    })
})


app.listen(3001)