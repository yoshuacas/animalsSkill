'use strict';

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */
var http = require('http');
const util = require('util');


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession, sessionAttributes) {
    
    let directive = buildDirectives (searchAnimalSound(sessionAttributes));

    console.log ("directive: " + directive);
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        directives: directive,
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}

function buildDirectives (url) {
    console.log ("url: " + url);
    let directive = [];
    if (url && url.length >2) {
        directive = [
            {

                "type": "AudioPlayer.Play",

                "playBehavior": "REPLACE_ALL",

                "audioItem": {

                  "stream": {

                    "token": "this-is-the-audio-token",

                    "url": url,

                    "offsetInMilliseconds": 0

                  }

                }

            }
        ]
    } 

    return directive;
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to the Animal Sounds skill. ' +
        'You can ask me to play an animal sound by saying, how does a dog sound?';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please ask me to play an animal sound by saying, ' +
        'How does a cow sound?';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession, sessionAttributes));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for trying the Animal Sounds skill. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;
    
    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession,sessionAttributes));
}


function createSessionAnimalAttributes(favoriteAnimal) {
    return {
        favoriteAnimal,
    };
}


// searchAnimalSound, returns a list of URLs for the animal in sessionAttirbutes playlist.
function searchAnimalSound (sessionAttributes){
    
    let soundId = null;
    var body = '';
    let url = "http://www.freesound.org/apiv2/search/text/?query=dogs&token=eKaYrlWbsI7lBdB0TcuGTU8CBVhqECZAMTBD5jgs"
    console.log('start request to ' + url);
    console.log('sessionAttributes ' + sessionAttributes);

    http.get(url, function(res) {

        console.log("Got response: " + res.statusCode);

        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            console.log(body);
            var jsonObject = JSON.parse(body);
            soundId = jsonObject.results;
            console.log("soundId: " + soundId);
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });

    console.log('end request to ' + url + body.results);

    return soundId;
}

/**
 * Sets the Animal in the session and prepares the speech to reply to the user.
 */
function setAnimalInSession(intent, session, callback) {
    const cardTitle = intent.name;
    const favoriteAnimalSlot = intent.slots.Animal;
    let repromptText = '';
    let sessionAttributes = {};
    const shouldEndSession = false;
    let speechOutput = '';

    if (favoriteAnimalSlot) {
        const favoriteAnimal = favoriteAnimalSlot.value;
        sessionAttributes = createSessionAnimalAttributes(favoriteAnimal);
        speechOutput = `I now know your Animal is ${favoriteAnimal}. You can ask me ` +
            "your current Animal by saying, what's my Animal?";
        repromptText = "You can ask me your current Animal by saying, what's my Animal?";
        searchAnimalSound (favoriteAnimal);
    } else {
        speechOutput = "I'm not sure what your Animal is. Please try again.";
        repromptText = "I'm not sure what your Animal is. You can tell me your " +
            'Animal by saying, my Animal is dog';
    }

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession, sessionAttributes));
}

function getAnimalFromSession(intent, session, callback) {
    let favoriteAnimal;
    const repromptText = null;
    const sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = '';

    if (session.attributes) {
        favoriteAnimal = session.attributes.favoriteAnimal;
    }

    if (favoriteAnimal) {
        speechOutput = `Your animal is ${favoriteAnimal}. Goodbye.`;
        shouldEndSession = true;
    } else {
        speechOutput = "I'm not sure what your animal is, you can say, my animal is dog";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.

    callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession, sessionAttributes));
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'GetAnimalSound') {
        setAnimalInSession(intent, session, callback);
    } else if (intentName === 'GetCurrentAnimal') {
        getAnimalFromSession(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
