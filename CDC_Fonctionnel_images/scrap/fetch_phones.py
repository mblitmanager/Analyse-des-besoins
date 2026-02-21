import json
import os
import subprocess
import re
import time

def fetch_phone(url, cookie_file):
    try:
        # Use curl to fetch the page
        result = subprocess.run(['curl.exe', '-b', cookie_file, '-L', url], capture_output=True, text=True, encoding='utf-8', errors='ignore')
        if result.returncode != 0:
            return None
        
        content = result.stdout
        # Search for phone in the pattern <a href="tel:...">...</a>
        phone_match = re.search(r'href="tel:([^"]+)"', content)
        if phone_match:
            return phone_match.group(1).strip()
        
        # Fallback: search for "Téléphone" label and getting next text
        # This is more complex but regex for the tel link is usually enough
        return None
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

with open('wizi_contacts.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

cookie_file = 'cookies.txt'
base_urls = {
    "Formateurs": "https://api.wizi-learn.com/administrateur/formateur/",
    "Pole Relation Clients": "https://api.wizi-learn.com/administrateur/pole_relation_clients/",
    "Commercials": "https://api.wizi-learn.com/administrateur/commercials/"
}

for category, contacts in data.items():
    print(f"Processing category: {category}")
    base_url = base_urls.get(category)
    if not base_url:
        continue
        
    for contact in contacts:
        if contact.get("ID"):
            url = base_url + contact["ID"]
            print(f"Fetching phone for {contact['Nom']} {contact['Prénom']} (ID: {contact['ID']})...")
            phone = fetch_phone(url, cookie_file)
            contact["Téléphone"] = phone if phone else "N/A"
            time.sleep(1) # Be polite

with open('wizi_contacts_full.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print("Finished fetching all phone numbers.")
