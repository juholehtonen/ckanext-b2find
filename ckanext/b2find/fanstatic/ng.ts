/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/lodash/lodash.d.ts" />

const app = angular.module('b2findApp', []);
const controllers = {};


controllers.BasicFacetController = function ($scope) {
    $scope.facetMinLimit = 10;
    $scope.facetMaxLimit = 100;

    const params = getJsonFromUrl();

    /** Bail out if basic_facets not defined */
    if (typeof basic_facets === 'undefined') {
        return;
    }

    for (let k in basic_facets) {
        if (basic_facets.hasOwnProperty(k)) {
            // Copy properties over
            $scope[k] = basic_facets[k];

            // Set default limit for facet items
            $scope[k].limit = $scope.facetMinLimit;

            // Set default order
            $scope[k].order = "-c";

            $scope[k].data.forEach(function (e) {
                // Set truncated label (lazily)
                define(e, 't', () => truncate(e.l));

                // Set deburred (ascii) label (lazily)
                define(e, 'd', () => _.deburr(e.l));

                // Set element activity state (lazily)
                define(e, 'a', ((x, y) =>
                    () => params[x] ?
                        params[x].some((value) => value == (y.n ? y.n : y.l))
                        : false)($scope[k].name, e));

                // Set element href
                e.h = "/dataset?" + jQuery.param((function (name, n_params) {
                        if (!n_params[name]) {
                            n_params[name] = [];
                        }
                        const value = e.n ? e.n : e.l;
                        if (_.includes(n_params[name], value)) {
                            _.pull(n_params[name], value);
                        }
                        else {
                            n_params[name].push(value);
                        }
                        return n_params;
                    })($scope[k].name, angular.copy(params)), true);
            });

            // Set facet activity state
            $scope[k].active = Boolean(params[$scope[k].name]);
        }
    }

    // Free basic_facets
    basic_facets = null;

    /** Truncates a string to length */
    function truncate(str:string, len:number) {
        if (!str) {
            return "";
        }
        if (!len) {
            len = 22;
        }
        if (str.length <= len) {
            return str;
        }
        return str.substr(0, len) + "...";
    }

    /**
     * Defines a lazy property on object
     * Copyright (c) 2012 John Crepezzi
     * The MIT License
     * https://github.com/seejohnrun/laze
     */
    function define(obj, prop, def) {
        Object.defineProperty(obj, prop, {
            configurable: true,
            enumerable: true,
            get: function () {
                const value = def.bind(this)();
                Object.defineProperty(this, prop, {
                    value: value,
                    configurable: false,
                    writable: false
                });
                return value;
            }
        });
    }

    /**
     * Bulk defines lazy properties on object
     * Copyright (c) 2012 John Crepezzi
     * The MIT License
     * https://github.com/seejohnrun/laze
     */
    function defineAll(obj, props) {
        for (let key in props) {
            if (props.hasOwnProperty(key)) {
                define(obj, key, props[key]);
            }
        }
    }

    $scope.deburr = _.deburr;
};

app.controller(controllers);

// Modification of http://stackoverflow.com/a/8486188
function getJsonFromUrl() {
    const query = location.search.substr(1);
    const result = {};
    query.split("&").forEach(function (part) {
        const item = part.split("=");
        if (item[1]) {
            if (!result[item[0]]) {
                result[item[0]] = [];
            }
            result[item[0]].push(decodeURIComponent(item[1]).replace(/\+/g, " "));
        }
    });
    return result;
}
