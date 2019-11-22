var createError = require('http-errors')
var express = require('express');
var router = express.Router();
const fetch = require('node-fetch');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

/* Get JSON object from the api */
async function getJson(url, params = {}) {
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  let headers = {
    "Accept" : "application/json",
    "Content-Type" : "application/json"
  }

  let response = await fetch(url, {
    method: "GET",
    headers: headers
  });

  if (response.status === 404) {
    throw new Error(404);
  }

  return await response.json();
}

/* Get latest compic strip */
async function getLatestComic() {
  let url = new URL('https://xkcd.com/info.0.json');
  return await getJson(url);
}

/* home page. */
router.get('/', async function(req, res, next) {
  let data = await getLatestComic();
  const client = await pool.connect();
  try {
    // Print a message if there's no official transcript
    if (data.transcript === "")
      transcript = "There's no official transcript for this comic strip.";
    else
      transcript = data.transcript.replace(/(?:\r\n|\r|\n)/g, ' <br/> ');

    let update = await client.query('UPDATE viewCount SET viewCount = viewCount + 1 WHERE PageId = 0');
    let query = await client.query('SELECT * FROM viewCount WHERE PageId = 0');
    res.render('index', {
      title: 'xkcd #' + data.num + ' - Cyber City Comic',
      comTitle: data.title,
      id: data.num,
      latestId: data.num,
      date: `${data.month}/${data.day}`,
      imgLink: data.img,
      viewCount: query.rows[0].viewcount
    });
  }
  catch (e) {
    if (e.message === '404')
      next(createError(404));
    else {
      console.trace(e.stack);
      next(createError(500, 'Internal server error.'));
    }
  }
  finally {
    client.release();
  }
});

/* Get comic from id */
router.get('/:id([0-9]+)', async function(req, res, next) {
  const id = parseInt(req.params.id);
  const url = new URL('https://xkcd.com/' + id + '/info.0.json');
  const client = await pool.connect();
  try {
    let data = await getJson(url);
    
    var transcript = '';
    // Print a message if there's no official transcript
    if (data.transcript === "")
      transcript = "There's no official transcript for this comic strip.";
    else
      transcript = data.transcript.replace(/(?:\r\n|\r|\n)/g, ' <br/> ');

    let latest = await getLatestComic();

    var pageView = 1;

    // Get the number of view count for given id
    let query = await client.query("SELECT * FROM viewCount WHERE PageId = $1", [id]);
    // if there's no entry of comic with that id inside the database, insert it
    if (query.rows.length === 0) {
      let res = await client.query("INSERT INTO viewCount VALUES ($1, $2, $3)", [id, data.title, 1]);
    }
    else { // else update view count of that comic
      let update = await client.query('UPDATE viewCount SET viewCount = viewCount + 1 WHERE PageId = $1', [id]);
      pageView = query.rows[0].viewcount + 1;
    }

    res.render('index', {
      title: 'xkcd #' + data.num + ' - Cyber City Comics',
      comTitle: data.title,
      id: data.num,
      latestId: latest.num,
      date: `${data.month}/${data.day}/${data.year}`,
      imgLink: data.img,
      transcript: transcript,
      viewCount: pageView
    });
  }
  catch (e) {
    if (e.message === '404')
      next(createError(404));
    else {
      console.trace(e.stack);
      next(createError(500, 'Internal server error.'));
    }
  } 
  finally {
    client.release();
  }
});

// Get a random comic strip
router.get('/random', async function(req, res) {
  let data = await getLatestComic();
  let latestId = parseInt(data.num);
  const id = parseInt(Math.random() * latestId) + 1; // Generate a random number between 1 and id of latest comic strip
  res.redirect('/' + id); // Redirect to page of comic with that id
});

module.exports = router;