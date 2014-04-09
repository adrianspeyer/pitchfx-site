'use strict';

/**
 * A controller that manages hitting stats for a player
 */
angular.module('pitchfxApp').controller('FiltersCtrl', [ '$scope', '$log', '$timeout', '$angularCacheFactory', '$routeParams', '$route', '$location', '$modal', 'Filters', function($scope, $log, $timeout, $angularCacheFactory, $routeParams, $route, $location, $modal, filtersService)
{

    $scope.dateInputSupported = Modernizr.inputtypes.date;

    /**
     * Gets the recommended starting date for the filters.
     * 
     * If we're in May or later, the starting date will be the 1st of the
     * current year. If we're earlier than May, the starting date will be the
     * 1st of the prior year.
     */
    function getStartingDate()
    {
        var currentMonth = moment().month(), currentYear = moment().year();
        if (currentMonth < 4)
        {
            /* last year */
            return moment([ currentYear - 1, 0, 1 ]).format('YYYY-MM-DD');
        } else
        {
            /* this year */
            return moment([ currentYear, 0, 1 ]).format('YYYY-MM-DD');
        }
    }

    function init()
    {
        var filterCache = $angularCacheFactory('filterCache', {
            storageMode : 'localStorage',
            maxAge : 3600000,
            deleteOnExpire : 'aggressive',
            recycleFreq : 60000,
            cacheFlushInterval : 3600000,
        }), filtersFromUrl = $location.search().filter, parsedFilters, filtersFromCache;

        if (filtersFromUrl)
        {
            parsedFilters = JSON.parse(filtersFromUrl)[0];
            $scope.filters = parsedFilters;
        } else
        {
            filtersFromCache = filterCache.get('filters');
            if (filtersFromCache && filtersFromCache.length > 0)
            {
                $scope.filters = filtersFromCache[0];
                $scope.filters.playerCard = ($scope.playerPosition === '1') ? 'pitcher' : 'batter';
                if ($scope.playerPosition === '1')
                {
                    $scope.filters.pitcherHand = '';
                } else if ($scope.playerBats !== 'S')
                {
                    $scope.filters.batterHand = '';
                }
            } else
            {
                $scope.filters = {
                    playerCard : ($scope.playerPosition === '1') ? 'pitcher' : 'batter',
                    pitcherHand : '',
                    batterHand : '',
                    date : {
                        start : getStartingDate(),
                        end : moment().format('YYYY-MM-DD'),
                    },
                    runners : {
                        gate : 'OR',
                    },
                    outs : {},
                    balls : {},
                    strikes : {},
                    gameType : {
                        R : true,
                    }
                };
            }
        }

        $scope.$watch('[filters]', function(filters)
        {
            filterCache.put('filters', filters);
            filtersService.filters = filters;
            _gaq.push([ '_trackEvent', 'filters', 'atbats', $scope.playerId ]);
        }, true);
    }

    /**
     * Save the current filter
     */
    $scope.pinFilter = function()
    {
        var modalInstance = $modal.open({
            templateUrl : '/partials/newFilterModal.html',
            controller : 'NewfiltermodalCtrl',
        });

        modalInstance.result.then(function(filterName)
        {
            filtersService.pinFilter(filterName, $scope.filters);
        });
    };

    init();
} ]);
