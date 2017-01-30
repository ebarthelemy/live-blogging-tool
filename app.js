'use strict'

// Config
const config = require('./config/config')

// Node modules
const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const twilio = require('twilio')
const flybase = require('flybase')
const path = require('path')

// App
let app = express()

app.set('views', path.join(process.cwd(), 'views'))
app.set('view engine', 'ejs')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(`${__dirname}/public`)) // Set the static file location, public/img will be /img for users

let port = process.env.PORT || 8080 // Set our port

// Twilio
let twilioClient = twilio(
  config.twilio.account_sid,
  config.twilio.auth_token
)
let twilioPhoneNumber = config.twilio.phone_number

// Flybase
let postsRef = flybase.init(
  config.flybase.app_name,
  config.flybase.collection,
  config.flybase.api_key
)

// Back-end routes

// Listening for incoming SMS messages
app.post('/message', (request, response) => {
  let date = new Date()
  date = date.toLocaleString()

  let postBody = request.param('Body')

  let numMedia = parseInt(request.param('NumMedia'))

  console.log('numMedia', numMedia);

  if (numMedia > 0) {
    for (let i = 0; i < numMedia; i++) {
      let mediaUrl = request.param(`MediaUrl${i}`)
      postBody += `
        <br />
        <img src="${mediaUrl}" />
      `
    }
  }

  let post = {
    sid: request.param('MessageSid'),
    type: 'text',
    date: date,
    fromNumber: request.param('From'),
    textMessage: postBody,
    fromCity: request.param('FromCity'),
    fromState: request.param('FromState'),
    fromCountry: request.param('FromCountry')
  }

  console.log('post', post);

  let result = postsRef.push(post)

  console.log('result', result);

  let twimlResponse = new twilio.TwimlResponse()
  twimlResponse.message(`Post received`)
  response.writeHead(200, {
    'Content-Type': 'text/html'
  })
  response.end(twimlResponse.toString())
})

// Front-end routes

// Route to handle all Angular requests
app.get('*', (re, res) => {
  res.render('index', {
    flybaseApiKey: config.flybase.api_key,
    flybaseAppName: config.flybase.app_name
  })
})

// Server
let server = app.listen(port, () => {
  console.log(`Listening on port ${port}.`);
})
