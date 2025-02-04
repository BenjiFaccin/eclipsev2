import pandas as pd
import os

# 📌 Chemin vers ton fichier Excel
excel_path = os.path.join(os.path.dirname(__file__), "../build/assets/LastUpdatedWithPredictions.xlsx")

# 📌 Charger le fichier Excel
df = pd.read_excel(excel_path)

# 📌 Sélectionner les colonnes nécessaires
df = df[["date", "Predicted Variable"]]

# 📌 Convertir la colonne date au bon format
df["date"] = pd.to_datetime(df["date"]).dt.strftime('%Y-%m-%d')

# 📌 Définir le chemin du fichier CSV
csv_folder_path = os.path.join(os.path.dirname(__file__), "../docs/Download Data")
csv_output_path = os.path.join(csv_folder_path, "signals.csv")

# 🚀 **Créer le dossier s'il n'existe pas**
os.makedirs(csv_folder_path, exist_ok=True)

# 📌 Sauvegarder le fichier CSV
df.to_csv(csv_output_path, index=False)

print(f"✅ Fichier CSV mis à jour : {csv_output_path}")
