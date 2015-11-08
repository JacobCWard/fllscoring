describe('ng-stages',function() {
    "use strict";

    var ngServices = factory('services/ng-services');
    var module = factory('services/ng-stages',{
        'services/ng-services': ngServices,
        'services/log': logMock
    });

    var $rootScope;
    var $stages;
    var $q;
    var mockStage;
    var mockStageSanitized;
    var unusedMockStage;
    var unusedMockStageSanitized;
    var fsMock;

    //initialize
    beforeEach(function() {
        mockStage = { id: "practice", name: "Oefenrondes", rounds: 2 };
        mockStageSanitized = { index: 0, id: "practice", name: "Oefenrondes", rounds: 2, $rounds: [1, 2] };
        unusedMockStage = { id: "unused", name: "Foobar", rounds: 0 };
        unusedMockStageSanitized = { index: 1, id: "unused", name: "Foobar", rounds: 0, $rounds: [] };
    })

    beforeEach(function() {
        fsMock = createFsMock({"stages.json": [mockStage]});
        angular.mock.module(module.name);
        angular.mock.module(function($provide) {
            $provide.value('$fs', fsMock);
        });
        angular.mock.inject(["$q", "$stages", "$rootScope", function(_$q_, _$stages_, _$rootScope_) {
            $q = _$q_;
            $rootScope = _$rootScope_;
            $stages = _$stages_;
        }]);
        // $stages needs to initialize itself, wait for that to
        // complete before starting each test.
        return $stages.init();
    });

    describe('init',function() {
        it('should load stages by default', function() {
            expect($stages.stages).toEqual([mockStageSanitized]);
        });
    });

    describe('save',function() {
        it('should write stages to stages.json',function() {
            return $stages.save().then(function() {
                expect(fsMock.write).toHaveBeenCalledWith('stages.json',[mockStage]);
            });
        });
        it('should log an error if writing fails',function() {
            fsMock.write.andReturn(Q.reject('aargh'));
            return $stages.save().then(function() {
                expect(logMock).toHaveBeenCalledWith('stages write error','aargh');
            });
        });
    });

    describe('load', function() {
        it('should load and sanitize stages',function() {
            return $stages.load().then(function() {
                expect($stages.stages).toEqual([mockStageSanitized]);
            });
        });
        it('should log an error if reading fails',function() {
            fsMock.read.andReturn(Q.reject('squeek'));
            return $stages.load().then(function() {
                expect(logMock).toHaveBeenCalledWith('stages read error','squeek');
            });
        });
        it('should initialize with default stages if reading fails',function() {
            fsMock.read.andReturn(Q.reject('squeek'));
            return $stages.load().then(function() {
                expect(logMock).toHaveBeenCalledWith('stages using defaults');
                expect($stages.allStages).toEqual([
                    {index:0,id:"practice",name:"Oefenrondes",rounds:2,$rounds:[1,2]},
                    {index:1,id:"qualifying",name:"Voorrondes",rounds:3,$rounds:[1,2,3]},
                    {index:2,id:"eighth",name:"Achtste finales",rounds:0,$rounds:[]},
                    {index:3,id:"quarter",name:"Kwartfinales",rounds:0,$rounds:[]},
                    {index:4,id:"semi",name:"Halve finales",rounds:0,$rounds:[]},
                    {index:5,id:"final",name:"Finale",rounds:1,$rounds:[1]}
                ]);
            });
        });
    });

    describe('remove',function() {
        it('should remove the provided id',function() {
            expect($stages.stages).toEqual([mockStageSanitized]);
            $stages.remove("practice");
            expect($stages.stages).toEqual([]);
        });
        it('should do nothing if id not found',function() {
            expect($stages.stages).toEqual([mockStageSanitized]);
            $stages.remove("foobar");
            expect($stages.stages).toEqual([mockStageSanitized]);
        });
    });

    describe('add',function() {
        it('should add a stage to the list and add autogen properties',function() {
            $stages.clear();
            var res = $stages.add(mockStage);
            expect($stages.stages).toEqual([mockStageSanitized]);
        });
        it('should reject duplicate stage ids',function() {
            $stages.clear();
            $stages.add(mockStage);
            expect(function() {
                $stages.add(mockStage);
            }).toThrow();
        });
        it('should maintain existing stages and allStages arrays', function() {
            $stages.clear();
            var allStages = $stages.allStages;
            var stages = $stages.stages;
            expect(allStages).toEqual([]);
            expect(stages).toEqual([]);
            $stages.add(mockStage);
            $stages.add(unusedMockStage);
            expect(allStages).toEqual([mockStageSanitized, unusedMockStageSanitized]);
            expect(stages).toEqual([mockStageSanitized]);
        });
    });

    describe('updateStage',function() {
        it('should update the raw stages with the given stage',function() {
            //change mockStage
            mockStageSanitized.rounds = 4;
            //$rounds not yet updated
            expect(mockStageSanitized.$rounds).toEqual([1,2]);
            $stages.updateStage(mockStageSanitized);
            //updated
            expect($stages.allStages).toEqual([
                {index:0,id:"practice",name:"Oefenrondes",rounds:4,$rounds:[1,2,3,4]}
            ]);
        });
        it('should throw an error if the stage is not found',function() {
            function doit() {
                $stages.updateStage({id:'foo'});
            }
            expect(doit).toThrow();
        })
    });

    describe('moveStage',function() {
        beforeEach(function() {
            //setup two stages
            $stages.clear();
            $stages.add(mockStage);
            $stages.add(unusedMockStage);
        })
        it('move down 1 step',function() {
            $stages.moveStage(mockStageSanitized,1);
            expect($stages.allStages).toEqual([
                { index: 0, id: "unused", name: "Foobar", rounds: 0, $rounds: [] },
                {index:1,id:"practice",name:"Oefenrondes",rounds:2,$rounds:[1,2]}
            ]);
        });
        it('move up 1 step',function() {
            $stages.moveStage(unusedMockStageSanitized,-1);
            expect($stages.allStages).toEqual([
                { index: 0, id: "unused", name: "Foobar", rounds: 0, $rounds: [] },
                {index:1,id:"practice",name:"Oefenrondes",rounds:2,$rounds:[1,2]}
            ]);
        });
    });

    describe('get',function() {
        it('should get a sanitized stage', function() {
            expect($stages.get("practice")).toEqual(mockStageSanitized);
        });
    });

    describe('_update',function() {
        it('should throw an error if stage is present twice',function() {
            $stages._rawStages = [mockStage,mockStage];
            expect(function() {
                $stages._update();
            }).toThrow('duplicate stage id practice');
        });
    });
});
