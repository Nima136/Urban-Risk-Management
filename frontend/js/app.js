console.log("UrbanRisk dashboard initializing...");

// ============================================================
// ML PREDICTION CACHE
// ============================================================

const mlRiskCache = {
    Flood: {},
    Accident: {}
};

// ============================================================
// ML API
// ============================================================

const ML_API_URL =
    "http://127.0.0.1:5000/predict";

// ============================================================
// ML PREDICTION CACHE
// ============================================================




// ============================================================
// GET ML RISK
// ============================================================

async function getMLRisk(
    type,
    features
) {

    if (!features) {
        return 0;
    }

    const cacheKey =
        `${type}:${JSON.stringify(features)}`;


    if (
        Object.prototype.hasOwnProperty.call(
            mlRiskCache,
            cacheKey
        )
    ) {

        return mlRiskCache[cacheKey];

    }


    try {

        const response =
            await fetch(
                ML_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        type,

                        features

                    })

                }
            );


        if (!response.ok) {

            throw new Error(
                `ML API HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        if (
            !result.success
        ) {

            throw new Error(
                result.error ||
                "ML prediction failed"
            );

        }


        const risk =
            Number(result.risk);


        if (
            !Number.isFinite(risk)
        ) {

            throw new Error(
                "Invalid ML risk returned"
            );

        }


        mlRiskCache[cacheKey] =
            risk;


        console.log(
            `ML prediction ${type}:`,
            risk
        );


        return risk;

    }

    catch (error) {

        console.error(
            "ML API error:",
            error
        );


        return 0;

    }

}

// ============================================================
// MAP
// ============================================================

const map = L.map("riskMap").setView(
    [18.5204, 73.8567],
    12
);


// ============================================================
// MAP LAYERS
// ============================================================

const riskLayer = L.layerGroup().addTo(map);
const hotspotLayer = L.layerGroup();


// ============================================================
// OPENSTREETMAP
// ============================================================

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);


// ============================================================
// GLOBAL STATE
// ============================================================

let selectedRisk = "All";
let selectedWard = "All";

let selectedZone = null;
let selectedIntervention = null;

let wardGeoJSONLayer = null;

const zoneDetails =
    document.getElementById("zoneDetails");

const closeZoneDetails =
    document.getElementById("closeZoneDetails");


// ============================================================
// RISK COLOR
// ============================================================

function getRiskColor(risk) {

    risk = Number(risk) || 0;

    if (risk >= 80) {
        return "#ff5d67";
    }

    if (risk >= 60) {
        return "#ff9f43";
    }

    if (risk >= 40) {
        return "#f4c95d";
    }

    return "#37d58a";
}


// ============================================================
// RISK SEVERITY
// ============================================================

function getRiskSeverity(score) {

    score = Number(score) || 0;

    if (score >= 80) {
        return "Critical";
    }

    if (score >= 60) {
        return "High";
    }

    if (score >= 40) {
        return "Moderate";
    }

    return "Low";
}


// ============================================================
// RISK WEIGHTS
// ============================================================

const riskWeights = {

    flood: {

        drainage: 0.30,
        rainfall: 0.25,
        history: 0.20,
        complaints: 0.15,
        surface: 0.10

    },

    accident: {

        roadCondition: 0.30,
        history: 0.25,
        traffic: 0.20,
        complaints: 0.15,
        lighting: 0.10

    }

};


// ============================================================
// FLOOD RISK CALCULATION
// ============================================================

function calculateFloodRisk(data) {

    if (!data) {
        return 0;
    }

    if (
        typeof UrbanRiskML !== "undefined"
    ) {

        return UrbanRiskML.predict(
            data,
            "Flood"
        );

    }

    return 0;
}


// ============================================================
// ACCIDENT RISK CALCULATION
// ============================================================

function calculateAccidentRisk(data) {

    if (!data) {
        return 0;
    }

    if (
        typeof UrbanRiskML !== "undefined"
    ) {

        return UrbanRiskML.predict(
            data,
            "Accident"
        );

    }

    return 0;
}


// ============================================================
// FLOOD DATA
// ============================================================

const floodRiskData = {

    27: {
        drainage: 92,
        rainfall: 86,
        history: 79,
        complaints: 72,
        surface: 68
    },

    18: {
        drainage: 88,
        rainfall: 84,
        history: 75,
        complaints: 70,
        surface: 65
    },

    12: {
        drainage: 81,
        rainfall: 76,
        history: 72,
        complaints: 64,
        surface: 58
    },

    5: {
        drainage: 42,
        rainfall: 38,
        history: 31,
        complaints: 27,
        surface: 35
    }

};


// ============================================================
// ACCIDENT DATA
// ============================================================

const accidentRiskData = {

    27: {
        roadCondition: 64,
        history: 58,
        traffic: 72,
        complaints: 61,
        lighting: 55
    },

    31: {
        roadCondition: 82,
        history: 88,
        traffic: 84,
        complaints: 76,
        lighting: 71
    },

    9: {
        roadCondition: 67,
        history: 74,
        traffic: 69,
        complaints: 61,
        lighting: 52
    },

    12: {
        roadCondition: 58,
        history: 62,
        traffic: 55,
        complaints: 48,
        lighting: 43
    }

};

// ============================================================
// LOAD ML PREDICTIONS
// ============================================================

async function loadMLPredictions() {

    console.log(
        "Loading ML predictions..."
    );


    const requests = [];


    // --------------------------------------------------------
    // FLOOD WARDS
    // --------------------------------------------------------

    Object.entries(
        floodRiskData
    ).forEach(
        ([ward, features]) => {

            requests.push(

                getMLRisk(
                    "Flood",
                    features
                ).then(
                    risk => {

                        floodRiskData[
                            ward
                        ].mlRisk = risk;

                    }
                )

            );

        }
    );


    // --------------------------------------------------------
    // ACCIDENT WARDS
    // --------------------------------------------------------

    Object.entries(
        accidentRiskData
    ).forEach(
        ([ward, features]) => {

            requests.push(

                getMLRisk(
                    "Accident",
                    features
                ).then(
                    risk => {

                        accidentRiskData[
                            ward
                        ].mlRisk = risk;

                    }
                )

            );

        }
    );


    await Promise.all(
        requests
    );


    console.log(
        "ML predictions loaded:",
        {
            flood: floodRiskData,
            accident: accidentRiskData
        }
    );

}

// ============================================================
// LOAD ML PREDICTIONS
// ============================================================

async function loadMLPredictions() {

    console.log(
        "Loading UrbanRisk ML predictions..."
    );


    // --------------------------------------------------------
    // FLOOD
    // --------------------------------------------------------

    for (
        const ward in floodRiskData
    ) {

        try {

            const risk =
                await UrbanRiskML.predict(
                    floodRiskData[ward],
                    "Flood"
                );


            mlRiskCache.Flood[ward] =
                risk;


            console.log(
                `Flood Ward ${ward}:`,
                risk
            );

        }

        catch (error) {

            console.error(
                `Flood prediction failed for Ward ${ward}:`,
                error
            );

        }

    }


    // --------------------------------------------------------
    // ACCIDENT
    // --------------------------------------------------------

    for (
        const ward in accidentRiskData
    ) {

        try {

            const risk =
                await UrbanRiskML.predict(
                    accidentRiskData[ward],
                    "Accident"
                );


            mlRiskCache.Accident[ward] =
                risk;


            console.log(
                `Accident Ward ${ward}:`,
                risk
            );

        }

        catch (error) {

            console.error(
                `Accident prediction failed for Ward ${ward}:`,
                error
            );

        }

    }


    console.log(
        "UrbanRisk ML predictions loaded:",
        mlRiskCache
    );

}

// ============================================================
// WARD RISK
// ============================================================

function calculateWardRisk(ward, type) {

    if (
        mlRiskCache[type] &&
        mlRiskCache[type][ward] !== undefined
    ) {

        return mlRiskCache[type][ward];

    }


    return 0;

}


// ============================================================
// RISK FACTORS
// ============================================================

function getRiskFactors(ward, type) {

    if (type === "Flood") {

        return floodRiskData[ward] || {

            drainage: 0,
            rainfall: 0,
            history: 0,
            complaints: 0,
            surface: 0

        };

    }

    return accidentRiskData[ward] || {

        roadCondition: 0,
        history: 0,
        traffic: 0,
        complaints: 0,
        lighting: 0

    };

}


// ============================================================
// RISK ZONES
// ============================================================

const riskZones = [

    {
        id: "A12",
        ward: 27,
        lat: 18.531,
        lng: 73.856,
        risk: 0,
        type: "Flood",
        severity: "Critical"
    },

    {
        id: "B14",
        ward: 18,
        lat: 18.515,
        lng: 73.875,
        risk: 0,
        type: "Flood",
        severity: "Critical"
    },

    {
        id: "C08",
        ward: 31,
        lat: 18.538,
        lng: 73.825,
        risk: 0,
        type: "Accident",
        severity: "High"
    },

    {
        id: "D07",
        ward: 12,
        lat: 18.505,
        lng: 73.845,
        risk: 0,
        type: "Flood",
        severity: "High"
    },

    {
        id: "E21",
        ward: 9,
        lat: 18.545,
        lng: 73.885,
        risk: 0,
        type: "Accident",
        severity: "High"
    },

    {
        id: "F03",
        ward: 5,
        lat: 18.495,
        lng: 73.865,
        risk: 0,
        type: "Flood",
        severity: "Moderate"
    }

];


// ============================================================
// MICRO ZONES
// ============================================================

const microZones = [

    {
        id: "A12-1",
        ward: 27,
        risk: 0,
        type: "Flood",
        localFactor: 1.10,

        coordinates: [
            [18.534, 73.850],
            [18.534, 73.860],
            [18.528, 73.860],
            [18.528, 73.850]
        ]
    },

    {
        id: "A12-2",
        ward: 27,
        risk: 0,
        type: "Flood",
        localFactor: 0.92,

        coordinates: [
            [18.528, 73.850],
            [18.528, 73.860],
            [18.522, 73.860],
            [18.522, 73.850]
        ]
    },

    {
        id: "A12-3",
        ward: 27,
        risk: 0,
        type: "Accident",
        localFactor: 0.55,

        coordinates: [
            [18.534, 73.860],
            [18.534, 73.870],
            [18.528, 73.870],
            [18.528, 73.860]
        ]
    },

    {
        id: "B14-1",
        ward: 18,
        risk: 0,
        type: "Flood",
        localFactor: 1.08,

        coordinates: [
            [18.520, 73.868],
            [18.520, 73.878],
            [18.514, 73.878],
            [18.514, 73.868]
        ]
    },

    {
        id: "B14-2",
        ward: 18,
        risk: 0,
        type: "Flood",
        localFactor: 0.86,

        coordinates: [
            [18.514, 73.868],
            [18.514, 73.878],
            [18.508, 73.878],
            [18.508, 73.868]
        ]
    },

    {
        id: "C08-1",
        ward: 31,
        risk: 0,
        type: "Accident",
        localFactor: 1.08,

        coordinates: [
            [18.542, 73.820],
            [18.542, 73.830],
            [18.536, 73.830],
            [18.536, 73.820]
        ]
    },

    {
        id: "C08-2",
        ward: 31,
        risk: 0,
        type: "Accident",
        localFactor: 0.78,

        coordinates: [
            [18.536, 73.820],
            [18.536, 73.830],
            [18.530, 73.830],
            [18.530, 73.820]
        ]
    },

    {
        id: "D07-1",
        ward: 12,
        risk: 0,
        type: "Flood",
        localFactor: 1.06,

        coordinates: [
            [18.510, 73.840],
            [18.510, 73.850],
            [18.504, 73.850],
            [18.504, 73.840]
        ]
    },

    {
        id: "D07-2",
        ward: 12,
        risk: 0,
        type: "Accident",
        localFactor: 0.70,

        coordinates: [
            [18.504, 73.840],
            [18.504, 73.850],
            [18.498, 73.850],
            [18.498, 73.840]
        ]
    },

    {
        id: "E21-1",
        ward: 9,
        risk: 0,
        type: "Accident",
        localFactor: 1.05,

        coordinates: [
            [18.550, 73.880],
            [18.550, 73.890],
            [18.544, 73.890],
            [18.544, 73.880]
        ]
    },

    {
        id: "F03-1",
        ward: 5,
        risk: 0,
        type: "Flood",
        localFactor: 0.80,

        coordinates: [
            [18.500, 73.860],
            [18.500, 73.870],
            [18.494, 73.870],
            [18.494, 73.860]
        ]
    }

];


// ============================================================
// MICRO-ZONE RISK
// ============================================================

function calculateMicroZoneRisk(zone) {

    const wardRisk =
        calculateWardRisk(
            zone.ward,
            zone.type
        );

    const localFactor =
        Number(zone.localFactor) || 1;

    const score =
        wardRisk * localFactor;

    return Math.round(
        Math.max(
            0,
            Math.min(
                100,
                score
            )
        )
    );
}


// ============================================================
// INTERVENTION DATABASE
// ============================================================

const interventionDatabase = {

    Flood: [

        {
            trigger: "drainage",
            name: "Clean storm drain",
            description:
                "Remove debris and restore storm-drain capacity.",
            cost: 15000,
            reduction: 31
        },

        {
            trigger: "rainfall",
            name: "Improve stormwater capacity",
            description:
                "Upgrade local drainage capacity at high-runoff locations.",
            cost: 45000,
            reduction: 24
        },

        {
            trigger: "surface",
            name: "Add permeable surface",
            description:
                "Replace selected hard surfaces with water-permeable materials.",
            cost: 38000,
            reduction: 19
        },

        {
            trigger: "complaints",
            name: "Targeted drainage inspection",
            description:
                "Inspect recurring complaint locations and identify blockages.",
            cost: 8000,
            reduction: 14
        }

    ],

    Accident: [

        {
            trigger: "roadCondition",
            name: "Repair road surface",
            description:
                "Repair potholes and deteriorated road sections.",
            cost: 35000,
            reduction: 27
        },

        {
            trigger: "lighting",
            name: "Improve street lighting",
            description:
                "Install high-efficiency LED lighting at low-visibility locations.",
            cost: 32000,
            reduction: 22
        },

        {
            trigger: "traffic",
            name: "Traffic calming",
            description:
                "Introduce speed-control and road-safety measures.",
            cost: 50000,
            reduction: 25
        },

        {
            trigger: "history",
            name: "Junction safety improvements",
            description:
                "Add signage, markings and visibility improvements at accident-prone locations.",
            cost: 28000,
            reduction: 21
        }

    ]

};


// ============================================================
// RECOMMENDATIONS
// ============================================================

function getRecommendedInterventions(zone) {

    const factors =
        getRiskFactors(
            zone.ward,
            zone.type
        );

    const interventions =
        interventionDatabase[
            zone.type
        ] || [];

    const ranked =
        interventions.map(intervention => {

            const factorValue =
                Number(
                    factors[
                        intervention.trigger
                    ]
                ) || 0;

            const efficiency =
                intervention.reduction /
                intervention.cost;

            return {

                ...intervention,

                factorValue,

                efficiency

            };

        });

    ranked.sort((a, b) => {

        if (
            b.factorValue !==
            a.factorValue
        ) {

            return (
                b.factorValue -
                a.factorValue
            );

        }

        return (
            b.efficiency -
            a.efficiency
        );

    });

    return ranked;
}


// ============================================================
// INTERVENTION IMPACT
// ============================================================

function calculateInterventionImpact(
    zone,
    intervention
) {

    let currentRisk =
        Number(
            zone.simulated
                ? zone.simulatedRisk
                : zone.risk
        );

    if (
        !Number.isFinite(currentRisk) ||
        currentRisk <= 0
    ) {

        currentRisk =
            calculateMicroZoneRisk(zone);

    }

    if (
        !Number.isFinite(currentRisk) ||
        currentRisk <= 0
    ) {

        currentRisk =
            calculateWardRisk(
                zone.ward,
                zone.type
            );

    }

    const percentageReduction =
        Math.max(
            0,
            Number(
                intervention.reduction
            ) || 0
        );

    const predictedRisk =
        Math.max(
            0,
            Math.round(
                currentRisk *
                (
                    1 -
                    percentageReduction / 100
                )
            )
        );

    const reduction =
        Math.max(
            0,
            currentRisk -
            predictedRisk
        );

    return {

        currentRisk:
            Math.round(currentRisk),

        percentageReduction,

        predictedRisk,

        reduction

    };

}


// ============================================================
// UPDATE SELECTED INTERVENTION DISPLAY
// ============================================================

function updateSelectedInterventionDisplay(
    intervention
) {

    if (!intervention) {
        return;
    }

    const title =
        document.getElementById(
            "recommendationTitle"
        );

    const text =
        document.getElementById(
            "recommendationText"
        );

    const cost =
        document.getElementById(
            "zoneCost"
        );

    const impact =
        document.getElementById(
            "zoneImpact"
        );

    if (title) {

        title.textContent =
            intervention.name;

    }

    if (text) {

        text.textContent =
            intervention.description;

    }

    if (cost) {

        cost.textContent =
            `₹${Number(
                intervention.cost
            ).toLocaleString("en-IN")}`;

    }

    if (impact) {

        impact.textContent =
            `−${intervention.reduction}%`;

    }

}


// ============================================================
// RENDER INTERVENTION OPTIONS
// ============================================================

function renderInterventionOptions(zone) {

    const container =
        document.getElementById(
            "interventionOptions"
        );

    if (!container || !zone) {
        return;
    }

    const recommendations =
        getRecommendedInterventions(
            zone
        );

    if (!recommendations.length) {

        container.innerHTML = `
            <div class="intervention-empty">
                No interventions available.
            </div>
        `;

        selectedIntervention = null;

        return;

    }

    selectedIntervention =
        recommendations[0];

    container.innerHTML =
        recommendations
            .map(
                (intervention, index) => {

                    const isSelected =
                        index === 0;

                    return `

                        <div
                            class="
                                intervention-option
                                ${isSelected ? "selected" : ""}
                            "
                            data-intervention-index="${index}"
                        >

                            <div class="intervention-option-main">

                                <div class="intervention-radio">
                                    ${isSelected ? "✓" : ""}
                                </div>

                                <div>

                                    <strong>
                                        ${intervention.name}
                                    </strong>

                                    <p>
                                        ${intervention.description}
                                    </p>

                                </div>

                            </div>

                            <div class="intervention-option-meta">

                                <span>
                                    ₹${Number(
                                        intervention.cost
                                    ).toLocaleString("en-IN")}
                                </span>

                                <span class="impact">
                                    −${intervention.reduction}%
                                </span>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    const options =
        container.querySelectorAll(
            ".intervention-option"
        );


    options.forEach(option => {

        option.addEventListener(
            "click",
            () => {

                const index =
                    Number(
                        option.dataset.interventionIndex
                    );

                selectedIntervention =
                    recommendations[index];

                options.forEach(item => {

                    item.classList.remove(
                        "selected"
                    );

                    const radio =
                        item.querySelector(
                            ".intervention-radio"
                        );

                    if (radio) {
                        radio.textContent = "";
                    }

                });


                option.classList.add(
                    "selected"
                );


                const radio =
                    option.querySelector(
                        ".intervention-radio"
                    );


                if (radio) {

                    radio.textContent =
                        "✓";

                }


                updateSelectedInterventionDisplay(
                    selectedIntervention
                );


                console.log(
                    "Selected intervention:",
                    selectedIntervention
                );

            }
        );

    });

}


// ============================================================
// POPULATE ZONE DETAILS
// ============================================================

function populateZoneDetails(zone) {

    if (!zoneDetails) {
        return;
    }

    const zoneTitle =
        document.getElementById(
            "zoneTitle"
        );

    const zoneRisk =
        document.getElementById(
            "zoneRisk"
        );

    const zoneSeverity =
        document.getElementById(
            "zoneSeverity"
        );

    const zoneType =
        document.getElementById(
            "zoneType"
        );


    const calculatedRisk =
        Number(
            zone.simulated
                ? zone.simulatedRisk
                : zone.risk
        ) ||
        calculateMicroZoneRisk(zone);


    const severity =
        getRiskSeverity(
            calculatedRisk
        );


    if (zoneTitle) {

        zoneTitle.textContent =
            `Zone ${zone.id}`;

    }


    if (zoneRisk) {

        zoneRisk.textContent =
            calculatedRisk;

    }


    if (zoneSeverity) {

        zoneSeverity.textContent =
            severity.toUpperCase();

        zoneSeverity.className =
            `risk-badge ${severity.toLowerCase()}`;

    }


    if (zoneType) {

        zoneType.textContent =
            `${zone.type} Risk · Ward ${zone.ward}`;

    }


    // ========================================================
    // FACTORS
    // ========================================================

    const factors =
        getRiskFactors(
            zone.ward,
            zone.type
        );


    let factorData;
    let factorLabels;


    if (zone.type === "Flood") {

        factorData = [

            ["drainageValue", factors.drainage],
            ["rainfallValue", factors.rainfall],
            ["historyValue", factors.history],
            ["complaintValue", factors.complaints]

        ];


        factorLabels = [

            "Drainage Condition",
            "Rainfall Intensity",
            "Historical Incidents",
            "Citizen Complaints"

        ];

    } else {

        factorData = [

            ["drainageValue", factors.roadCondition],
            ["rainfallValue", factors.traffic],
            ["historyValue", factors.history],
            ["complaintValue", factors.complaints]

        ];


        factorLabels = [

            "Road Condition",
            "Traffic Exposure",
            "Accident History",
            "Citizen Complaints"

        ];

    }


    const labelIds = [

        "factorLabel1",
        "factorLabel2",
        "factorLabel3",
        "factorLabel4"

    ];


    labelIds.forEach(
        (id, index) => {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    factorLabels[index];

            }

        }
    );


    factorData.forEach(
        ([id, value]) => {

            const element =
                document.getElementById(id);

            const bar =
                document.getElementById(
                    id.replace(
                        "Value",
                        "Bar"
                    )
                );


            const numericValue =
                Number(value) || 0;


            if (element) {

                element.textContent =
                    `${numericValue}%`;

            }


            if (bar) {

                bar.style.width =
                    `${numericValue}%`;

            }

        }
    );


    // ========================================================
    // RECOMMENDATIONS
    // ========================================================

    const recommendations =
        getRecommendedInterventions(
            zone
        );


    selectedIntervention =
        recommendations[0] ||
        null;


    if (selectedIntervention) {

        updateSelectedInterventionDisplay(
            selectedIntervention
        );

    }


    renderInterventionOptions(
        zone
    );


    // ========================================================
    // SIMULATION RESULT
    // ========================================================

    const currentRiskValue =
        document.getElementById(
            "currentRiskValue"
        );


    const predictedRiskValue =
        document.getElementById(
            "predictedRiskValue"
        );


    if (zone.simulated) {

        if (currentRiskValue) {

            currentRiskValue.textContent =
                zone.originalRisk;

        }


        if (predictedRiskValue) {

            predictedRiskValue.textContent =
                zone.simulatedRisk;

        }

    } else {

        if (currentRiskValue) {

            currentRiskValue.textContent =
                calculatedRisk;

        }


        if (predictedRiskValue) {

            predictedRiskValue.textContent =
                "—";

        }

    }

}


