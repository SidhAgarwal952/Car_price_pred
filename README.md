# AutoVal Pro — Car Price Prediction Website

A full-stack car price prediction website with:
- **Python/Flask** backend with a Gradient Boosting ML model
- **React + Vite** frontend with dark industrial design
- **3 pages**: Price Predictor, Car Database, Market Trends

---

## Project Structure

```
carprice/
├── backend/
│   ├── app.py              ← Flask API + ML model
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        └── components/
            ├── Predictor.jsx   ← Price prediction form
            ├── Database.jsx    ← Searchable car listings
            └── Trends.jsx      ← Market charts
```

---

## Setup & Run

### 1. Backend (Python Flask)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```

Backend runs at: **http://localhost:5000**

---

### 2. Frontend (React)

```bash
cd frontend

# Install Node dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint       | Description                        |
|--------|----------------|------------------------------------|
| POST   | /api/predict   | Predict car price from form inputs |
| GET    | /api/cars      | Get car listings for database page |
| GET    | /api/stats     | Market stats for trends page       |
| POST   | /api/retrain   | Retrain ML model                   |
| GET    | /api/health    | Health check                       |

### POST /api/predict — Request body

```json
{
  "brand":        "Hyundai",
  "year":         2020,
  "fuel":         "Petrol",
  "transmission": "Manual",
  "condition":    "Good",
  "city":         "Delhi",
  "kms_driven":   45000,
  "owners":       1
}
```

### Response

```json
{
  "predicted_price": 875000,
  "price_low":       805000,
  "price_high":      945000,
  "confidence":      91.5,
  "currency":        "INR"
}
```

---

## Production Deployment

### Backend (Gunicorn)
```bash
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend (Build)
```bash
cd frontend
npm run build
# Serve the dist/ folder with Nginx or any static host
```

---

## Customization

- **Real data**: Replace `generate_training_data()` in `app.py` with your actual CSV/database
- **More cities**: Add to the `city_mult` dict in `app.py` and city dropdown in `Predictor.jsx`
- **Model upgrade**: Swap `GradientBoostingRegressor` for XGBoost or LightGBM for better accuracy
- **Database**: Connect PostgreSQL/MySQL by replacing the in-memory generation with SQLAlchemy queries
