function initialize() {
    var mapCanvas = document.getElementById('map-canvas');
    var mapOptions = {
        center: new google.maps.LatLng(44.5403, -78.5463),
        zoom: 3,
        minZoom: 3,
        maxZoom: 14,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var map = new google.maps.Map(mapCanvas, mapOptions);

    var input = document.getElementById('pac-input');

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    var searchOptions = {
        types: ['cities']
    };

    var autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.bindTo('bounds', map);

    var infowindow = new google.maps.InfoWindow();
    var marker = new google.maps.Marker({
        map: map,
        anchorPoint: new google.maps.Point(0, -29)
    });

    var getAddress = function (place) {

        var address = $(place.adr_address);

        var cityName = address.filter('span.locality').text();
        var stateName = address.filter('span.region').text();
        var countryName = address.filter('span.country-name').text();

        var totalAddress = cityName.concat(' ', stateName, ' ', countryName);

        return totalAddress;
    };

    google.maps.event.addListener(autocomplete, 'place_changed', function () {
        infowindow.close();
        marker.setVisible(false);

        var place = autocomplete.getPlace();

        if (!place.geometry) {
            return;
        }

        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
        }
        marker.setIcon(({
            url: place.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(35, 35)
        }));
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);

        getAddress(place);

        infowindow.setContent('<div><strong>' + place.name + '</strong><br>'); // REPLACE ADDRESS WITH TWEETS
        infowindow.open(map, marker);
    });

}
google.maps.event.addDomListener(window, 'load', initialize);
