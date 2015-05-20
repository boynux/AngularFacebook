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
    this.initialized = false;
    var defaultParams = { appId: '', status: true, cookie: true, xfbml: true, version: 'v2.3' };
    var facebookEvents = {
        'auth': ['authResponseChange', 'statusChange', 'login', 'logout']
    };

    var Q = [];

    this.init = function (params) {
        window.fbAsyncInit = function() {
            angular.extend (defaultParams, params);
            FB.init(defaultParams);
    
            this.initialized = true;
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

        if (!this.initialized) {
            executeWhenInitialized (registerEventHandlers, this, []);
        } else {
            registerEventHandlers ();
        }

        var provider = this;
        return  {
            initialized: function () {
                return provider.initialized;
            },

            init: provider.init,
            api: api,
            login: login
        }
    }];
});

/**
 * @ngdoc directive
 * @name facebook
 * @restrict EA
 *
 * @description
 * Facebook initialization directive.
 *
 * @param {string} appId Facebook app id.
 *
 * @param {object} parameters initialization parameters, for details refer to init function
 *                 description.
 * @example
 *                  <facebook app-id="123456"></facebook>
 */

module.directive ('facebook', function ($location, facebook) {
    var template = "<div id='fb-root'></div>";

    var script = document.createElement('script');
    script.src = "//connect.facebook.net/en_US/sdk.js'"
    script.id = 'facebook-jssdk'
    script.async = true

    return {
        restrict:'EA',
        template: template,

        scope: {
            appId: '@',
            parameters: '='
        },

        link: function (scope, element, attrs) {
            if (!facebook.initialized ()) {
                document.body.appendChild(script);
                var parameters = scope.parameters || {};

                angular.extend (parameters, {appId: scope.appId});
                facebook.init (parameters);
            }
        }
    }
});

/**
 * @ngdoc directive
 * @name facebookLogin
 * @restrict E
 *
 * @description
 * Shows facebook login button.
 *
 * @param {string} size defines button size, possible values are 'icon', 'small', 'medium',
 *                 'large', 'xlarge'. default is "medium"
 * @param {boolean} autoLogout whether to show logout button after user logs into facebook.
 *                  default is false.
 * @param {boolean} showFaces shows friends icon whom subscribed into this ad.
 *                  default is false.
 * @param {string}  scope comma separated list of required permission that needs to be granted 
 *                  during login default is basic_info.
 *
 * @example
 *                  <facebook-login size="large" auto-logout="false"></facebook-login>
 */
module.directive ('facebookLogin', function () {
    var template =
        '<div class="fb-login-button" ' +
        'data-max-rows="1" ' +
        'data-size="{{size||\'medium\'}}" ' +
        'data-show-faces="{{!!showFaces}}" ' +
        'data-auto-logout-link="{{!!autoLogout}}" ' +
        'data-scope="{{scope || \'basic_info\'}}"' +
        '></div>';

    return {
        restrict: 'E',
        scope: {
            'autoLogout': '@',
            'size': '@',
            'showFaces': '@',
            'scope': '@'
        },
        template: template
    }
});

/**
 * @ngdoc directive
 * @name facebookLike
 * @restrict E
 *
 * @description
 * Shows facebook like/share/recommend button.
 *
 * @param {string} href indicates the page that will be liked. if not provided current
 *                 absolute URL will be used.
 * @param {string} colorScheme possible value are light and dark, default is 'light'
 * @param {string} layout possible values standard, button_count, box_count, 
 *                 default is 'standard'. see Facebook FAQ for more details: 
 *                  https://developers.facebook.com/docs/plugins/like-button/#faqlayouts
 * @param {boolean} showFaces whether to show profile photos below button, default is false
 * @param {boolean} share includes share button near like button, default is false
 * @param {string} action value can be 'like' or 'recommend', default is 'like'
 *
 * @example
 *                  <facebook-like show-faces="true" action="recommend"></facebook-like>
 */

module.directive('facebookLike', function ($location) {
    var template = '<div class="fb-like" ' +
        'data-href="{{href || currentPage}}" ' +
        'data-colorscheme="{{colorScheme || \'light\'}}" ' +
        'data-layout="{{layout || \'standard\'}}" ' +
        'data-action="{{ action || \'like\'}}" ' +
        'data-show-faces="{{!!showFaces}}" ' +
        'data-share="{{!!share}}"' +
        'data-action="{{action || \'like\'}}"' +
        'data-send="false"></div>';

    return {
        restrict:'E',
        scope: {
            'colorScheme': '@',
            'layout':      '@',
            'showFaces':   '@',
            'href':        '@',
            'action':      '@',
            'share':       '@',
        },
        template: template,
        link: function(scope, element, attrs) {
            scope.currentPage = $location.absUrl();
        },
    }
});

