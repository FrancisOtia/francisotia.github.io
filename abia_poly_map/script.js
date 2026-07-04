//============================================================
// MAPBOX ACCESS TOKEN
//============================================================

mapboxgl.accessToken =
  "pk.eyJ1IjoiY2hpZ2J1MjAyNiIsImEiOiJjbXI0ajc3bTkwZjRnMnlzZG1wbXlnbjhrIn0.gMAQ6mpltGk8-7UHiZ2xVA";

//============================================================
// CREATE MAP
//============================================================

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [7.3625, 5.1284],
    zoom: 17
});

//============================================================
// NAVIGATION CONTROLS
//============================================================

map.addControl(new mapboxgl.NavigationControl(), "top-left");

map.addControl(
    new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
    }),
    "top-left"
);

//============================================================
// GEOCODER
//============================================================

const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: false,
    placeholder: "Search for places",
    proximity: {
        longitude: 7.3625,
        latitude: 5.1284
    }
});

map.addControl(geocoder, "top-left");

//============================================================
// MAP LOAD
//============================================================

map.on("load", () => {

    //--------------------------------------------------------
    // BUILDINGS
    //--------------------------------------------------------

    map.addSource("abpol_buildings", {
        type: "geojson",
        data: "data/abpol_buildings.geojson"
    });

    map.addLayer({
        id: "abpol_buildings",
        type: "fill",
        source: "abpol_buildings",
        paint: {
            "fill-color": [
                "match",
                ["get", "Type"],
                "Bungalow", "rgb(76,175,80)",
                "One_Deck", "rgb(255,193,7)",
                "Two_Deck", "rgb(33,150,243)",
                "Three_Deck", "rgb(244,67,54)",
                "Galery_Deck", "rgb(156,39,176)",
                "rgba(180,180,180,0.5)"
            ],
            "fill-outline-color": "rgba(70,70,70,0.45)"
        }
    });

    //--------------------------------------------------------
    // FIELDS
    //--------------------------------------------------------

    map.addSource("abpol_fields", {
        type: "geojson",
        data: "data/abpol_fields.geojson"
    });

    map.addLayer({
        id: "abpol_fields",
        type: "fill",
        source: "abpol_fields",
        paint: {
            "fill-color": [
                "match",
                ["get", "Name"],
                "School_Field", "rgb(56,142,60)",
                "Basketball_Court", "rgb(255,111,0)",
                "VolleyBall_Pitch", "rgb(189,189,189)",
                "rgba(180,180,180,0.5)"
            ],
            "fill-outline-color": "rgba(70,70,70,0.45)"
        }
    });

    //--------------------------------------------------------
    // PERIMETER
    //--------------------------------------------------------

    map.addSource("abpol_perimeter", {
        type: "geojson",
        data: "data/abpol_perimeter.geojson"
    });

    map.addLayer({
        id: "abpol_perimeter",
        type: "line",
        source: "abpol_perimeter",
        paint: {
            "line-color": "rgb(8,8,87)",
            "line-width": 3
        }
    });

    //--------------------------------------------------------
    // LEGEND
    //--------------------------------------------------------

    const legendItems = [
        { name: "Bungalow", color: "rgb(76,175,80)" },
        { name: "One Deck", color: "rgb(255,193,7)" },
        { name: "Two Deck", color: "rgb(33,150,243)" },
        { name: "Three Deck", color: "rgb(244,67,54)" },
        { name: "Gallery Deck", color: "rgb(156,39,176)" },
        { name: "School Field", color: "rgb(56,142,60)" },
        { name: "Basketball Court", color: "rgb(255,111,0)" },
        { name: "Volleyball Pitch", color: "rgb(189,189,189)" }
    ];

    const legendBox = document.getElementById("legend");
    legendBox.innerHTML = ""; // Reset element

    // 1. Create a Header container to hold the title and toggle button
    const legendHeader = document.createElement("div");
    legendHeader.style.display = "flex";
    legendHeader.style.justifyContent = "space-between";
    legendHeader.style.alignItems = "center";
    legendHeader.style.marginBottom = "10px";

    const title = document.createElement("h3");
    title.textContent = "Legend";
    title.style.margin = "0";

    const legendButton = document.createElement("button");
    legendButton.id = "legend-toggle";
    legendButton.innerHTML = "🗺️ ▼";
    legendButton.style.cursor = "pointer";
    legendButton.style.padding = "2px 6px";

    legendHeader.appendChild(title);
    legendHeader.appendChild(legendButton);
    legendBox.appendChild(legendHeader);

    // 2. Create a separate container for the items list so we can hide/show it
    const legendContent = document.createElement("div");
    legendContent.id = "legend-content";

    legendItems.forEach(item => {
        const row = document.createElement("div");
        row.style.marginBottom = "6px";
        row.style.display = "flex";
        row.style.alignItems = "center";

        const key = document.createElement("span");
        key.className = "legend-key";
        key.style.backgroundColor = item.color;
        key.style.display = "inline-block";
        key.style.width = "12px";
        key.style.height = "12px";
        key.style.marginRight = "8px";

        const value = document.createElement("span");
        value.textContent = item.name;

        row.appendChild(key);
        row.appendChild(value);
        legendContent.appendChild(row);
    });

    legendBox.appendChild(legendContent);

    // 3. Toggle logic
    // Auto-collapse on small screens
    if (window.innerWidth < 768) {
        legendContent.style.display = "none";
        legendButton.innerHTML = "🗺️ ▲";
    }

    legendButton.addEventListener("click", () => {
        if (legendContent.style.display === "none") {
            legendContent.style.display = "block";
            legendButton.innerHTML = "🗺️ ▼";
        } else {
            legendContent.style.display = "none";
            legendButton.innerHTML = "🗺️ ▲";
        }
    });

    //--------------------------------------------------------
    // HOVER SOURCE
    //--------------------------------------------------------

    map.addSource("hover", {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features: []
        }
    });

    map.addLayer({
        id: "features-hover",
        type: "line",
        source: "hover",
        paint: {
            "line-color": "rgb(0,45,120)",
            "line-width": 4
        }
    });

    //--------------------------------------------------------
    // HOVER INTERACTION
    //--------------------------------------------------------

    map.on("mousemove", (event) => {
        const features = map.queryRenderedFeatures(event.point, {
            layers: ["abpol_buildings", "abpol_fields"]
        });

        if (features.length) {
            const feature = features[0];
            let html = `<h3>${feature.properties.Name || "Unnamed Feature"}</h3>`;

            if (feature.layer.id === "abpol_buildings") {
                html += `<strong>Type:</strong> ${feature.properties.Type || "Unknown"}`;
            }

            document.getElementById("pd").innerHTML = html;
        } else {
            document.getElementById("pd").innerHTML = "<p>Hover over the campus features!</p>";
        }

        map.getCanvas().style.cursor = features.length ? "pointer" : "";

        map.getSource("hover").setData({
            type: "FeatureCollection",
            features: features.map(f => ({
                type: "Feature",
                geometry: f.geometry
            }))
        });
    });
});
