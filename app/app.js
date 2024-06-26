// Import express.js
const express = require("express");

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Get the functions in the db.js file to use
const db = require('./services/db');
app.use(express.urlencoded({ extended: true }));

// Get the student models
const { Student } = require("./models/student");
const programmes = require("./models/programmes");
const { User } = require("./models/user");


// Set the sessions
var session = require('express-session');
app.use(session({
  secret: 'secretkeysdfjsflyoifasd',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));


// // Create a route for root - /
// app.get("/", function(req, res) {
//     res.render("index");
// });

app.get("/", function(req, res) {
    console.log(req.session);
    if (req.session.uId) {
        res.send('Welcome back, ' + req.session.uId + '!');
    } else {
        res.send('Please login to view this page!');
    }
    res.end();
});



// Task 1 JSON formatted listing of students
app.get("/all-students", function(req, res) {
    var sql = 'select * from Students';
    // As we are not inside an async function we cannot use await
    // So we use .then syntax to ensure that we wait until the 
    // promise returned by the async function is resolved before we proceed
    db.query(sql).then(results => {
        console.log(results);
        res.json(results);
    });

});

// Task 2 display a formatted list of students
app.get("/all-students-formatted", function(req, res) {
    var sql = 'select * from Students';
    db.query(sql).then(results => {
    	    // Send the results rows to the all-students template
    	    // The rows will be in a variable called data
        res.render('all-students', {data: results});
    });
});

// Single student page.  Show the students name, course and modules

app.get("/student-single/:id", async function (req, res) {
    var stId = req.params.id;
    // Create a student class with the ID passed
    var student = new Student(stId);
    await student.getStudentDetails();
    await student.getStudentProgramme();
    await student.getStudentModules();
    resultProgs = await programmes.getAllProgrammes();
    console.log(student);
    res.render('student', {'student':student, 'programmes':resultProgs});
});

app.post('/add-note', async function (req, res) {
    params = req.body;
    // Adding a try/catch block which will be useful later when we add to the database
    var student = new Student(params.id);
    try {
         await student.addStudentNote(params.note);
         res.redirect('/student-single/' + params.id);
        }
     catch (err) {
         console.error(`Error while adding note `, err.message);
     }
     // Just a little output for now
     res.send('form submitted');

});


// JSON output of all programmes
app.get("/all-programmes", function(req, res) {
    var sql = 'select * from Programmes';
    // As we are not inside an async function we cannot use await
    // So we use .then syntax to ensure that we wait until the 
    // promise returned by the async function is resolved before we proceed
    db.query(sql).then(results => {
        console.log(results);
        res.json(results);
    });

});

// Single programme page (no formatting or template)
app.get("/programme-single/:id", async function (req, res) {
    var pCode = req.params.id;
    var pSql = "SELECT * FROM Programmes WHERE id = ?";
    var results = await db.query(pSql, [pCode]);
    //Now call the database for the modules
    //Why do you think that the word modules is coming in before the name of the programme??
    var modSql = "SELECT * FROM Programme_Modules pm \
    JOIN Modules m on m.code = pm.module \
    WHERE programme = ?";
    var modResults = await db.query(modSql, [pCode]);
    // String the results together, just for now.  Later we will push this
    // through the template
    res.send(JSON.stringify(results) + JSON.stringify(modResults));  
});





// // A post route to recieve new data for a students' programme
// app.post('/allocate-programme', function (req, res) {
//     params = req.body;
//     var student = new Student(params.id)
//     // Adding a try/catch block which will be useful later when we add to the database
//     try {
//         student.updateStudentProgramme(params.programme).then(result => {
//             res.redirect('/student-single/' + params.id);
//         })
//      } catch (err) {
//          console.error(`Error while adding programme `, err.message);
//      }
// });




app.post('/allocate-programme', function (req, res) {
    params = req.body;
    var student = new Student(params.id)
    // Adding a try/catch block which will be useful later when we add to the database
    try {
        student.updateStudentProgramme(params.programme).then(result => {
            res.redirect('/single-student/' + params.id);
        })
     } catch (err) {
         console.error(`Error while adding programme `, err.message);
     }
});










// Create a route for testing the db
app.get("/db_test", function(req, res) {
    // Assumes a table called test_table exists in your database
    var sql = 'select * from test_table';
    // As we are not inside an async function we cannot use await
    // So we use .then syntax to ensure that we wait until the 
    // promise returned by the async function is resolved before we proceed
    db.query(sql).then(results => {
        console.log(results);
        res.json(results)
    });
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});






// Register
app.get('/register', function (req, res) {
    res.render('register');
});


// If the email is matches an email in the database
// a new password is set, if not then a new user is added

app.post('/set-password', async function (req, res) {
    params = req.body;
    var user = new User(params.email);
    try {
        uId = await user.getIdFromEmail();
        if (uId) {
            // If a valid, existing user is found, set the password and redirect to the users single-student page
            await user.setUserPassword(params.password);
            // console.log(req.session.id);
            // res.send('Password set successfully');
            res.redirect('/student-single/' + uId);
        }
        else {
            // If no existing user is found, add a new one
            newId = await user.addUser(params.email);
            res.send('Perhaps a page where a new user sets a programme would be good here');
        }
    } catch (err) {
        console.error(`Error while adding password `, err.message);
    }
});







// Login
app.get('/login', function (req, res) {
    res.render('login');
});

// Check submitted email and password pair
app.post('/authenticate', async function (req, res) {
    params = req.body;
    var user = new User(params.email);
    try {
        uId = await user.getIdFromEmail();
        if (uId) {
            match = await user.authenticate(params.password);
            if (match) {
                req.session.uId = uId;
                req.session.loggedIn = true;
                console.log(req.session.id);
                res.redirect('/student-single/' + uId);
            }
            else {
                // TODO improve the user journey here
                res.send('invalid password');
            }
        }
        else {
            res.send('invalid email');
        }
    } catch (err) {
        console.error(`Error while comparing `, err.message);
    }
});





// Logout
app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/login');
  });
  




// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});





// // Create a route for root - /
// app.get("/", function(req, res) {
//     // Set up an array of data
//     var test_data = ['one', 'two', 'three', 'four'];
//     // Send the array through to the template as a variable called data
//     res.render("index", 
//                 {'title':'My index page', 'heading':'My heading', 'data':test_data});
// });


// // Task 1 JSON formatted listing of students
// app.get("/all-students", function (req, res) {
//     var sql = "select * from Students";
//     //As we are not inside an async function we cannot use await
//     //So we use , then syntax to ensure that we wait until the
//     // promise returned by the async function is resolved before we proceed
//     db.query(sql).then(results => {
//         console.log(results);
//         res.json(results);
//     });

// });


// // Task 2 display a formatted list of students
// app.get("/all-students-formatted", function(req, res) {
//     var sql = 'select * from Students';
//     // As we are not inside an async function we cannot use await
//     // So we use .then syntax to ensure that we wait until the 
//     // promise returned by the async function is resolved before we proceed
//     var output = '<table border="1px">';
//     db.query(sql).then(results => {
//         for (var row of results) {
//             output += '<tr>';
//             output += '<td>' + row.id + '</td>';
//             output += '<td>' + '<a href="./single-student/' + row.id + '">' + row.name + '</a>' + '</td>';
//             output += '</tr>'
//         }
//         output+= '</table>';
//         res.send(output);
//     });
// });



// // Single student page, show the students name course and modules
// app.get("/single-student/:id", async function (req, res) {
//     var stId = req.params.id;
//     // Create a student class with the ID passed
//     var student = new Student(stId);
//     await student.getStudentName();
//     await student.getStudentProgramme();
//     await student.getStudentModules();
//     // res.send(student);
//     res.render('student', {student:student});
// });
