// ============================================================
// OPEN ZONE DETAILS
// ============================================================

function openZoneDetails(zone) {

    if (!zoneDetails || !zone) {
        return;
    }

    selectedZone = zone;

    populateZoneDetails(zone);

    zoneDetails.style.display =
        "block";

    zoneDetails.style.visibility =
        "visible";

    zoneDetails.classList.add(
        "visible"
    );

}


// ============================================================
// CLOSE ZONE DETAILS
// ============================================================

function closeZonePanel() {

    if (!zoneDetails) {
        return;
    }

    zoneDetails.classList.remove(
        "visible"
    );

    zoneDetails.style.visibility =
        "hidden";

    selectedZone = null;
    selectedIntervention = null;

}


if (closeZoneDetails) {

    closeZoneDetails.addEventListener(
        "click",
        closeZonePanel
    );

}


// ============================================================
// MICRO-ZONE LAYERS
// ============================================================

const microZoneLayers = [];


function getMicroZoneLayer(zoneId) {

    return microZoneLayers.find(
        item =>
            item.zone.id === zoneId
    );

}


microZones.forEach(zone => {

    zone.risk =
        calculateMicroZoneRisk(zone);

    zone.severity =
        getRiskSeverity(zone.risk);


    const color =
        getRiskColor(zone.risk);


    const polygon =
        L.polygon(
            zone.coordinates,
            {

                color,

                weight: 2,

                opacity: 0.9,

                fillColor: color,

                fillOpacity: 0.35

            }
        );


    polygon.bindTooltip(
        `
        <strong>Zone ${zone.id}</strong><br>
        Ward ${zone.ward}<br>
        ${zone.type} Risk<br>
        Score: ${zone.risk}/100
        `,
        {
            sticky: true
        }
    );


    polygon.on(
        "click",
        event => {

            L.DomEvent.stopPropagation(
                event
            );

            showZoneIntelligence(
                zone,
                true
            );

        }
    );


    riskLayer.addLayer(
        polygon
    );


    microZoneLayers.push({

        polygon,

        zone

    });

});


