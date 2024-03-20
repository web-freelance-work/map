var map;
var circle;
var marker;
var facilityMarkers = []; // 기존 마커들을 담는 배열
var clickedMarker;

// 목포를 기본 지도로
function selectMapList() {
    if (map) {
        map.destroy();
    }
    map = new naver.maps.Map('map', {
        center: new naver.maps.LatLng(34.8026, 126.3898),
        zoom: 14,
    });

    // 지도를 클릭했을 때 이벤트 등록
    naver.maps.Event.addListener(map, 'click', function (e) {
        var latlng = e.coord;
        updateMarker(latlng);

        removeFacilityMarkers();
        clickedMarker = null;
    });
}

// 지도를 그려주는 함수
selectMapList();

// 검색한 주소의 정보를 insertAddress 함수로
function searchAddressToCoordinate(address) {
    naver.maps.Service.geocode({
        query: address
    }, function (status, response) {
        if (status === naver.maps.Service.Status.ERROR) {
            return alert('Something Wrong!');
        }
        if (response.v2.meta.totalCount === 0) {
            return alert('올바른 주소를 입력해주세요.');
        }

        var htmlAddresses = [],
            item = response.v2.addresses[0],
            latlng = new naver.maps.LatLng(item.y, item.x);

        if (item.roadAddress) {
            htmlAddresses.push('[도로명 주소] ' + item.roadAddress);
        }
        if (item.jibunAddress) {
            htmlAddresses.push('[지번 주소] ' + item.jibunAddress);
        }
        if (item.englishAddress) {
            htmlAddresses.push('[영문명 주소] ' + item.englishAddress);
        }

        insertAddress(item.roadAddress, latlng);
    });
}

// 주소 검색 버튼 이벤트
$('#address').on('keydown', function (e) {
    var keyCode = e.which;
    if (keyCode === 13) {
        searchAddressToCoordinate($('#address').val());
    }
});
$('#submit').on('click', function (e) {
    e.preventDefault();
    console.log("test");
    searchAddressToCoordinate($('#address').val());
});

naver.maps.onJSContentLoaded = selectMapList;

// 검색한 주소 지도에 마커 표시
function insertAddress(address, latlng) {
    updateMarker(latlng);
    map.setCenter(latlng);
    map.setZoom(15);
    sendCoordinatesToServer(latlng.y, latlng.x);
}


// 마커 업데이트
function updateMarker(latlng) {
    // 기존 마커와 반경 초기화
    if (circle) {
        circle.setMap(null);
    }

    if (marker) {
        marker.setMap(null);
    }

    marker = new naver.maps.Marker({
        map: map,
        position: latlng,
    });

    // 반경 생성
    circle = new naver.maps.Circle({
        map: map,
        center: latlng,
        radius: 500, // 반경 500m
        fillColor: '#4285F4',
        fillOpacity: 0.2,
        strokeColor: '#4285F4',
        strokeOpacity: 0.5,
        strokeWeight: 2,
    });

    sendCoordinatesToServer(latlng.y, latlng.x);
}


// 좌표 전송
function sendCoordinatesToServer(lat, lng) {
    $.ajax({
        url: '/facility/around',
        method: 'GET',
        data: {
            lat: lat,
            lng: lng
        },
        success: function (response) {
            // 기존 마커들 제거
            removeFacilityMarkers();
            if (Array.isArray(response) && response.length > 0) {
                for (var i = 0; i < response.length; i++) {
                    var facility = response[i];
                    var facilityLatlng = new naver.maps.LatLng(facility.lat, facility.lng);
                    var facilityMarker = new naver.maps.Marker({
                        map: map,
                        position: facilityLatlng,
                        title: facility.name
                    });
                    // 새로운 마커를 배열에 추가
                    facilityMarkers.push(facilityMarker);
                }
            } else {
                alert('주변에 시설이 없습니다.');
            }
        },
        error: function (request, status, error) {
            console.error('주변 시설을 불러오는 중 에러 발생', error);
            alert('주변 시설을 불러오지 못했습니다. 다시 시도해주세요.');
        }
    });
}
// 기존 마커들을 모두 제거하는 함수
function removeFacilityMarkers() {
    for (var i = 0; i < facilityMarkers.length; i++) {
        facilityMarkers[i].setMap(null);
    }
    facilityMarkers = [];
}

document.addEventListener('DOMContentLoaded', function () {
    var sidebar = document.querySelector('.sidebar');
    var toggleButton = document.querySelector('.toggle-btn');
    
    toggleButton.addEventListener('click', function () {
        // 사이드바의 상태를 토글합니다.
        sidebar.classList.toggle('sidebar-collapsed');
        
        // 사이드바가 접힌 상태면 버튼도 왼쪽으로 이동합니다.
        if (sidebar.classList.contains('sidebar-collapsed')) {
            toggleButton.style.left = '0px'; // 버튼을 왼쪽으로 이동시킵니다.
            toggleButton.textContent = '<'; // 버튼의 텍스트를 변경합니다.
        } else {
            toggleButton.style.left = '400px'; // 버튼을 원래 위치로 되돌립니다.
            toggleButton.textContent = '>';
        }
    });
});