// // app.get("/single-student/:id", function(req, res) {
// //     var stId = req.params.id;
// //     var stSql = "SELECT s.name as student, ps.name as programme, \
// //     ps.id as pcode from Students s \
// //     JOIN Student_Programme sp on sp.id = s.id \
// //     JOIN Programmes ps on ps.id = sp.programme \
// //     WHERE s.Id = ?"
// //     var modSql = "SELECT * From Programme_Modules pm \
// //     JOIN Modules m on m.code = pm.module \
// //     WHERE programme = ?";
// //     db.query(stSql, [stId]).then(results => {
// //         console.log(results);
// //         var pCode = results[0].pcode;
// //         output = '';
// //         output += '<div><b>Student: </b>' + results[0].student; '</div>';
// //         output += '<div><b>Programme: </b>' + results[0].Programme; '</div>';
        
// //         // Now call database for the modules
// //         db.query(modSql, [pCode]).then(results => {
// //             output += '<table border="1px">';
// //             console.log(results);
// //             for (var row of results) {
// //                 output += '<tr>';
// //                 output += '<td>' + row.module + '</td>';
// //                 output += '<td>' + row.name + '</td>';
// //                 output += '</tr>'
// //             }
// //             output+= '</table>';
// //             res.send(output);
// //         });

// //     });
// // })


// // Task 2 display a formatted list of students
// app.get("/all-students-formatted", function(req, res) {
//     var sql = 'select * from Students';
//     db.query(sql).then(results => {
//     	    // Send the results rows to the all-students template
//     	    // The rows will be in a variable called data
//         res.render('all-students', {data: results});
//     });
// });






// // Task 3 single student page
// app.get("/student-single/:id", async function (req, res) {
//     var stId = req.params.id;
//     // Create a student class with the ID passed
//     var student = new Student(stId);
//     await student.getStudentName();
//     await student.getStudentProgramme();
//     await student.getStudentModules();
//     console.log(student);
//     res.render('student', {student:student});
// });







// app.post('/add-note', function (req, res) {
//     // Adding a try/catch block which will be useful later when we add to the database
//     try {
//         // Just a console.log for now to check we are receiving the form field values
//         console.log(req.body);
//      } catch (err) {
//          console.error(`Error while adding note `, err.message);
//      }
//      // Just a little output for now
//      res.send('form submitted');

// });



// // Create a route for root - /
// // app.get("/", function(req, res) {
// //     res.send("Hello Theo!");
// // });

// // Create a route for root
// // app.get("/", function(req, res) {
// //     res.render("index");
// // });

// // Create a route for root - /
// // app.get("/", function(req, res) {
// //     res.render("index", {'title':'My index page', 'heading':'My heading'});
// // });


// // app.get("/all-students", function(req, res) {
// //     sql = 'select * from Students';
// //     db.query(sql).then(results => {
// //         let data = []
// //         for(let i=0; i<results.length; i++){
// //             res.write(results[i].name)
// //         }
// //         res.end()
// //         console.log(data);
// //     });
// // });





// // Create a route for testing the db
// app.get("/db_test", function(req, res) {
//     // Assumes a table called test_table exists in your database
//     sql = 'select * from test_table';
//     db.query(sql).then(results => {
//         let data = []
//         for(let i=0; i<results.length; i++){
//             res.write(results[i].name)
//         }
//         res.end()
//         console.log(data);
//     });
// });

// // Create a route for /goodbye
// // Responds to a 'GET' request
// app.get("/", function(req, res) {
//     res.send("Hello world!");
// });

// // Create a dynamic route for /hello/<name>, where name is any value provided by user
// // At the end of the URL
// // Responds to a 'GET' request
// app.get("/hello/:name", function(req, res) {
//     // req.params contains any parameters in the request
//     // We can examine it in the console for debugging purposes
//     console.log(req.params);
//     //  Retrieve the 'name' parameter and use it in a dynamically generated page
//     res.send("Hello " + req.params.name);
// });



// app.post('/add-note', function (req, res) {
//     // Adding a try/catch block which will be useful later when we add to the database
//     try {
//         // Just a console.log for now to check we are receiving the form field values
//         console.log(req.body);
//      } catch (err) {
//          console.error(`Error while adding note `, err.message);
//      }
//      // Just a little output for now
//      res.send('form submitted');

// });

// // Start server on port 3000
// app.listen(3000,function(){
//     console.log(`Server running at http://127.0.0.1:3000/`);
// });

