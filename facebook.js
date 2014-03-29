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

        (function() {
            var e = document.createElement('script');
            e.type = 'text/javascript';
            e.src = document.location.protocol + '//connect.facebook.net/en_US/all.js';
            e.async = true;
            document.getElementById('fb-root').appendChild(e);
        }(document));

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

