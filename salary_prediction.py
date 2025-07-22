# salary_prediction.py

import matplotlib
matplotlib.use('Agg')  # ✅ GUI न वापरता फाईलमध्ये save करायला

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
import os

# static फोल्डर create करायचा जर नसेल तर
os.makedirs('static', exist_ok=True)

# Load the dataset
data = pd.read_csv('adult3.csv')

# Data preprocessing
def preprocess_data(df):
    df = df.replace('?', np.nan)
    for col in df.columns:
        if df[col].dtype == 'object':
            df[col] = df[col].fillna(df[col].mode()[0])
    
    categorical_cols = ['workclass', 'education', 'marital-status', 'occupation', 
                       'relationship', 'race', 'gender', 'native-country']
    le = LabelEncoder()
    for col in categorical_cols:
        df[col] = le.fit_transform(df[col])
    
    df['income'] = le.fit_transform(df['income'])
    
    return df

processed_data = preprocess_data(data.copy())

features = ['age', 'workclass', 'education', 'educational-num', 'marital-status',
            'occupation', 'relationship', 'race', 'gender', 'capital-gain',
            'capital-loss', 'hours-per-week']
target = 'income'

X = processed_data[features]
y = processed_data[target]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
num_cols = ['age', 'educational-num', 'capital-gain', 'capital-loss', 'hours-per-week']
X_train[num_cols] = scaler.fit_transform(X_train[num_cols])
X_test[num_cols] = scaler.transform(X_test[num_cols])

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.2f}")
print(classification_report(y_test, y_pred))

joblib.dump(model, 'salary_model.pkl')
joblib.dump(scaler, 'scaler.pkl')

# ✅ Feature importance visualization
feature_importance = model.feature_importances_
features_df = pd.DataFrame({'Feature': features, 'Importance': feature_importance})
features_df = features_df.sort_values(by='Importance', ascending=False)

plt.figure(figsize=(10, 6))
sns.barplot(x='Importance', y='Feature', data=features_df)
plt.title('Feature Importance')
plt.tight_layout()
plt.savefig('static/feature_importance.png')
plt.close()

# ✅ Age vs Income visualization
plt.figure(figsize=(10, 6))
sns.boxplot(x='income', y='age', data=data)
plt.title('Age Distribution by Income Level')
plt.xlabel('Income (<=50K vs >50K)')
plt.ylabel('Age')
plt.tight_layout()
plt.savefig('static/age_income.png')
plt.close()

# ✅ Education vs Income visualization
plt.figure(figsize=(12, 6))
sns.countplot(x='education', hue='income', data=data)
plt.title('Education Level Distribution by Income')
plt.xlabel('Education Level')
plt.ylabel('Count')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('static/education_income.png')
plt.close()