// ============================================================
// VISUALIZE INTERVENTION
// ============================================================

function visualizeIntervention(
    zone,
    predictedRisk
) {

    if (!zone) {
        return;
    }


    const layer =
        getMicroZoneLayer(
            zone.id
        );


    if (!layer) {

        console.warn(
            "Micro-zone layer not found:",
            zone.id
        );

        return;

    }


    const polygon =
        layer.polygon;


    const newColor =
        getRiskColor(
            predictedRisk
        );


    // ========================================================
    // STORE ORIGINAL RISK
    // ========================================================

    if (
        typeof zone.originalRisk ===
        "undefined"
    ) {

        zone.originalRisk =
            zone.risk;

    }


    zone.simulatedRisk =
        predictedRisk;

    zone.simulated =
        true;

    zone.simulatedSeverity =
        getRiskSeverity(
            predictedRisk
        );


    // ========================================================
    // CHANGE POLYGON
    // ========================================================

    polygon.setStyle({

        color: newColor,

        fillColor: newColor,

        fillOpacity: 0.45,

        opacity: 1,

        weight: 3

    });


    // ========================================================
    // UPDATE TOOLTIP
    // ========================================================

    polygon.unbindTooltip();


    polygon.bindTooltip(
        `
        <strong>Zone ${zone.id}</strong><br>
        Ward ${zone.ward}<br>
        ${zone.type} Risk<br>

        <span style="
            text-decoration:line-through;
            opacity:.6
        ">
            Previous: ${zone.originalRisk}/100
        </span><br>

        <strong>
            Predicted: ${predictedRisk}/100
        </strong><br>

        <span style="color:#37d58a">
            ↓ ${zone.originalRisk - predictedRisk} points
        </span>
        `,
        {
            sticky: true
        }
    );


    // ========================================================
    // UPDATE MARKER
    // ========================================================

    const markerItem =
        zoneMarkers.find(
            item =>
                item.zone.id === zone.id
        );


    if (markerItem) {

        markerItem.marker.setStyle({

            fillColor: newColor,

            color: "#ffffff",

            fillOpacity: 0.8,

            opacity: 1

        });


        markerItem.marker.unbindTooltip();


        markerItem.marker.bindTooltip(
            `
            Zone ${zone.id}<br>
            Previous Risk:
            ${zone.originalRisk}/100<br>

            <strong>
                Predicted Risk:
                ${predictedRisk}/100
            </strong>
            `,
            {
                direction: "top"
            }
        );

    }


    // ========================================================
    // REFRESH PANEL
    // ========================================================

    if (
        selectedZone &&
        selectedZone.id === zone.id
    ) {

        populateZoneDetails(
            zone
        );

    }


    console.log(
        `Zone ${zone.id} visually updated:`,
        zone.originalRisk,
        "→",
        predictedRisk
    );

}


// ============================================================
// HOTSPOT MARKERS
// ============================================================

const zoneMarkers = [];


riskZones.forEach(zone => {

    zone.risk =
        calculateWardRisk(
            zone.ward,
            zone.type
        );


    zone.severity =
        getRiskSeverity(
            zone.risk
        );


    const color =
        getRiskColor(
            zone.risk
        );


    const marker =
        L.circleMarker(
            [zone.lat, zone.lng],
            {

                radius: 14,

                fillColor: color,

                color: "#ffffff",

                weight: 2,

                opacity: 0.9,

                fillOpacity: 0.65

            }
        );


    marker.bindTooltip(
        `
        Zone ${zone.id}<br>
        Risk: ${zone.risk}/100
        `,
        {
            direction: "top"
        }
    );


    marker.on(
        "click",
        event => {

            L.DomEvent.stopPropagation(
                event
            );

            showZoneIntelligence(
                zone,
                true
            );

        }
    );


    hotspotLayer.addLayer(
        marker
    );


    zoneMarkers.push({

        marker,

        zone

    });

});


// ============================================================
// GET ZONE CENTER
// ============================================================

function getZoneCenter(zone) {

    if (
        zone.lat !== undefined &&
        zone.lng !== undefined
    ) {

        return [

            Number(zone.lat),

            Number(zone.lng)

        ];

    }


    if (
        !zone.coordinates ||
        !zone.coordinates.length
    ) {

        return null;

    }


    let lat = 0;
    let lng = 0;


    zone.coordinates.forEach(
        point => {

            lat += Number(point[0]);

            lng += Number(point[1]);

        }
    );


    return [

        lat / zone.coordinates.length,

        lng / zone.coordinates.length

    ];

}


// ============================================================
// POSITION ZONE INTELLIGENCE
// ============================================================

