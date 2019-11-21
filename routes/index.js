var express = require('express');
var router = express.Router();
const fetch = require('node-fetch');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

/* GET JSON object */
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
    throw new Error("Not found");
  }

  return await response.json();
}

/* Get latest compic strip */
async function getLatestComic() {
  let url = new URL('https://xkcd.com/info.0.json');
  return await getJson(url);
}

/* GET home page. */
router.get('/', async function(req, res) {
  let data = await getLatestComic();

  if (data.transcript === "")
    transcript = "There's no official transcript for this comic strip.";
  else
    transcript = data.transcript.replace(/(?:\r\n|\r|\n)/g, ' <br/> ');

  const client = await pool.connect();

  let update;
  try {
    update = await client.query('UPDATE viewCount SET viewCount = viewCount + 1 WHERE PageId = 0');
  }
  catch (e) {
    client.release();
    throw new Error(update.message);
  }

  let rows = await client.query('SELECT * FROM viewCount WHERE PageId = 0');

  res.render('index', {
    title: 'xkcd #' + data.num,
    comTitle: data.title,
    id: data.num,
    latestId: data.num,
    date: `${data.month}/${data.day}`,
    imgLink: data.img,
    viewCount: rows.rows[0].viewcount
  });
});

// get comic json from id
router.get('/:id([0-9]+)', async function(req, res) {
  const id = parseInt(req.params.id);
  const url = new URL('https://xkcd.com/' + id + '/info.0.json');

  var data = {};
  try {
    data = await getJson(url);
  }
  catch (error) {
    res.render('error', {
      error: {status: 404},
      message: error.message
    });
    return;
  }

  var transcript = '';
  if (data.transcript === "")
    transcript = "There's no official transcript for this comic strip.";
  else
    transcript = data.transcript.replace(/(?:\r\n|\r|\n)/g, ' <br/> ');
  let latest = await getLatestComic();

  res.render('index', {
    title: 'xkcd #' + data.num,
    comTitle: data.title,
    id: data.num,
    latestId: latest.num,
    date: `${data.month}/${data.day}/${data.year}`,
    imgLink: data.img,
    transcript: transcript
  });
});

// get a random comic trip
router.get('/random', async function(req, res) {
  let data = await getLatestComic();
  let latestId = parseInt(data.num);
  const id = parseInt(Math.random() * latestId) + 1;
  res.redirect('/' + id);
});

module.exports = router;