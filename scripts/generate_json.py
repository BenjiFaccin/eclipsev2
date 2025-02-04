import pandas as pd
import json
import os

# 📌 Chemin vers ton fichier Excel
excel_path = os.path.join(os.path.dirname(__file__), "../build/assets/LastUpdatedWithPredictions.xlsx")

# 📌 Charger le fichier Excel
df = pd.read_excel(excel_path)

# 📌 Sélectionner les colonnes nécessaires
df = df[["date", "Predicted Variable"]]

# 📌 Convertir la colonne date au bon format
df["date"] = pd.to_datetime(df["date"]).dt.strftime('%Y-%m-%d')

# 📌 Convertir en JSON
predictions = df.to_dict(orient="records")

# 📌 Définir le chemin du fichier JSON
json_folder_path = os.path.join(os.path.dirname(__file__), "../docs/Download Data")
json_output_path = os.path.join(json_folder_path, "signals.json")

# 🚀 **Créer le dossier s'il n'existe pas**
os.makedirs(json_folder_path, exist_ok=True)

# 📌 Sauvegarder le fichier JSON
with open(json_output_path, "w") as json_file:
    json.dump({"predictions": predictions}, json_file, indent=4)

print(f"✅ Fichier JSON mis à jour : {json_output_path}")
