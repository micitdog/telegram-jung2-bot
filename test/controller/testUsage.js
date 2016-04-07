'use strict';

require('chai').should();
var mongoose = require('mongoose');
var sinon = require('sinon');
require('sinon-mongoose');
var log = require('log-to-file-and-console-node');
var _ = require('lodash');
var moment = require('moment');

var UsageController = require('../../controller/usage');
var Usage = require('../../model/usage');

describe('UsageController', function () {

  var stubMsg = {
    chat: {
      id: 'stubChatId'
    },
    from: {
      id: 'stubFromId',
      username: 'stubUsername',
      first_name: 'stubFirstName',
      last_name: 'stubLastName'
    }
  };

  describe('isAllowCommand', function () {

    it('should allow if time diff is greater than or equal to 3 mins', function (done) {
      var UsageMock = sinon.mock(Usage);
      UsageMock
        .expects('find').withArgs({chatId: 'stubChatId'})
        .chain('sort').withArgs('-dateCreated')
        .chain('limit').withArgs(1)
        .chain('exec')
        .yields(null, [{
          chatId: 'stubChatId',
          notified: false,
          dateCreated: new Date('2016-01-01T0:00:00')
        }]);
      UsageController.isAllowCommand(stubMsg).then(function onSuccess() {
        UsageMock.verify();
        UsageMock.restore();
        done();
      }, function onFailure() {
        false.should.equal(true); // should fail
        done();
      });
    });

    it('should not allow if time diff is smaller than 3 mins', function (done) {
      var UsageMock = sinon.mock(Usage);
      UsageMock
        .expects('find').withArgs({chatId: 'stubChatId'})
        .chain('sort').withArgs('-dateCreated')
        .chain('limit').withArgs(1)
        .chain('exec')
        .yields(null, [{
          chatId: 'stubChatId',
          notified: false,
          dateCreated: new Date()
        }]);
      UsageController.isAllowCommand(stubMsg).then(function onSuccess() {
        false.should.equal(true); // should fail
        done();
      }, function onFailure(dateCreatedMoment) {
        UsageMock.verify();
        UsageMock.restore();
        (dateCreatedMoment instanceof moment).should.equal(true);
        done();
      });
    });

    it('should allow if no record', function (done) {
      var UsageMock = sinon.mock(Usage);
      UsageMock
        .expects('find').withArgs({chatId: 'stubChatId'})
        .chain('sort').withArgs('-dateCreated')
        .chain('limit').withArgs(1)
        .chain('exec')
        .yields(null, []);
      UsageController.isAllowCommand(stubMsg).then(function onSuccess() {
        UsageMock.verify();
        UsageMock.restore();
        done();
      }, function onFailure() {
        false.should.equal(true); // should fail
        done();
      });
    });

  });

  describe('addUsage', function () {

    it('can save a usage', function (done) {
      var sinonStub = sinon.stub(Usage.prototype, 'save', function (callback) {
        callback( // err, savedObject, numAffected
          null,
          {
            '__v': 0,
            'chatId': 'stubChatId',
            '_id': '5705c45f6c3467f672cdff50',
            'dateCreated': '2016-04-07T02:22:23.185Z',
            'notified': false
          },
          1);
      });
      UsageController.addUsage(stubMsg).then(function onSuccess(savedObject) {
        savedObject.chatId.should.equal('stubChatId');
        savedObject.notified.should.equal(false);
        sinonStub.restore();
        done();
      });
    });

    it('can save a empty usage', function (done) {
      var stubEmptyMsg = {
        chat: {},
        from: {}
      };
      var sinonStub = sinon.stub(Usage.prototype, 'save', function (callback) {
        callback( // err, savedObject, numAffected
          null,
          {
            '__v': 0,
            'notified': false,
            'chatId': '',
            '_id': '56fccf467b5633c02fb4eb7e',
            'dateCreated': '2016-03-31T07:18:30.806Z'
          },
          1
        );
      });
      UsageController.addUsage(stubEmptyMsg).then(function (savedObject) {
        savedObject.chatId.should.equal('');
        savedObject.notified.should.equal(false);
        sinonStub.restore();
        done();
      });
    });

  });

});