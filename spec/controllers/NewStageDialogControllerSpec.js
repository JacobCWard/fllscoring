describe('NewStageDialogController',function() {

    var module = factory('controllers/NewStageDialogController',{
        'services/log': logMock,
    });

    var $scope, controller, handshakeMock;

    beforeEach(function() {
        angular.mock.module(module.name);
        angular.mock.inject(function($controller,$rootScope,$q) {
            $scope = $rootScope.$new();
            handshakeMock = createHandshakeMock($q);
            controller = $controller('NewStageDialogController', {
                '$scope': $scope,
                '$handshake': handshakeMock
            });
        });
    });

    describe('handshake receive',function() {
        it('should show the dialog',function() {
            handshakeMock.fire('newStage');
            expect($scope.stage).toEqual({rounds:1});
            expect($scope.dialogVisible).toBe(true);
        });
    });

    describe('ok ',function() {
        it('should hide the dialog',function() {
            handshakeMock.fire('newStage',{});
            $scope.dialogVisible = true;
            $scope.stage = {
                name: 'foo',
                rounds: 42
            };
            $scope.ok();
            expect($scope.dialogVisible).toBe(false);
            expect(handshakeMock.getPromise().resolve).toHaveBeenCalledWith({
                stage: {
                    name: 'foo',
                    rounds: 42
                }
            });
        });
    });

    describe('cancel',function() {
        it('should hide the dialog',function() {
            handshakeMock.fire('newStage',{});
            $scope.dialogVisible = true;
            $scope.cancel();
            expect($scope.dialogVisible).toBe(false);
            expect(handshakeMock.getPromise().resolve).toHaveBeenCalled();
        });
    });
});
