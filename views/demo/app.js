var app = angular.module('app', ['ngMaterial','ngMap']);

app.controller('controller', function($scope,$http){
  $scope.currentLocation = [10.931181, -74.799264]
  $scope.currentPickup = [10.939751, -74.801157];
  $scope.currentDropoff = [10.994463, -74.805664];
  $scope.optionPickup = [10.951361, -74.803389];
  $scope.optionDropoff = [10.987860, -74.797211];
  $scope.calcular = function(){
    let osrm = "https://router.project-osrm.org/route/v1/driving/"+
    $scope.currentLocation[1]+","+$scope.currentLocation[0]+";"+
    $scope.currentPickup[1]+","+$scope.currentPickup[0]+";"+
    $scope.currentDropoff[1]+","+$scope.currentDropoff[0];
    let validate = {
      currentLocation: $scope.currentLocation,
      currentPickup:$scope.currentPickup,
      currentDropoff:$scope.currentDropoff,
      optionPickup:$scope.optionPickup,
      optionDropoff:$scope.optionDropoff
    };
    if($scope.currentPickupTime && $scope.currentPickupTime !== ""){
      validate.currentPickupTime = $scope.currentPickupTime;
      delete validate.currentPickup;
    }
    if($scope.currentAppointmentTime && $scope.currentAppointmentTime !== "")
      validate.currentAppointmentTime = $scope.currentAppointmentTime;
    if($scope.optionAppointmentTime && $scope.optionAppointmentTime !== "")
      validate.optionAppointmentTime = $scope.optionAppointmentTime;
    $http.get(osrm).then(function(response){
      $scope.osrm = transformar(response.data.routes[0].geometry);
    });
    let port = window.location.port;
    $http.post(window.location.protocol + '//' + window.location.hostname + 
    (port ? ":"+port:"") +"/isViable",validate).then((response)=>{
      alert(response.data.result);
    });
  }
  $scope.mover = function(event,puntero){
  	let ll = event.latLng;
  	$scope[puntero] = [ll.lat(),ll.lng()];
  }
  let transformar = function(path){
  	return google.maps.geometry.encoding.decodePath(path);
  }
});