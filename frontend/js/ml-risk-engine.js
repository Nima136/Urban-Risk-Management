// ============================================================
// URBANRISK ML API CLIENT
// ============================================================

const UrbanRiskML = {

    API_URL: "http://127.0.0.1:5000/predict",

    // --------------------------------------------------------
    // PREDICT
    // --------------------------------------------------------

    async predict(features, type) {

        try {

            const response = await fetch(
                this.API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        type: type,
                        features: features
                    })
                }
            );


            if (!response.ok) {

                throw new Error(
                    `ML API returned HTTP ${response.status}`
                );

            }


            const result =
                await response.json();


            if (!result.success) {

                throw new Error(
                    result.error ||
                    "ML prediction failed"
                );

            }


            console.log(
                `UrbanRisk ML → ${type}:`,
                result.risk
            );


            return Number(result.risk) || 0;

        }

        catch (error) {

            console.error(
                `UrbanRisk ML ${type} error:`,
                error
            );

            throw error;

        }

    }

};