# app.py
from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from flask_cors import CORS  # ही ओळ जोडा

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Load the model and scaler
try:
    model = joblib.load('salary_model.pkl')
    scaler = joblib.load('scaler.pkl')
    print("Model and scaler loaded successfully")
except Exception as e:
    print(f"Error loading model or scaler: {str(e)}")
    raise e

# Create label encoders for categorical features
label_encoders = {}
categorical_cols = ['workclass', 'education', 'marital-status', 'occupation', 
                   'relationship', 'race', 'gender']

categories = {
    'workclass': ['Private', 'Self-emp-not-inc', 'Self-emp-inc', 'Federal-gov', 
                 'Local-gov', 'State-gov'],
    'education': ['Bachelors', 'Some-college', '11th', 'HS-grad', 'Prof-school', 
                 'Assoc-acdm', 'Assoc-voc', '9th', '7th-8th', '12th', 'Masters', 
                 '1st-4th', '10th', 'Doctorate', '5th-6th', 'Preschool'],
    'marital-status': ['Married-civ-spouse', 'Divorced', 'Never-married', 
                      'Separated', 'Widowed', 'Married-spouse-absent', 
                      'Married-AF-spouse'],
    'occupation': ['Tech-support', 'Craft-repair', 'Other-service', 'Sales', 
                  'Exec-managerial', 'Prof-specialty', 'Handlers-cleaners', 
                  'Machine-op-inspct', 'Adm-clerical', 'Farming-fishing', 
                  'Transport-moving', 'Priv-house-serv', 'Protective-serv', 
                  'Armed-Forces'],
    'relationship': ['Wife', 'Own-child', 'Husband', 'Not-in-family', 
                    'Other-relative', 'Unmarried'],
    'race': ['White', 'Asian-Pac-Islander', 'Amer-Indian-Eskimo', 'Other', 'Black'],
    'gender': ['Male', 'Female']
}

for col in categorical_cols:
    try:
        le = LabelEncoder()
        le.fit(categories[col])
        label_encoders[col] = le
        print(f"Label encoder created for {col}")
    except Exception as e:
        print(f"Error creating label encoder for {col}: {str(e)}")
        raise e

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        print("Received prediction request")  # Debug log
        
        # Get data from request
        data = request.get_json()
        print("Request data:", data)  # Debug log
        
        if not data:
            return jsonify({'error': 'No data received'}), 400
        
        # Create a DataFrame with the input data
        input_data = pd.DataFrame([{
            'age': data['age'],
            'workclass': data['workclass'],
            'education': data['education'],
            'educational-num': 0,  # Placeholder
            'marital-status': data['marital-status'],
            'occupation': data['occupation'],
            'relationship': data['relationship'],
            'race': data['race'],
            'gender': data['gender'],
            'capital-gain': data['capital-gain'],
            'capital-loss': data['capital-loss'],
            'hours-per-week': data['hours-per-week']
        }])
        
        print("Input DataFrame created")  # Debug log
        
        # Encode categorical variables
        for col in categorical_cols:
            if col in input_data.columns:
                input_data[col] = label_encoders[col].transform(input_data[col])
        
        print("Categorical variables encoded")  # Debug log
        
        # Set educational-num based on education
        education_mapping = {
            'Preschool': 1, '1st-4th': 2, '5th-6th': 3, '7th-8th': 4,
            '9th': 5, '10th': 6, '11th': 7, '12th': 8, 'HS-grad': 9,
            'Some-college': 10, 'Assoc-voc': 11, 'Assoc-acdm': 12,
            'Bachelors': 13, 'Masters': 14, 'Prof-school': 15, 'Doctorate': 16
        }
        
        input_data['educational-num'] = education_mapping.get(data['education'], 9)
        
        print("Educational num set")  # Debug log
        
        # Scale numerical features
        num_cols = ['age', 'educational-num', 'capital-gain', 'capital-loss', 'hours-per-week']
        input_data[num_cols] = scaler.transform(input_data[num_cols])
        
        print("Numerical features scaled")  # Debug log
        
        # Make prediction
        prediction = model.predict(input_data)
        probability = model.predict_proba(input_data)[0][1]
        
        print(f"Prediction: {prediction[0]}, Probability: {probability}")  # Debug log
        
        return jsonify({
            'prediction': int(prediction[0]),
            'probability': float(probability)
        })
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")  # Debug log
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')