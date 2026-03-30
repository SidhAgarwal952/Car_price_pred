from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import random

app = Flask(__name__)
CORS(app)

# ─── Synthetic training data ───────────────────────────────────────────────────
def generate_training_data(n=3000):
    random.seed(42)
    np.random.seed(42)

    brands = ["Maruti Suzuki", "Hyundai", "Tata", "Honda", "Toyota",
              "Mahindra", "Kia", "Ford", "BMW", "Mercedes-Benz"]

    brand_base = {
        "Maruti Suzuki": 500000, "Hyundai": 700000, "Tata": 600000,
        "Honda": 900000, "Toyota": 1100000, "Mahindra": 850000,
        "Kia": 950000, "Ford": 800000, "BMW": 3500000, "Mercedes-Benz": 4500000,
    }
    fuels    = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"]
    trans    = ["Manual", "Automatic", "AMT", "CVT"]
    conds    = ["Excellent", "Good", "Fair", "Poor"]
    cities   = ["Mumbai", "Delhi", "Bangalore", "Chennai",
                "Hyderabad", "Pune", "Meerut", "Lucknow"]

    fuel_mult  = {"Petrol": 1.0, "Diesel": 1.10, "CNG": 0.90, "Electric": 1.25, "Hybrid": 1.15}
    trans_mult = {"Manual": 1.0, "Automatic": 1.12, "AMT": 1.05, "CVT": 1.08}
    cond_mult  = {"Excellent": 1.0, "Good": 0.88, "Fair": 0.72, "Poor": 0.55}
    city_mult  = {"Mumbai": 1.08, "Delhi": 1.05, "Bangalore": 1.06, "Chennai": 1.02,
                  "Hyderabad": 1.03, "Pune": 1.04, "Meerut": 0.95, "Lucknow": 0.96}

    rows = []
    for _ in range(n):
        brand  = random.choice(brands)
        year   = random.randint(2008, 2025)
        fuel   = random.choice(fuels)
        tr     = random.choice(trans)
        cond   = random.choice(conds)
        city   = random.choice(cities)
        kms    = random.randint(5000, 200000)
        owners = random.randint(1, 4)

        age   = 2025 - year
        base  = brand_base[brand]
        price = (base
                 * fuel_mult[fuel]
                 * trans_mult[tr]
                 * cond_mult[cond]
                 * city_mult[city]
                 * (0.88 ** age)
                 * (1 - kms / 1_200_000)
                 * (1 - (owners - 1) * 0.07)
                 + np.random.normal(0, base * 0.05))
        price = max(price, 80000)

        rows.append({
            "brand": brand, "year": year, "fuel": fuel,
            "transmission": tr, "condition": cond, "city": city,
            "kms_driven": kms, "owners": owners, "price": round(price)
        })
    return pd.DataFrame(rows)


# ─── Train model ──────────────────────────────────────────────────────────────
MODEL_PATH = "model.joblib"
ENCODERS_PATH = "encoders.joblib"

cat_cols = ["brand", "fuel", "transmission", "condition", "city"]

def train():
    df = generate_training_data(3000)
    encoders = {}
    for col in cat_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le

    X = df.drop("price", axis=1)
    y = df["price"]

    model = GradientBoostingRegressor(n_estimators=200, learning_rate=0.1,
                                      max_depth=5, random_state=42)
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoders, ENCODERS_PATH)
    return model, encoders

if os.path.exists(MODEL_PATH) and os.path.exists(ENCODERS_PATH):
    model    = joblib.load(MODEL_PATH)
    encoders = joblib.load(ENCODERS_PATH)
else:
    model, encoders = train()


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.json
    try:
        row = {}
        for col in cat_cols:
            le = encoders[col]
            val = data[col]
            if val not in le.classes_:
                return jsonify({"error": f"Unknown value for {col}: {val}"}), 400
            row[col] = int(le.transform([val])[0])

        row["year"]       = int(data["year"])
        row["kms_driven"] = int(data["kms_driven"])
        row["owners"]     = int(data["owners"])

        cols = ["brand", "year", "fuel", "transmission", "condition",
                "city", "kms_driven", "owners"]
        X = pd.DataFrame([[row[c] for c in cols]], columns=cols)

        pred   = float(model.predict(X)[0])
        margin = pred * 0.08
        conf   = max(72, min(96, 96 - (row["owners"] - 1) * 4
                                   - (2025 - row["year"]) * 0.5))

        return jsonify({
            "predicted_price": round(pred),
            "price_low":       round(pred - margin),
            "price_high":      round(pred + margin),
            "confidence":      round(conf, 1),
            "currency":        "INR"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/cars", methods=["GET"])
def get_cars():
    """Return sample cars for the database page."""
    df = generate_training_data(80)
    df = df.sample(50, random_state=7).reset_index(drop=True)
    df["id"] = df.index + 1
    models_map = {
        "Maruti Suzuki": ["Swift", "Baleno", "Wagon R", "Alto", "Dzire"],
        "Hyundai":       ["i20", "Creta", "Verna", "Tucson", "i10"],
        "Tata":          ["Nexon", "Harrier", "Altroz", "Safari", "Punch"],
        "Honda":         ["City", "Amaze", "Jazz", "WR-V", "CR-V"],
        "Toyota":        ["Innova", "Fortuner", "Glanza", "Urban Cruiser", "Camry"],
        "Mahindra":      ["XUV500", "Scorpio", "Thar", "Bolero", "XUV300"],
        "Kia":           ["Seltos", "Sonet", "Carnival", "Carens", "EV6"],
        "Ford":          ["EcoSport", "Endeavour", "Figo", "Freestyle", "Aspire"],
        "BMW":           ["3 Series", "5 Series", "X1", "X3", "X5"],
        "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "A-Class", "S-Class"],
    }
    np.random.seed(7)
    df["model"] = df["brand"].apply(lambda b: np.random.choice(models_map.get(b, ["Model"])))
    records = df[["id","brand","model","year","fuel","transmission",
                  "condition","city","kms_driven","owners","price"]].to_dict(orient="records")
    return jsonify(records)


@app.route("/api/stats", methods=["GET"])
def get_stats():
    df = generate_training_data(3000)
    return jsonify({
        "total_cars":    len(df),
        "avg_price":     round(df["price"].mean()),
        "median_price":  round(df["price"].median()),
        "brand_avg":     df.groupby("brand")["price"].mean().round().astype(int).to_dict(),
        "fuel_dist":     df["fuel"].value_counts().to_dict(),
        "year_avg":      df.groupby("year")["price"].mean().round().astype(int).to_dict(),
    })


@app.route("/api/retrain", methods=["POST"])
def retrain():
    global model, encoders
    model, encoders = train()
    return jsonify({"status": "Model retrained successfully"})


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "GradientBoostingRegressor"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