function positionZoneIntelligence(zone) {

    if (
        !zoneDetails ||
        !map
    ) {

        return;

    }


    const mapElement =
        document.getElementById(
            "riskMap"
        );


    if (!mapElement) {
        return;
    }


    let bounds;


    if (
        zone.coordinates &&
        zone.coordinates.length
    ) {

        bounds =
            L.latLngBounds(
                zone.coordinates
            );

    } else if (
        zone.lat !== undefined &&
        zone.lng !== undefined
    ) {

        const point =
            L.latLng(
                zone.lat,
                zone.lng
            );

        bounds =
            L.latLngBounds(
                point,
                point
            );

    } else {

        return;

    }


    const northEast =
        map.latLngToContainerPoint(
            bounds.getNorthEast()
        );


    const southWest =
        map.latLngToContainerPoint(
            bounds.getSouthWest()
        );


    const zoneLeft =
        southWest.x;


    const zoneRight =
        northEast.x;


    const zoneTop =
        northEast.y;


    const zoneBottom =
        southWest.y;


    const panelWidth =
        zoneDetails.offsetWidth || 360;


    const panelHeight =
        zoneDetails.offsetHeight || 450;


    const mapWidth =
        mapElement.clientWidth;


    const mapHeight =
        mapElement.clientHeight;


    const gap = 24;
    const margin = 16;


    let left = 0;
    let top = 0;


    if (
        zoneRight +
        gap +
        panelWidth <=
        mapWidth - margin
    ) {

        left =
            zoneRight +
            gap;


        top =
            (
                zoneTop +
                zoneBottom
            ) / 2 -
            panelHeight / 2;

    }


    else if (
        zoneLeft -
        gap -
        panelWidth >=
        margin
    ) {

        left =
            zoneLeft -
            panelWidth -
            gap;


        top =
            (
                zoneTop +
                zoneBottom
            ) / 2 -
            panelHeight / 2;

    }


    else if (
        zoneTop -
        gap -
        panelHeight >=
        margin
    ) {

        left =
            (
                zoneLeft +
                zoneRight
            ) / 2 -
            panelWidth / 2;


        top =
            zoneTop -
            panelHeight -
            gap;

    }


    else {

        left =
            (
                zoneLeft +
                zoneRight
            ) / 2 -
            panelWidth / 2;


        top =
            zoneBottom +
            gap;

    }


    left =
        Math.max(
            margin,
            Math.min(
                left,
                mapWidth -
                panelWidth -
                margin
            )
        );


    top =
        Math.max(
            margin,
            Math.min(
                top,
                mapHeight -
                panelHeight -
                margin
            )
        );


    zoneDetails.style.left =
        `${left}px`;


    zoneDetails.style.top =
        `${top}px`;

}


// ============================================================
// SHOW ZONE INTELLIGENCE
// ============================================================

function showZoneIntelligence(
    zone,
    zoomToZone = false
) {

    if (
        !zone ||
        !zoneDetails
    ) {

        return;

    }


    selectedZone =
        zone;


    populateZoneDetails(
        zone
    );


    zoneDetails.style.display =
        "block";


    zoneDetails.style.visibility =
        "hidden";


    zoneDetails.classList.remove(
        "visible"
    );


    if (zoomToZone) {

        const center =
            getZoneCenter(
                zone
            );


        if (center) {

            map.invalidateSize({
                animate: false
            });


            let finished = false;


            const finishOpening = () => {

                if (finished) {
                    return;
                }


                finished = true;


                requestAnimationFrame(() => {

                    requestAnimationFrame(() => {

                        positionZoneIntelligence(
                            zone
                        );


                        zoneDetails.style.visibility =
                            "visible";


                        zoneDetails.classList.add(
                            "visible"
                        );

                    });

                });

            };


            map.once(
                "moveend",
                finishOpening
            );


            map.flyTo(
                center,
                15,
                {

                    duration: 1.2,

                    easeLinearity: 0.15

                }
            );


            setTimeout(
                finishOpening,
                1500
            );


            return;

        }

    }


    requestAnimationFrame(() => {

        positionZoneIntelligence(
            zone
        );


        requestAnimationFrame(() => {

            zoneDetails.style.visibility =
                "visible";


            zoneDetails.classList.add(
                "visible"
            );

        });

    });

}


// ============================================================
// KEEP PANEL POSITIONED
// ============================================================

function refreshZoneIntelligencePosition() {

    if (
        selectedZone &&
        zoneDetails &&
        zoneDetails.classList.contains(
            "visible"
        )
    ) {

        positionZoneIntelligence(
            selectedZone
        );

    }

}


map.on(
    "move",
    refreshZoneIntelligencePosition
);

map.on(
    "zoom",
    refreshZoneIntelligencePosition
);

map.on(
    "moveend",
    refreshZoneIntelligencePosition
);

map.on(
    "zoomend",
    refreshZoneIntelligencePosition
);


window.addEventListener(
    "resize",
    () => {

        requestAnimationFrame(
            refreshZoneIntelligencePosition
        );

    }
);


// ============================================================
// WARD GEOJSON
// ============================================================

function getWardStyle(feature) {

    const risk =
        Number(
            feature.properties.risk
        ) || 0;


    const color =
        getRiskColor(
            risk
        );


    return {

        color: "#ffffff",

        weight: 2,

        opacity: 0.8,

        fillColor: color,

        fillOpacity: 0.08

    };

}


// ============================================================
// WARD INTERACTION
// ============================================================

function wardFeatureInteraction(
    feature,
    layer
) {

    const properties =
        feature.properties;


    layer.bindTooltip(
        `
        <strong>
            ${properties.name}
        </strong><br>

        Risk Score:
        ${properties.risk}/100<br>

        Primary Risk:
        ${properties.type}
        `,
        {
            sticky: true
        }
    );


    layer.on({

        mouseover: event => {

            event.target.setStyle({

                weight: 3,

                fillOpacity: 0.18

            });

        },


        mouseout: event => {

            if (wardGeoJSONLayer) {

                wardGeoJSONLayer.resetStyle(
                    event.target
                );

            }

        },


        click: () => {

            const risk =
                Number(
                    properties.risk
                ) || 0;


            const wardZone = {

                id:
                    `Ward ${properties.ward}`,

                ward:
                    properties.ward,

                risk,

                type:
                    properties.type,

                severity:
                    getRiskSeverity(
                        risk
                    ),

                coordinates:
                    layer
                        .getLatLngs()
                        .flat(Infinity)
                        .map(
                            point => [
                                point.lat,
                                point.lng
                            ]
                        )

            };


            showZoneIntelligence(
                wardZone,
                false
            );

        }

    });

}


// ============================================================
// LOAD GEOJSON
// ============================================================

fetch(
    "data/wards.geojson"
)
    .then(response => {

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        return response.json();

    })
    .then(data => {

        wardGeoJSONLayer =
            L.geoJSON(
                data,
                {

                    style:
                        getWardStyle,

                    onEachFeature:
                        wardFeatureInteraction

                }
            );


        wardGeoJSONLayer.addTo(
            map
        );


        wardGeoJSONLayer.bringToBack();


        L.control.layers(
            null,
            {

                "Ward Boundaries":
                    wardGeoJSONLayer,

                "Risk Zones":
                    riskLayer,

                "Hotspots":
                    hotspotLayer

            },
            {
                collapsed: true
            }
        ).addTo(map);


        console.log(
            "Ward GeoJSON loaded successfully"
        );

    })
    .catch(error => {

        console.error(
            "Ward GeoJSON failed:",
            error
        );

    });


// ============================================================
// MAP FILTERS
// ============================================================

const mapFilters =
    document.querySelectorAll(
        ".map-filter"
    );


const wardFilter =
    document.getElementById(
        "wardFilter"
    );


// ============================================================
// APPLY FILTERS
// ============================================================

