//import axios
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { createRequire } = require('module');

async function getCourses(degree) {
    return new Promise(async (resolve, reject) => {
        axios.get(`https://fenix.tecnico.ulisboa.pt/cursos/${degree}/curriculo`).then(response => {
            const $ = cheerio.load(response.data);
            var info = $('div#byGroups');

            var cadeiras = $(info).find('div.col-md-5');
            //console.log(cadeiras);
            var cadeirasArray = [];
            var rulesMap = new Map();
            var final = {};

            cadeiras.each(function (i, elem) {
                let name = $(elem).find('a').text().trim();
                let link = $(elem).find('a').attr('href');
                let period = $(elem).find('a').next('div').text().trim();
                let subArea = $(elem).parents('div.level').first().prevAll('h4').first().text();
                let area = $(elem).parents('div.level').first().parents('div.level').first().prevAll('h4').first().text();
                let when = period.split('P ').length == 2 ? period.split('P ')[1] : period.split('Sem. ').length == 2 ? period.split('Sem. ')[1] == 1 ? [1, 2] : [3, 4] : "error";
                let duration = period.split('P ').length == 2 ? "P" : period.split('Sem. ').length == 2 ? "Sem" : "error";
                let cadeira = { name: name, link: link, period: period, subArea: subArea, area: area, duration: duration, when: when };
                let credits = $(elem).parent().find('div.col-md-2').find('p').text().split("Créd.")[0].match(/\d+/)[0];
                cadeirasArray.push(cadeira);


                if (final[area] == undefined) {
                    final[area] = {};
                }
                if (final[area][subArea] == undefined) {
                    final[area][subArea] = [{ name: name, link: link, period: period, degree: degree, subArea: subArea, area: area, duration: duration, when: when, code: link.split('/').pop(), credits: parseInt(credits) }];
                } else {
                    final[area][subArea].push({ name: name, link: link, period: period, degree: degree, subArea: subArea, area: area, duration: duration, when: when, code: link.split('/').pop(), credits: parseInt(credits) });
                }

                var rule = $(elem).parent('div').parent().find('.rules').first().find('span.rule').text();
                rulesMap.set(subArea, rule);
            });
            //Convert map to object
            var rules = {};
            rulesMap.forEach(function (value, key) {
                rules[key] = value;
            })
            resolve([final, rules]);
        }).catch(error => {
            console.log("error courses", error);
        });
    });
}


async function getMinors(lective_year) {
    return new Promise((resolve, reject) => {
        var output = [];
        axios.get(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees?academicTerm=${lective_year}`).then(response => {
            const data = response.data;
            //Iterate over the degrees
            data.forEach(async function (item) {
                if (item.type == "Minor")
                    output.push({ name: item.name, id: item.id, acronym: item.acronym, url: item.url });
            });
            resolve(output);
        }).catch(error => {
            console.log("error minors");
        })
    })
}

async function getMasters(lective_year) {
    return new Promise((resolve, reject) => {
        var output = [];
        axios.get(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees?academicTerm=${lective_year}`).then(response => {
            const data = response.data;
            //Iterate over the degrees
            data.forEach(async function (item) {
                if (item.type == "Mestrado Bolonha")
                    output.push({ name: item.name, id: item.id, acronym: item.acronym, url: item.url });
            });
            resolve(output);
        }).catch(error => {
            console.log("error masters");
        })
    })
}

async function getCachedMasters() {
    return new Promise((resolve, reject) => {
        fs.readFile('./db/lists/masters.json', 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(JSON.parse(data));
        });
    }).catch(error => {
        console.log("error cached masters");
    });
}

async function getCachedMinors() {
    return new Promise((resolve, reject) => {
        fs.readFile('./db/lists/minors.json', 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(JSON.parse(data));
        });
    }).catch(error => {
        console.log("error cached minors");
    });
}

async function getCachedCourses(course) {
    return new Promise((resolve, reject) => {
        fs.readFile(`./db/${course}.json`, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(JSON.parse(data));
        });
    }).catch(error => {
        console.log("error cached courses");
    });
}




module.exports = { getMasters, getMinors, getCourses, getCachedMasters, getCachedMinors, getCachedCourses };


