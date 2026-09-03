import numpy as np
from sklearn.ensemble import RandomForestRegressor


class UrbanRiskModel:

    def __init__(self):

        self.flood_model = RandomForestRegressor(
            n_estimators=100,
            random_state=42
        )

        self.accident_model = RandomForestRegressor(
            n_estimators=100,
            random_state=42
        )

        self._train_initial_models()


    def _train_initial_models(self):

        # ----------------------------------------------------
        # Initial synthetic training data
        #
        # This is ONLY a bootstrap model.
        # Later we'll replace this with real city data.
        # ----------------------------------------------------

        flood_X = np.array([
            [90, 90, 80, 70, 70],
            [80, 85, 75, 65, 60],
            [70, 70, 65, 55, 50],
            [50, 50, 45, 40, 40],
            [30, 35, 30, 25, 30],
            [20, 25, 20, 15, 20]
        ])

        flood_y = np.array([
            82,
            75,
            65,
            47,
            28,
            20
        ])


        accident_X = np.array([
            [90, 90, 85, 75, 60],
            [80, 85, 80, 70, 55],
            [70, 75, 65, 60, 50],
            [55, 60, 55, 45, 40],
            [35, 40, 35, 30, 25],
            [20, 25, 20, 20, 15]
        ])

        accident_y = np.array([
            84,
            78,
            68,
            52,
            32,
            20
        ])


        self.flood_model.fit(
            flood_X,
            flood_y
        )

        self.accident_model.fit(
            accident_X,
            accident_y
        )


    def predict_flood(self, features):

        X = np.array([[
            features.get("drainage", 0),
            features.get("rainfall", 0),
            features.get("history", 0),
            features.get("complaints", 0),
            features.get("surface", 0)
        ]])

        prediction = self.flood_model.predict(X)[0]

        return round(
            max(
                0,
                min(
                    100,
                    prediction
                )
            )
        )


    def predict_accident(self, features):

        X = np.array([[
            features.get("roadCondition", 0),
            features.get("history", 0),
            features.get("traffic", 0),
            features.get("complaints", 0),
            features.get("lighting", 0)
        ]])

        prediction = self.accident_model.predict(X)[0]

        return round(
            max(
                0,
                min(
                    100,
                    prediction
                )
            )
        )


    def predict(self, features, risk_type):

        if risk_type == "Flood":
            return self.predict_flood(features)

        if risk_type == "Accident":
            return self.predict_accident(features)

        return 0