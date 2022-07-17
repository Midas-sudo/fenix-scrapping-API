const apiFenix = require('./api_fenix');
const express = require('express')
const app = express()
const port = 3101;

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/api/masters', (req, res) => {
    console.log(req.query)
    if (req.query.cached == "true") {
        apiFenix.getCachedMasters('2022/2023').then(masters => {
            res.json(masters)
        })
    } else {
        apiFenix.getMasters('2022/2023').then(masters => {
            res.json(masters)
        })
    }
})
app.get('/api/minors', (req, res) => {
    if (req.query.cached == "true") {
        apiFenix.getCachedMinors('2022/2023').then(minors => {
            res.json(minors)
        })
    } else {
        apiFenix.getMinors('2022/2023').then(minors => {
            res.json(minors)
        })
    }
})

app.get('/api/courses', (req, res) => {
    console.log(req.query)
    // if (req.query.cached == true) {
    //     if (req.query.master == undefined || req.query.master == '') res.json([]);
    //     apiFenix.getCachedCourses(req.query.master).then(master => {
    //         res.json(master)
    //     })
    // } else {
    if (req.query.master == undefined || req.query.master == '') { res.json([]); }
    else {
        apiFenix.getCourses(req.query.master).then(master => {
            res.json(master)
        })
    }
})


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))