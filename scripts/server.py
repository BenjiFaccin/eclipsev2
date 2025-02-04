from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# URL brute du fichier JSON sur GitHub
GITHUB_JSON_URL = "https://raw.githubusercontent.com/BenjiFaccin/eclipsev2/main/docs/Download%20Data/signals.json"

# Webhook de TradingView (remplace par ton URL Webhook TradingView)
TRADINGVIEW_WEBHOOK_URL = "https://your-tradingview-webhook.com"

def get_latest_json():
    """Récupère les données du fichier JSON GitHub"""
    response = requests.get(GITHUB_JSON_URL)
    if response.status_code == 200:
        return response.json()
    return None

@app.route('/update_signal', methods=['POST'])
def update_signal():
    """Déclenché par GitHub Webhook, récupère et envoie les signaux à TradingView"""
    data = get_latest_json()
    if data:
        payload = {
            "timestamp": data[-1]['timestamp'],  # Prend la dernière valeur du JSON
            "value": data[-1]['Predicted Variable']
        }
        headers = {'Content-Type': 'application/json'}
        requests.post(TRADINGVIEW_WEBHOOK_URL, json=payload, headers=headers)
        return jsonify({"status": "Signal envoyé", "data": payload}), 200
    return jsonify({"status": "Erreur lors de la récupération du JSON"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