function applyFilters() {

    const visibleZones = [];


    zoneMarkers.forEach(item => {

        const zone =
            item.zone;


        const riskMatches =
            selectedRisk === "All" ||
            zone.type === selectedRisk;


        const wardMatches =
            selectedWard === "All" ||
            String(zone.ward) ===
            String(selectedWard);


        if (
            riskMatches &&
            wardMatches
        ) {

            item.marker.setStyle({

                opacity: 0.9,

                fillOpacity: 0.65

            });

        } else {

            item.marker.setStyle({

                opacity: 0,

                fillOpacity: 0

            });

        }

    });


    microZoneLayers.forEach(item => {

        const zone =
            item.zone;


        const riskMatches =
            selectedRisk === "All" ||
            zone.type === selectedRisk;


        const wardMatches =
            selectedWard === "All" ||
            String(zone.ward) ===
            String(selectedWard);


        if (
            riskMatches &&
            wardMatches
        ) {

            item.polygon.setStyle({

                opacity: 0.9,

                fillOpacity:
                    zone.simulated
                        ? 0.45
                        : 0.35

            });


            visibleZones.push(
                zone
            );

        } else {

            item.polygon.setStyle({

                opacity: 0,

                fillOpacity: 0

            });

        }

    });


    updateDashboardStats(
        visibleZones
    );

}


// ============================================================
// RISK FILTER BUTTONS
// ============================================================

mapFilters.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            mapFilters.forEach(
                btn => {

                    btn.classList.remove(
                        "active"
                    );

                }
            );


            button.classList.add(
                "active"
            );


            selectedRisk =
                button.dataset.filter;


            applyFilters();

        }
    );

});


// ============================================================
// WARD FILTER
// ============================================================

if (wardFilter) {

    wardFilter.addEventListener(
        "change",
        () => {

            selectedWard =
                wardFilter.value;

            applyFilters();

        }
    );

}


// ============================================================
// DASHBOARD STATS
// ============================================================

function updateDashboardStats(
    zones
) {

    const highRisk =
        zones.filter(
            zone =>
                (
                    zone.simulated
                        ? zone.simulatedRisk
                        : zone.risk
                ) >= 60
        ).length;


    const floodCount =
        zones.filter(
            zone =>
                zone.type === "Flood"
        ).length;


    const accidentCount =
        zones.filter(
            zone =>
                zone.type === "Accident"
        ).length;


    const highRiskElement =
        document.getElementById(
            "highRiskCount"
        );


    const floodElement =
        document.getElementById(
            "floodHotspotCount"
        );


    const accidentElement =
        document.getElementById(
            "accidentHotspotCount"
        );


    if (highRiskElement) {

        highRiskElement.textContent =
            highRisk;

    }


    if (floodElement) {

        floodElement.textContent =
            floodCount;

    }


    if (accidentElement) {

        accidentElement.textContent =
            accidentCount;

    }

}


// ============================================================
// LEGEND
// ============================================================

const legend =
    L.control({
        position: "bottomleft"
    });


legend.onAdd = function() {

    const div =
        L.DomUtil.create(
            "div",
            "map-legend"
        );


    div.innerHTML = `

        <strong>Risk Level</strong>

        <div>
            <span class="legend-dot low"></span>
            Low
        </div>

        <div>
            <span class="legend-dot medium"></span>
            Moderate
        </div>

        <div>
            <span class="legend-dot high"></span>
            High
        </div>

        <div>
            <span class="legend-dot critical"></span>
            Critical
        </div>

    `;


    return div;

};


legend.addTo(map);


// ============================================================
// MUNICIPAL PRIORITY
// ============================================================

function calculatePriorityScore(
    zone,
    intervention
) {

    const impact =
        calculateInterventionImpact(
            zone,
            intervention
        );


    const riskScore =
        impact.currentRisk;


    const reductionScore =
        impact.reduction;


    const cost =
        Number(
            intervention.cost
        ) || 1;


    const costEfficiency =
        Math.min(
            100,
            (
                reductionScore /
                cost
            ) * 100000
        );


    const priorityScore =

        riskScore * 0.50 +

        reductionScore * 0.30 +

        costEfficiency * 0.20;


    return Math.round(
        Math.min(
            100,
            priorityScore
        )
    );

}


// ============================================================
// PRIORITY RANKING
// ============================================================

function generatePriorityRanking() {

    const ranking = [];


    microZones.forEach(zone => {

        const recommendations =
            getRecommendedInterventions(
                zone
            );


        if (
            !recommendations ||
            !recommendations.length
        ) {

            return;

        }


        const intervention =
            recommendations[0];


        const impact =
            calculateInterventionImpact(
                zone,
                intervention
            );


        const priorityScore =
            calculatePriorityScore(
                zone,
                intervention
            );


        ranking.push({

            zone,

            intervention,

            impact,

            priorityScore

        });

    });


    ranking.sort(
        (a, b) =>
            b.priorityScore -
            a.priorityScore
    );


    return ranking;

}


// ============================================================
// INTERVENTION PROBLEM
// ============================================================

function getInterventionProblem(zone) {

    const factors =
        getRiskFactors(
            zone.ward,
            zone.type
        );


    if (zone.type === "Flood") {

        if (
            factors.drainage >= 80
        ) {

            return "Drain blockage";

        }


        if (
            factors.rainfall >= 80
        ) {

            return "High surface runoff";

        }


        if (
            factors.complaints >= 70
        ) {

            return "Recurring complaints";

        }


        return "Flood vulnerability";

    }


    if (
        factors.roadCondition >= 80
    ) {

        return "Poor road condition";

    }


    if (
        factors.lighting >= 70
    ) {

        return "Poor lighting";

    }


    if (
        factors.traffic >= 70
    ) {

        return "High traffic risk";

    }


    if (
        factors.history >= 80
    ) {

        return "Accident history";

    }


    return "Road safety risk";

}


// ============================================================
// PRIMARY RISK DRIVER
// ============================================================

function getPrimaryRiskDriver(zone) {

    const factors =
        getRiskFactors(
            zone.ward,
            zone.type
        );


    let entries;


    if (zone.type === "Flood") {

        entries = [

            [
                "Drainage condition",
                factors.drainage
            ],

            [
                "Rainfall intensity",
                factors.rainfall
            ],

            [
                "Historical incidents",
                factors.history
            ],

            [
                "Citizen complaints",
                factors.complaints
            ],

            [
                "Surface vulnerability",
                factors.surface
            ]

        ];

    } else {

        entries = [

            [
                "Road condition",
                factors.roadCondition
            ],

            [
                "Accident history",
                factors.history
            ],

            [
                "Traffic exposure",
                factors.traffic
            ],

            [
                "Citizen complaints",
                factors.complaints
            ],

            [
                "Street lighting",
                factors.lighting
            ]

        ];

    }


    entries.sort(
        (a, b) =>
            b[1] - a[1]
    );


    return entries[0]
        ? entries[0][0]
        : "Risk exposure";

}


// ============================================================
// RENDER MUNICIPAL ACTION QUEUE
// ============================================================