//function to replace all types of escaped spaces
function replaceEscaped(str) {
    replacer = {
        '\n': '',
        '\r': '',
        '\t': '',
        '\v': '',
        '\f': '',
        '\b': '',
        '\0': '',
        '\x0B': '',
        '\xA0': '',
        '\u2028': '',
        '\u2029': '',
    }
    for (let key in replacer) {
        str = str.replace(new RegExp(key, 'g'), replacer[key]);
    }
    return str;
}



//Convert string to array of chars and iterate over it
function getNumbersFromString(str) {
    let arr = [];
    let temp = [];
    var numbers = [];
    arr = str.split('');
    arr.forEach(function (item, index) {
        //Check if its a number
        if (item.match(/^[0-9]$/)) {
            temp.push(item);
        }
        //Check if its a space
        if (item == 32) {
            //Join the temp array as a number and push it to the final array
            if (temp.length > 0) {
                let num = parseInt(temp.join(''));
                numbers.push(num);
                temp = [];
            }
        }
    });
    return numbers;
}
var global = 0



// //Fucntion to get the courses of a given degree and save them to a file
// async function getCourses(degree) {
//     return new Promise((resolve, reject) => {
//         axios.get(`https://fenix.tecnico.ulisboa.pt/cursos/${degree}/curriculo`).then(response => {
//             console.log(degree);
//             const $ = cheerio.load(response.data);
//             var courses = $("#bySemesters").find(".col-md-5");

//             var coursesInfo = [];
//             //Iterate over the courses and save the innerText of <a> and the innerText of <div> on cousesInfo as an object 
//             courses.each(function (i, element) {
//                 var course = {};
//                 course.name = $(element).find("a").text();
//                 course.description = replaceEscaped($(element).find("div").text()).split(', ');

//                 course.year = course.description[0].split('Ano ')[1];

//                 //Checks if "P " is in the description elses its a Semester
//                 if (course.description[1].includes("P ")) {
//                     course.period = course.description[1].split('P ')[1];
//                 } else {
//                     course.semester = course.description[1].split('Sem. ')[1];
//                 }
//                 //Remove Property description
//                 delete course.description;
//                 coursesInfo.push(course);
//             });

//             resolve(coursesInfo);
//         }).catch(error => {

//             console.log(error.code);
//             reject(error);
//         })
//     });
// }


//Fetch the degrees of a specific year from the Fenix Api  and Iterate over them to get the courses
async function getDegrees(lective_year) {
    axios.get(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees?academicTerm=${lective_year}`).then(response => {
        const data = response.data;
        //Iterate over the degrees
        data.forEach(async function (item, index) {
            //Get the courses of each degree
            var acronym = item.acronym.toLowerCase();
            try {
                var courses = await getCourses(acronym);
                //Save Courses Info to a file with the name "degree.json"
                fs.writeFile(`./files/${item.acronym.toLowerCase()}.json`, JSON.stringify(courses), function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                });
                console.log("Fetched Degree (" + index + "/" + data.length + "): " + item.acronym);
            } catch (error) {
                console.log("Something went wrong with Degree (" + index + "/" + data.length + "): " + item.acronym);
            }
        });
    }).catch(error => {
        console.log(error);
    })
}




var degreesDict = {
    "leec21": 847186594103308,
};

class User {
    access_token;
    refresh_token;
    expires_in;
    constructor(access_token, refresh_token, expires_in) {
        this.access_token = access_token;
        this.refresh_token = refresh_token;
        this.expires_in = expires_in;
    }

}

class FenixAuthClient {
    client_id;
    client_secret;
    redirect_uri;

    constructor(client_id, client_secret, redirect_uri) {
        this.client_id = client_id;
        this.client_secret = client_secret;
        this.redirect_uri = redirect_uri;
    }

    async getUserCode() {
        return `https://fenix.tecnico.ulisboa.pt/oauth/userdialog?client_id=${this.client_id}&redirect_uri=${this.redirect_uri}`;
    }

    async getAccessToken(code) {
        return `https://fenix.tecnico.ulisboa.pt/oauth/userdialog?client_id=${this.client_id}&redirect_uri=${this.redirect_uri}&code=${code}&grant_type=authorization_code`;
    }

    async refreshAccessToken(refresh_token) {
        return `https://fenix.tecnico.ulisboa.pt/oauth/userdialog?client_id=${this.client_id}&client_secret=${this.client_secret}&refresh_token=${refresh_token}&grant_type=refresh_token`;
    }

    async getUserInfo(user) {
        axios.get(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person`, { params: { access_token: user.access_token } }).then(response => {
            return response.data;
        }
        ).catch(error => {
            console.log(error);
        })
    }


    /**
     * This endpoint returns the calendar of the user.
     * @param {User} user the authenticated user
     * @param {string} format the format of the calendar, can be "json" or "ical"
     */
    async getUserCalendar(user, format) {
        axios.get(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person/calendar/classes` + format ? `?format=${format}` : "", { params: { access_token: user.access_token } }).then(response => {
            return response.data;
        }
        ).catch(error => {
            console.log(error);
        })
    }

    /**
     * This endpoint returns the exams and evaluations of the user.
     * @param {User} user the authenticated user
     * @param {*} format the format of the evaluations calendar, can be "json" or "ical"
     */
    async getUserEvaluations(user, format) {
        axios.get(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person/calendar/evaluations` + format ? `?format=${format}` : "", { params: { access_token: user.access_token } }).then(response => {
            return response.data;
        }
        ).catch(error => {
            console.log(error);
        })
    }

    /**
     * This endpoint returns the enrolled courses of the user.
     * @param {User} user the authenticated user
     * @param {string} term specifies the term to retrive information, it should be on the form "20xx/20xx" and it can be omitted.
     */
    async getUserCourses(user, term) {
        axios.get(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person/courses` + term ? `?academicTerm=${term}` : "", { params: { access_token: user.access_token } }).then(response => {
            return response.data;
        }
        ).catch(error => {
            console.log(error);
        })
    }



}




