/*
 * AngularJs module for Facebook API.
 *
 * Author: Boynux <reachme@boynux.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 */

var module = angular.module ('bnx.module.facebook', [])
.provider ('facebook', function facebookProvider ($injector) {
    var initialized = false;
    var defaultParams = { appId: '123456', status: true, cookie: true, xfbml: true };
    var facebookEvents = {
        'auth': ['authResponseChange', 'statusChange', 'login', 'logout']
    };

    var Q = [];

    this.init = function (params) {
        window.fbAsyncInit = function() {
            $.extend (defaultParams, params);
            FB.init(defaultParams);
    
            initialized = true;
            console.log ("Facebook initialization done.");

            processPostInitializeQ ();
        };
    };

    function executeWhenInitialized (callback, self, args) {
        console.log ("adding to Q: ", callback);
        Q.push ([callback, self, args]);
    };


    var processPostInitializeQ = function () {
        console.log ('Processing Q messages.');
        while (item = Q.shift ()) {

            func = item[0];
            self = item[1];
            args = item[2];

            func.apply (self, args);
        }
    };


    this.$get = ["$rootScope", "$q",  function ($rootScope, $q) {
        var promise = function (func) {
            var deferred = $q.defer ();

            func (function (response) {
                if (response && response.error) {
                    deferred.reject (response);
                } else {
                    deferred.resolve (response);
                }

                $rootScope.$apply ();
            });

            return deferred.promise;
        };

        var registerEventHandlers = function () {
            angular.forEach (facebookEvents, function (events, domain) {
                angular.forEach (events, function (_event) {
                    FB.Event.subscribe (domain + '.' + _event, function (response) {
                        $rootScope.$broadcast('fb.' + domain + '.' + _event, response);
                    });
                });
            });
        };
 
        var login = function (params) {
            return promise (function (callback) {
                FB.login (function (response) {
                    callback (response);
                }, params);
            });
        }
       
        var api = function (path) {
            return promise (function (callback) {
                FB.api (path, function (response) {
                    callback (response);
                });
            });
        }

        if (!initialized) {
            executeWhenInitialized (registerEventHandlers, this, []);
        } else {
            registerEventHandlers ();
        }

        return  {
            api: api,
            login: login
        }
    }];
});

module.directive ('facebook', function ($location, facebook) {
    var template = 
        "<div id='fb-root'><script type='text/javascript' async='true' src='" + 
        "//connect.facebook.net/en_US/all.js' id='facebook-jssdk'></script></div>";

    return {
        restrict:'EA',
        template: template,
    }
});