function renderActionQueue() {

    const actionQueue =
        document.getElementById(
            "actionQueue"
        );


    if (!actionQueue) {

        console.warn(
            "actionQueue element not found"
        );

        return;

    }


    const ranking =
        generatePriorityRanking();


    if (
        !ranking ||
        !ranking.length
    ) {

        actionQueue.innerHTML = `
            <div class="action-empty">
                No priority interventions found.
            </div>
        `;

        return;

    }


    const visibleRanking =
        ranking.slice(
            0,
            6
        );


    actionQueue.innerHTML =

        visibleRanking
            .map(
                (item, index) => {

                    const zone =
                        item.zone;

                    const intervention =
                        item.intervention;

                    const impact =
                        item.impact;


                    const priority =
                        index + 1;


                    const priorityClass =
                        index === 0
                            ? "priority-1"
                            : index === 1
                                ? "priority-2"
                                : index === 2
                                    ? "priority-3"
                                    : "priority-other";


                    return `

                        <div
                            class="action-row"
                            data-zone-id="${zone.id}"
                            role="button"
                            tabindex="0"
                        >

                            <div class="action-priority-cell">

                                <b
                                    class="
                                        priority
                                        ${priorityClass}
                                    "
                                >
                                    #${priority}
                                </b>

                            </div>


                            <div class="action-zone-cell">

                                <strong>
                                    ${zone.id}
                                </strong>

                                <small>
                                    Ward ${zone.ward}
                                </small>

                            </div>


                            <div>

                                <span
                                    class="
                                        action-type
                                        ${zone.type.toLowerCase()}
                                    "
                                >
                                    ${zone.type}
                                </span>

                            </div>


                            <div class="action-score-cell">

                                <strong>
                                    ${item.priorityScore}
                                </strong>

                                <small>
                                    PRIORITY SCORE
                                </small>

                            </div>


                            <div class="action-name-cell">

                                <strong>
                                    ${intervention.name}
                                </strong>

                            </div>


                            <div>

                                <strong>
                                    ₹${Number(
                                        intervention.cost
                                    ).toLocaleString("en-IN")}
                                </strong>

                            </div>


                            <div>

                                <span class="impact">
                                    −${impact.percentageReduction}%
                                </span>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    const rows =
        actionQueue.querySelectorAll(
            ".action-row"
        );


    rows.forEach(row => {

        const openFromRow = () => {

            const zoneId =
                row.dataset.zoneId;


            const zone =
                microZones.find(
                    item =>
                        item.id === zoneId
                );


            if (!zone) {

                console.error(
                    "Zone not found:",
                    zoneId
                );

                return;

            }


            focusZoneFromActionQueue(
                zone
            );

        };


        row.addEventListener(
            "click",
            openFromRow
        );


        row.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    openFromRow();

                }

            }
        );

    });

}


// ============================================================
// SCROLL TO MAP
// ============================================================

function smoothScrollToMap(
    mapElement
) {

    return new Promise(resolve => {

        if (!mapElement) {

            resolve();

            return;

        }


        const topOffset = 90;


        const rect =
            mapElement.getBoundingClientRect();


        const targetTop =
            Math.max(
                0,
                window.scrollY +
                rect.top -
                topOffset
            );


        const distance =
            Math.abs(
                window.scrollY -
                targetTop
            );


        if (distance < 10) {

            resolve();

            return;

        }


        let finished = false;


        const finish = () => {

            if (finished) {
                return;
            }


            finished = true;


            window.removeEventListener(
                "scroll",
                checkScroll
            );


            resolve();

        };


        const checkScroll = () => {

            if (
                Math.abs(
                    window.scrollY -
                    targetTop
                ) < 10
            ) {

                finish();

            }

        };


        window.addEventListener(
            "scroll",
            checkScroll,
            {
                passive: true
            }
        );


        window.scrollTo({

            top: targetTop,

            behavior: "smooth"

        });


        setTimeout(
            finish,
            Math.max(
                800,
                Math.min(
                    1500,
                    distance * 2
                )
            )
        );

    });

}


// ============================================================
// ACTION QUEUE → MAP
// ============================================================

async function focusZoneFromActionQueue(
    zone
) {

    if (!zone) {
        return;
    }


    const mapElement =
        document.getElementById(
            "riskMap"
        );


    if (!mapElement) {

        console.error(
            "riskMap element not found"
        );

        return;

    }


    if (zoneDetails) {

        zoneDetails.classList.remove(
            "visible"
        );

        zoneDetails.style.visibility =
            "hidden";

    }


    selectedZone =
        zone;


    await smoothScrollToMap(
        mapElement
    );


    await new Promise(
        resolve =>
            requestAnimationFrame(
                () =>
                    requestAnimationFrame(
                        resolve
                    )
            )
    );


    map.invalidateSize({
        animate: false
    });


    const center =
        getZoneCenter(
            zone
        );


    if (!center) {

        console.error(
            "Could not calculate zone center:",
            zone.id
        );

        return;

    }


    let opened = false;


    const openAfterMove = () => {

        if (opened) {
            return;
        }


        opened = true;


        showZoneIntelligence(
            zone,
            false
        );

    };


    map.once(
        "moveend",
        openAfterMove
    );


    map.flyTo(
        center,
        15,
        {

            duration: 1.2,

            easeLinearity: 0.15

        }
    );


    setTimeout(
        openAfterMove,
        1600
    );

}


// ============================================================
// SIMULATE INTERVENTION
// ============================================================

const simulateButton =
    document.getElementById(
        "simulateButton"
    );


if (simulateButton) {

    simulateButton.addEventListener(
        "click",
        () => {

            if (!selectedZone) {

                console.warn(
                    "No zone selected"
                );

                return;

            }


            const recommendations =
                getRecommendedInterventions(
                    selectedZone
                );


            if (
                !recommendations.length
            ) {

                console.warn(
                    "No interventions available"
                );

                return;

            }


            const intervention =
                selectedIntervention ||
                recommendations[0];


            const impact =
                calculateInterventionImpact(
                    selectedZone,
                    intervention
                );


            // ====================================================
            // VISUALIZE PREDICTED RISK
            // ====================================================

            visualizeIntervention(
                selectedZone,
                impact.predictedRisk
            );


            // ====================================================
            // UPDATE RISK VALUES
            // ====================================================

            const currentRiskValue =
                document.getElementById(
                    "currentRiskValue"
                );


            const predictedRiskValue =
                document.getElementById(
                    "predictedRiskValue"
                );


            if (currentRiskValue) {

                currentRiskValue.textContent =
                    impact.currentRisk;

            }


            if (predictedRiskValue) {

                predictedRiskValue.textContent =
                    impact.predictedRisk;


                predictedRiskValue.style.transition =
                    "all 0.4s ease";


                predictedRiskValue.style.transform =
                    "scale(1.15)";


                setTimeout(() => {

                    predictedRiskValue.style.transform =
                        "scale(1)";

                }, 400);

            }


            // ====================================================
            // UPDATE SIMULATION BUTTON
            // ====================================================

            simulateButton.classList.add(
                "simulated"
            );


            simulateButton.innerHTML = `
                Simulation Complete
                <span>✓</span>
            `;


            // ====================================================
            // UPDATE DASHBOARD
            // ====================================================

            applyFilters();


            renderActionQueue();


            console.log(
                "Intervention simulation:",
                {
                    zone:
                        selectedZone.id,

                    intervention:
                        intervention.name,

                    currentRisk:
                        impact.currentRisk,

                    predictedRisk:
                        impact.predictedRisk,

                    reduction:
                        impact.reduction

                }
            );


            setTimeout(
                () => {

                    simulateButton.classList.remove(
                        "simulated"
                    );


                    simulateButton.innerHTML = `
                        Simulate Intervention
                        <span>→</span>
                    `;

                },
                2500
            );

        }
    );

}


// ============================================================
// RESET SIMULATION
// ============================================================

const resetSimulationButton =
    document.getElementById(
        "resetSimulationButton"
    );


if (resetSimulationButton) {

    resetSimulationButton.addEventListener(
        "click",
        resetSimulation
    );

}


function resetSimulation() {

    console.log(
        "Resetting simulation..."
    );


    // ========================================================
    // RESET MICRO-ZONES
    // ========================================================

    microZones.forEach(zone => {

        if (
            typeof zone.originalRisk !==
            "undefined"
        ) {

            zone.risk =
                zone.originalRisk;

        }


        delete zone.originalRisk;

        delete zone.simulatedRisk;

        delete zone.simulated;

        delete zone.simulatedSeverity;


        const layer =
            getMicroZoneLayer(
                zone.id
            );


        if (layer) {

            const color =
                getRiskColor(
                    zone.risk
                );


            layer.polygon.setStyle({

                color,

                fillColor: color,

                fillOpacity: 0.35,

                opacity: 0.9,

                weight: 2

            });


            layer.polygon.unbindTooltip();


            layer.polygon.bindTooltip(
                `
                <strong>
                    Zone ${zone.id}
                </strong><br>

                Ward ${zone.ward}<br>

                ${zone.type} Risk<br>

                Score:
                ${zone.risk}/100
                `,
                {
                    sticky: true
                }
            );

        }

    });


    // ========================================================
    // RESET HOTSPOTS
    // ========================================================

    zoneMarkers.forEach(item => {

        const zone =
            item.zone;


        delete zone.originalRisk;

        delete zone.simulatedRisk;

        delete zone.simulated;

        delete zone.simulatedSeverity;


        const originalRisk =
            calculateWardRisk(
                zone.ward,
                zone.type
            );


        zone.risk =
            originalRisk;


        zone.severity =
            getRiskSeverity(
                originalRisk
            );


        const color =
            getRiskColor(
                originalRisk
            );


        item.marker.setStyle({

            fillColor: color,

            color: "#ffffff",

            fillOpacity: 0.65,

            opacity: 0.9,

            weight: 2

        });


        item.marker.unbindTooltip();


        item.marker.bindTooltip(
            `
            Zone ${zone.id}<br>
            Risk:
            ${originalRisk}/100
            `,
            {
                direction: "top"
            }
        );

    });


    // ========================================================
    // RESET PANEL
    // ========================================================

    selectedIntervention =
        null;


    if (selectedZone) {

        populateZoneDetails(
            selectedZone
        );

    }


    // ========================================================
    // RESET RISK DISPLAY
    // ========================================================

    const currentRiskValue =
        document.getElementById(
            "currentRiskValue"
        );


    const predictedRiskValue =
        document.getElementById(
            "predictedRiskValue"
        );


    if (
        selectedZone
    ) {

        const originalRisk =
            Number(
                selectedZone.risk
            ) ||
            calculateMicroZoneRisk(
                selectedZone
            );


        if (currentRiskValue) {

            currentRiskValue.textContent =
                originalRisk;

        }


        if (predictedRiskValue) {

            predictedRiskValue.textContent =
                "—";

        }

    }


    // ========================================================
    // RESET BUTTON
    // ========================================================

    if (simulateButton) {

        simulateButton.classList.remove(
            "simulated"
        );


        simulateButton.innerHTML = `
            Simulate Intervention
            <span>→</span>
        `;

    }


    // ========================================================
    // REFRESH FILTERS / DASHBOARD
    // ========================================================

    applyFilters();


    // ========================================================
    // REFRESH ACTION QUEUE
    // ========================================================

    renderActionQueue();


    console.log(
        "Simulation reset successfully."
    );

}


// ============================================================
// NAVIGATION
// ============================================================

const navItems =
    document.querySelectorAll(
        ".nav-item"
    );


navItems.forEach(item => {

    item.addEventListener(
        "click",
        event => {

            event.preventDefault();


            navItems.forEach(nav => {

                nav.classList.remove(
                    "active"
                );

            });


            item.classList.add(
                "active"
            );


            const target =
                item.dataset.target ||
                item.getAttribute(
                    "href"
                );


            if (
                target &&
                target !== "#"
            ) {

                const section =
                    document.querySelector(
                        target
                    );


                if (section) {

                    const offset = 24;


                    const targetTop =
                        window.scrollY +
                        section
                            .getBoundingClientRect()
                            .top -
                        offset;


                    window.scrollTo({

                        top:
                            Math.max(
                                0,
                                targetTop
                            ),

                        behavior:
                            "smooth"

                    });

                }

            }

        }
    );

});

// ============================================================
// REFRESH ML RISK VALUES
// ============================================================

function refreshMLRiskValues() {

    console.log("Refreshing ML risk values...");

    // ========================================================
    // MICRO ZONES
    // ========================================================

    microZones.forEach(zone => {

        zone.risk =
            calculateMicroZoneRisk(zone);

        zone.severity =
            getRiskSeverity(zone.risk);

        console.log(
            `Micro-zone ${zone.id}:`,
            zone.risk
        );

    });


    // ========================================================
    // HOTSPOTS
    // ========================================================

    riskZones.forEach(zone => {

        zone.risk =
            calculateWardRisk(
                zone.ward,
                zone.type
            );

        zone.severity =
            getRiskSeverity(zone.risk);

        console.log(
            `Hotspot ${zone.id}:`,
            zone.risk
        );

    });


    // ========================================================
    // UPDATE MICRO-ZONE POLYGONS
    // ========================================================

    microZoneLayers.forEach(item => {

        const zone = item.zone;

        const color =
            getRiskColor(zone.risk);

        item.polygon.setStyle({

            color: color,

            fillColor: color,

            fillOpacity:
                zone.simulated
                    ? 0.45
                    : 0.35,

            opacity: 0.9,

            weight: 2

        });


        item.polygon.unbindTooltip();

        item.polygon.bindTooltip(
            `
            <strong>
                Zone ${zone.id}
            </strong><br>

            Ward ${zone.ward}<br>

            ${zone.type} Risk<br>

            Score:
            ${zone.risk}/100
            `,
            {
                sticky: true
            }
        );

    });


    // ========================================================
    // UPDATE HOTSPOT MARKERS
    // ========================================================

    zoneMarkers.forEach(item => {

        const zone = item.zone;

        const color =
            getRiskColor(zone.risk);


        item.marker.setStyle({

            fillColor: color,

            color: "#ffffff",

            fillOpacity: 0.65,

            opacity: 0.9,

            weight: 2

        });


        item.marker.unbindTooltip();

        item.marker.bindTooltip(
            `
            Zone ${zone.id}<br>

            Ward ${zone.ward}<br>

            ${zone.type} Risk<br>

            Score:
            ${zone.risk}/100
            `,
            {
                direction: "top"
            }
        );

    });


    // ========================================================
    // UPDATE WARD GEOJSON
    // ========================================================

    if (wardGeoJSONLayer) {

        wardGeoJSONLayer.eachLayer(layer => {

            const properties =
                layer.feature.properties;

            const ward =
                properties.ward;

            const type =
                properties.type;

            const risk =
                calculateWardRisk(
                    ward,
                    type
                );


            properties.risk =
                risk;


            layer.setStyle(
                getWardStyle(
                    layer.feature
                )
            );


            layer.unbindTooltip();


            layer.bindTooltip(
                `
                <strong>
                    ${properties.name}
                </strong><br>

                Risk Score:
                ${risk}/100<br>

                Primary Risk:
                ${type}
                `,
                {
                    sticky: true
                }
            );

        });

    }


    console.log(
        "ML risk values successfully applied to map."
    );

}

// ============================================================
// INITIALIZE URBANRISK
// ============================================================

async function initializeUrbanRisk() {

    console.log(
        "Initializing UrbanRisk..."
    );


    // Load predictions from Flask
    await loadMLPredictions();

refreshMLRiskValues();

console.log(
    "ML predictions ready."
);


    // Refresh everything using ML results
    applyFilters();

    renderActionQueue();


    console.log(
        "UrbanRisk dashboard ready."
    );

}


// Start dashboard
initializeUrbanRisk();


// ============================================================
// DEBUG OUTPUT
// ============================================================

console.log(
    "Ward 27 flood risk:",
    calculateWardRisk(
        27,
        "Flood"
    )
);


console.log(
    "Ward 31 accident risk:",
    calculateWardRisk(
        31,
        "Accident"
    )
);


console.log(
    "A12-1 risk:",
    microZones[0].risk
);


console.log(
    "A12-1 recommendation:",
    getRecommendedInterventions(
        microZones[0]
    )[0]
);


console.log(
    "UrbanRisk dashboard initialized successfully"
);