async function fetcher(url) {
    return new Promise((resolve, reject) => {
        axios.get(url).then(response => {
            const data = response.data;
            resolve(data);
        }).catch(_error => {
            reject("Something went wrong with " + url);
        })
    });
}

/**
 * This endpoint returns some basic information about the institution where the application is deployed.
 * It also returns a list of RSS feeds, the current academic term, available languages and default language.
 */
async function getAbout() {
    try {
        var data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/about`)
        console.log(data, "About");
        return data;
    }
    catch (error) {
        console.log(error);
    }
}

/**
 * This endpoint returns all the academic terms available to be used in other endpoints as academicTerm query parameter.
 * The returned object keys are not ordered in any particular way.
 * 
 */
async function getAcademicTerms() {
    try {
        var data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/academicTerms`)
        console.log(data, "AcademicTerms");
        return data;
    }
    catch (error) {
        console.log(error);
    }
}

/**
 * This endpoint returns the menu information of Alameda’s canteen. (Deprecated)
 */
async function getCanteen() {
    try {
        var data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/canteen`)
        console.log(data, "Canteen");
        return data;
    }
    catch (error) {
        console.log(error);
    }

}


/**
 * This endpoint returns the contact information of the institution.
 */
async function getContacts() {
    try {
        var data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/contacts`)
        console.log(data, "Contacts");
        return data;
    }
    catch (error) {
        console.log(error);
    }
}

/**
 * This endpoint returns the degrees of the given academic term. If no academicTerm is specified, the current
 * academic term is used.
 * 
 * @param {string} term The academic term formated as 20xx/20xx.
 * @returns {Object} The degrees of the given academic term.
 */
async function getDegrees(term) {
    return new Promise(async (resolve, reject) => {
        try {
            var data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees${term == undefined ? "" : "?academicTerm=" + term}`);


            console.log(data[0].id, "Degrees");
            resolve(data);
        } catch (error) {
            console.log(error);
            reject("Error fetching degrees");
        }
    });
}


/**
 * This endpoint returns the informations of a specific degree. If no academicTerm is specified, the current
 * academic term is used.
 * 
 * @param {string | int} _degree The id of the degree to search. If the id is a acronym (String), the id is fetched
 *                               from the degrees endpoint.
 * @param {string} term The academic term formated as 20xx/20xx.
 * @returns {Object} The informations of the degree.
 */
async function getDegree(_degree, term) {
    var data;
    var id;
    if (typeof _degree === "string") {
        id = degreesDict[_degree.toLowerCase()];
        try {
            data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/${id}${term == undefined ? "" : "?academicTerm=" + term}`);
            console.log(data.id, "Degree");
            return data;
        }
        catch (error) {
            data = await getDegrees(term);
            id = data.find(item => item.acronym.toLowerCase() == _degree.toLowerCase()).id;
            if (_degree == undefined) throw new Error("Degree not found");
        }
        data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/${id}${term == undefined ? "" : "?academicTerm=" + term}`);
        console.log(data, "DegreeCourses");
        degreesDict[_degree] = parseInt(id, 10);
        console.log(degreesDict);
        return data;

    } else {
        try {
            data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/${id}${term == undefined ? "" : "?academicTerm=" + term}`);
            console.log(data.id, "Degree");
            return data;
        }
        catch (error) {
            console.log(error);
        }
    }
}


