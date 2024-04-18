$(function(){
    let markers = []; // global variable markers 
    let postcodes = {}; // global variable postcode
    let pois = {}; // global variable postcode
    // Initialize the map container, set the center and zoom position
    const map = L.map('map-container').setView([53.81716, -1.59969], 11)
    // add the arcgis server basemap 
    // World_Street_Map \ World_Topo_Map \ World_Imagery
    var grayscaleLayer = L.tileLayer(
        'https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', 
        { id: 'map11', maxZoom: 20, minZoom: 4 }
    );
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {  
    //     maxZoom: 19,  
    // }).addTo(map);
    map.addLayer(grayscaleLayer);

    // add watermark
    L.Control.Watermark = L.Control.extend({
        onAdd: function (map) {
            var img = L.DomUtil.create('img');

            img.src = './data/logo.png';
            img.style.width = '40px';

            return img;
        },

        onRemove: function (map) {
            // Nothing to do here
        }
    });

    L.control.watermark = function (opts) {
        return new L.Control.Watermark(opts);
    }

    L.control.watermark({ position: 'bottomleft' }).addTo(map);
    
    // map load end event
    map.whenReady( async () => {
        console.log('加载完成')
        // add Administrative Region polygon
        const leedswards = await getGeoJson('./data/leeds_wards.json')
        L.geoJSON(leedswards, {
            style: function (feature) {
                return {
                    weight: 1,
                    color: '#fff',
                    opacity: 0.8,
                    fillColor: '#3a8ada',
                    fillOpacity: 0.4,
                };
            },
            onEachFeature: function (feature, layer) {
                var customIcon = L.divIcon({  
                    className: 'my-custom-label', // custom css 
                    html: '' + feature.properties.name, // lebel  
                    iconSize: [100, 20], // size
                    // iconAnchor: [50, 25], // anchor  
                    // popupAnchor: [0, -25] //  
                });  
                var feature = turf.feature(feature.geometry)
                var centroid = turf.centroid(feature);
                var marker = L.marker(centroid.geometry.coordinates.reverse(), { icon: customIcon }).addTo(map);  
            }
        }).addTo(map);

        // add poi point
        const geojsonData = await getGeoJson('./data/Community with postcodes Apr_2020-with-coordinates.json')
        console.log(geojsonData)
        pois = geojsonData
        var geojsonMarkerOptions = {
            radius: 80,
            fillColor: "#00bfff",
            color: "#fff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9
        };
        L.geoJSON(geojsonData, {
            onEachFeature: function (feature, layer) {
                let html = `<div>
                    ${Object.keys(feature.properties).map(key=>{
                        return `<div><b>${key}:</b>${feature.properties[key]}</div>`
                    }).join('')}
                </div>`
                layer.bindTooltip(html, {
                    direction: 'right',
                    permanent: false
                });
            },
            pointToLayer: function (feature, latlng) {
                return L.circle(latlng, geojsonMarkerOptions).openTooltip();
            }
        }).addTo(map);


        $.get('./data/Leeds postcodes.json' , function(data){
            postcodes = data;
        })
    })
    

    async function getGeoJson(url){
        return new Promise(function(resolve, reject){
            $.get(url).then(function(data){
                resolve(data)
            },function(err){
                reject(err)
            })
        })
    }

    // poi search
    $('#postcode_btn').click(function(){
        let postcode = $('#postcode').val()
        if (postcode.trim() === '') {
            alert('please input postcode !')
            return;
        } else {
            clearMarkers()
            let feature = postcodes.features.find(item => {
                const { Postcode , Latitude, Longitude } =  item.properties
               return  Postcode === postcode
            })
            if (feature) {
                const { Postcode , Latitude, Longitude } =  feature.properties
                let html = `<div>
                    ${Object.keys(feature.properties).map(key=>{
                        return `<div><b>${key}:</b>${feature.properties[key]}</div>`
                    }).join('')}
                </div>`

                markers.push(L.marker([Latitude, Longitude])
                .bindPopup(html)
                .addTo(map));

                map.flyTo([Latitude, Longitude], 12)
            } else {
                alert('no found !')
            }
            
        }
    })

    $('#poiname_btn').click(function(){
        let poiname = $('#poiname').val()
        if (poiname.trim() === '') {
            alert('please input poi name !')
            return;
        } else {
            clearMarkers()
            let features = pois.features.filter(item => {
                const {  Latitude, Longitude } =  item.properties

               return item.properties['Primary Name'] && item.properties['Primary Name'].includes(poiname)
            })
            if (features?.length) {
                features.forEach(feature=>{
                    const { Latitude, Longitude } =  feature.properties
                    let html = `<div>
                        ${Object.keys(feature.properties).map(key=>{
                            return `<div><b>${key}:</b>${feature.properties[key]}</div>`
                        }).join('')}
                    </div>`
                    markers.push(L.marker([Latitude, Longitude])
                    .bindPopup(html)
                    .addTo(map));
                })
                map.flyTo([features[0].properties.Latitude, features[0].properties.Longitude], 12)
            } else {
                alert('no found !')
            }
        }
    })

    function clearMarkers(){
        markers.forEach(marker=>{
            marker.remove()
        })
    }

})