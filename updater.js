const apiFenix = require('./api_fenix');
const fse = require('fs-extra');


const srcDir = `db`;
const destDir = `db_backup`;
const listsDir = `db/lists`;
const mastersDir = `db/masters`;
const minorsDir = `db/minors`;



//Backs up DB
async function backupDB() {

    fse.copySync(srcDir, destDir, {
        overwrite: true
    }, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log("success!");
        }
    });
}
//////////////////////////////
async function updateMasters() {
    //Update Masters List

    await apiFenix.getMasters('2022/2023').then(data => {
        fse.writeJson(`${listsDir}/masters.json`, data, (err) => {
            if (err) {
                console.error(err);
            } else {
                updateCoursesMaster(data);
            }
        });
    });
}
async function updateMinors() {
    //Update Minors List
    await apiFenix.getMinors('2022/2023').then(data => {
        fse.writeJson(`${listsDir}/minors.json`, data, (err) => {
            if (err) {
                console.error(err);
            } else {
                updateCoursesMinor(data);
            }
        });
    });
}

async function updateCoursesMaster(masters) {

    //Update Courses List

    await masters.forEach(master => {
        apiFenix.getCourses(master.acronym.toLowerCase()).then(courses => {
            fse.writeJson(`${mastersDir}/${master.acronym.toLowerCase()}.json`, courses, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log("success!");
                }
            });
        });
    });
}
async function updateCoursesMinor(minors) {
    await minors.forEach(minor => {
        apiFenix.getCourses(minor.acronym.toLowerCase()).then(courses => {
            fse.writeJson(`${minorsDir}/${minor.acronym.toLowerCase()}.json`, courses, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log("success!");
                }
            });
        });
    });
}



async function main() {
    await backupDB();
    console.log("DB backuped");
    await updateMasters();
    await updateMinors();
    console.log("Lists updated");
    console.log("Courses updated");
}

main()