/**
 * This endpoint returns the list of courses of a specific degree. If no academicTerm is specified, the current
 * academic term is used.
 * 
 * @param {string | int} _degree The id of the degree to search. If the id is a acronym (String), the id is fetched
 *                               from the degrees endpoint.
 * @param {string} term The academic term formated as 20xx/20xx.
 * @returns {Object} The list of courses of a specific degree.
 */
async function getDegreeCourses(_degree, term) {
    var data;
    var id = _degree;
    if (typeof _degree === "string") {
        id = degreesDict[_degree.toLowerCase()];
        try {
            data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/${id}/courses${term == undefined ? "" : "?academicTerm=" + term}`);
            console.log(data, "DegreeCourses");
            return data;
        }
        catch (error) {
            data = await getDegrees(term);
            id = data.find(item => item.acronym.toLowerCase() == _degree.toLowerCase()).id;
            if (_degree == undefined) throw new Error("Degree not found");
        }
        data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/${id}/courses${term == undefined ? "" : "?academicTerm=" + term}`);
        console.log(data, "DegreeCourses");
        degreesDict[_degree] = parseInt(id, 10);
        console.log(degreesDict);
        return data;

    } else {
        try {
            data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/${id}/courses${term == undefined ? "" : "?academicTerm=" + term}`);
            console.log(data, "DegreeCourses");
            return data;
        }
        catch (error) {
            console.log(error);
        }
    }
}


/**
 * This endpoint returns the information of a specified course.
 * 
 * @param {int} id The id of the degree to search.
 * @returns {Object} The information of the specified course.
 */
async function getCourse(id) {
    try {
        var data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/${id}`);
        console.log(data, "Course");
        return data;
    }
    catch (error) {
        console.log(error);
    }
}

/**
 * This endpoint returns the evaluations of a specified course.
 * 
 * @param {int} id The id of the degree to search.
 * @returns {Object} The evaluations of the specified course.
 */
async function getCourseEvaluations(id) {
    try {
        var data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/${id}/evaluations`)
        console.log(data, "EvaluationsByCourse");
        return data;
    }
    catch (error) {
        console.log(error);
    }
}

/**
 * This endpoint returns the groups of a specified course.
 * 
 * @param {int} id The id of the degree to search.
 * @returns {Object} The groups of the specified course.
 */
async function getCourseGroups(id) {
    try {
        var data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/${id}/groups`)
        console.log(data, "EvaluationsByCourse");
        return data;
    }
    catch (error) {
        console.log(error);
    }
}

/**
 * This endpoint returns the shedule of a specified course.
 * 
 * @param {int} id The id of the degree to search.
 * @returns {Object} The shedule of the specified course.
 */
async function getCourseSchedule(id) {
    try {
        var data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/${id}/schedules`)
        console.log(data, "Schedule");
        return data;
    }
    catch (error) {
        console.log(error);
    }
}

/**
 * This endpoint returns the list of students of a specified course.
 * 
 * @param {int} id The id of the degree to search.
 * @returns {Object} The list of students of the specified course.
 */
async function getCourseStudents(id) {
    try {
        var data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/${id}/students`)
        console.log(data, "Students");
        return data;
    }
    catch (error) {
        console.log(error);
    }
}

//Get domain model
/**
 * This endpoint returns a representation of the domain model for the application. While this
 * information is returned in a JSON format, the concepts underlying the domain model can be found on the Fenix Framework
 * site: http://fenix-framework.github.io/DML.html
 * @returns {object} The domain model.
 */
async function getDomainModel() {
    try {
        var data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/domainModel/`)
        console.log(data, "DomainModel");
        return data;
    }
    catch (error) {
        console.log(error);
    }
}

/**
 * This endpoint returns the informations of the parkings of the university.
 * @returns {object} The informations of the parkings of the university.
 */
async function getParkings() {
    try {
        var data = await fetcher(`https://fenix.tecnico.ulisboa.pt/api/fenix/v1/parking/`)
        console.log(data, "Parkings");
        return data;
    }
    catch (error) {
        console.log(error);
    }
}








//getDegrees("2021/2022");