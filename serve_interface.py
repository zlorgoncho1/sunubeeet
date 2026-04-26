#!/usr/bin/env python3
"""
Serveur HTTP simple pour l'interface (port 8000)
Permet au frontend d'accéder à l'API (port 5000)
"""

import http.server
import socketserver
import os
import webbrowser
import time
from pathlib import Path

# Configuration
PORT = 8000
API_PORT = 5000
INTERFACE_DIR = Path(__file__).parent / "ml"

os.chdir(INTERFACE_DIR)

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Format amélioré
        if "GET" in format or "POST" in format:
            print(f"📡 {self.client_address[0]:15} → {format % args}")

print("\n" + "="*70)
print("🌐 SERVEUR HTTP INTERFACE")
print("="*70)
print(f"\n📂 Répertoire: {INTERFACE_DIR}")
print(f"🔗 Interface: http://localhost:{PORT}/interface_simple.html")
print(f"🔗 API: http://localhost:{API_PORT}/alerte/")
print(f"\n✅ Démarrage du serveur sur le port {PORT}...\n")

try:
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"\n✅ Serveur actif! Ouverture du DASHBOARD...\n")
        
        # Attendre que le serveur soit vraiment prêt
        time.sleep(1)
        
        # Ouvrir le dashboard
        webbrowser.open(f"http://localhost:{PORT}/dashboard.html")
        
        print(f"🎉 Dashboard ouvert dans le navigateur!")
        print(f"\n💡 Conseil: L'API est sur le port {API_PORT}")
        print(f"            Le dashboard est sur le port {PORT}")
        print(f"            Les requêtes fetch fonctionnent maintenant! ✅\n")
        print("="*70)
        print("Appuyez sur Ctrl+C pour arrêter le serveur")
        print("="*70 + "\n")
        
        httpd.serve_forever()
        
except KeyboardInterrupt:
    print("\n\n✅ Serveur arrêté")
except OSError as e:
    print(f"\n❌ Erreur: {e}")
    print(f"   Le port {PORT} est peut-être déjà utilisé?")
