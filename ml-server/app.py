from flask import Flask, request, jsonify
from flask_cors import CORS

from model import UrbanRiskModel


app = Flask(__name__)

CORS(app)

model = UrbanRiskModel()


@app.route("/")
def home():

    return jsonify({
        "status": "online",
        "service": "UrbanRisk ML API"
    })


@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No JSON data received"
            }), 400


        risk_type = data.get(
            "type"
        )

        features = data.get(
            "features",
            {}
        )


        if risk_type not in [
            "Flood",
            "Accident"
        ]:

            return jsonify({
                "error": "Invalid risk type"
            }), 400


        prediction = model.predict(
            features,
            risk_type
        )


        return jsonify({

            "success": True,

            "type": risk_type,

            "risk": prediction,

            "model": "RandomForestRegressor"

        })


    except Exception as error:

        print(
            "Prediction error:",
            error
        )

        return jsonify({

            "success": False,

            "error": str(error)

        }), 500


if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )