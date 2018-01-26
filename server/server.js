#!/usr/bin/env node
'use strict';
const path = require('path');
const express = require('express');
const cors = require('cors');
const compress = require('compression');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express()
app.use(cors());
app.use(compress()); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/simple', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/simple/index.html'));
});
// app.get('/simplemb', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '../public/simple_mapbox/index.html'));
// });
// app.get('/', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '../public/simple/index.html'));
// });


const PORT = 8080;

app.listen(PORT, function() {
        console.log('App listening on port %d!',PORT)
    });