'use strict';

const EventEmitter = require('events').EventEmitter;
const CloudApp = require('./CloudApp');
const SendEvent = require('./SendEvent');

/**
 * @class Engine
 * @extends EventEmitter
 */
class Engine extends EventEmitter {
  /**
   * @method constructor
   * @param {Object} config
   * @param {String} config.key
   * @param {String} config.device_type_id
   * @param {String} config.device_id
   * @param {String} config.api_version
   * @param {String} config.secret
   */
  constructor(config) {
    super();
    this._apps = {};
    this._top = null;
    this._sendEvent = new SendEvent(config.host, config);
  }
  /**
   * @method eval
   * @param {Object} data - the action data
   */
  eval(data) {
    const app = new CloudApp(data, this);
    if (app.valid) {
      let created = this._apps[app.appid];
      if (created) {
        app.voice = created.voice;
        app.media = created.media;
      }
      this._apps[app.appid] = app;
      this._top = app;
      app.execute();
    }
  }
  /**
   * @method setVoice
   * @param {Object} voice
   */
  setVoice(voice) {
    if (!this._top)
      throw new Error('no current app is running');
    if (!voice)
      throw new TypeError('setVoice requires voice');
    this._top.voice = voice;
  }
  /**
   * @method setMedia
   * @param {Object} media
   */
  setMedia(media) {
    if (!this._top)
      throw new Error('no current app is running');
    if (!media)
      throw new TypeError('setMedia requires voice');
    this._top.media = media;
  }
  /**
   * @method _getApp
   */
  _getApp(appid) {
    return this._apps[appid];
  }
  /**
   * @method _tryExitById
   */
  _tryExitById(appid) {
    delete this._apps[appid];
    this.emit('exit', appid);
  }
  /**
   * @method _tryPickup
   */
  _tryPickup(duration) {
    this.emit('pickup', duration);
  }
  /**
   * @method _tryEmit
   */
  _tryEmit(appid, event, data) {
    let handler = this._events[event];
    if (Array.isArray(handler))
      throw new Error(`use 1 listener for the "${event}" event`);
    // FIXME(yorkie): should not bypass `error` event.
    if (!handler && event !== 'error')
      return;

    return new Promise((resolve, reject) => {
      if (!handler || handler.length < 2) {
        this.emit(event, data);
        resolve();
      } else {
        this.emit(event, data, (err, item) => {
          this._onEmitterFinished(appid, event, data, err, item)
            .then(resolve, reject);
        });
      }
    });
  }
  /**
   * @method _onEmitterFinished
   */
  _onEmitterFinished(appid, event, data, error, item) {
    let app = this._getApp(appid);
    return new Promise((resolve, reject) => {
      if (error) {
        this.emit('error', error);
        resolve();
        return;
      }
      try {
        app.addEventTask(event, data, item)
          .then(resolve, reject);
      } catch (err) {
        this.emit('error', err);
        resolve();
      }
    });
  }
}

module.exports = Engine;