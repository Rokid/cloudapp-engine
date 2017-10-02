'use strict';

const test = require('ava');
const CloudAppEngine = require('../').CloudAppEngine;

test.cb('play simple voice', (t) => {
  const appId = 'R4AB842832E84BBD8B2DD6537DAFF790';
  const tts = '晚上好，若琪为您播放晚间新闻摘要，首先我们来看看社会新闻!';
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  client.on('voice.play', (voice, done) => {
    t.is(voice.tts, tts);
    done(null, 'foobar');
  });
  client.on('voice.stop', (voice) => {
    t.is(voice, 'foobar');
  });
  client.on('exit', () => {
    t.end();
  });
  client.eval({
    'appId': appId,
    'response': {     
      'action': {
        'version': '2.0.0',
        'type': 'NORMAL',
        'form': 'cut',
        'shouldEndSession': true,
        'directives': [{
          'type': 'voice',
          'action': 'PLAY',
          'disableEvent': true,
          'item': {
            'tts': tts
          }
        }]
      }
    },
    'startWithActiveWord': false,
    'version': '2.0.0'
  });
});