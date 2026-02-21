import json
import csv

# Load the full JSON data
with open('wizi_contacts_full.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Define CSV file path
csv_file = 'wizi_contacts.csv'

# Open file for writing
with open(csv_file, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.writer(f, delimiter=';')
    # Write header
    writer.writerow(['Catégorie', 'Civilité', 'ID', 'Nom', 'Prénom', 'Email', 'Téléphone'])
    
    # Iterate through categories and contacts
    for category, contacts in data.items():
        for contact in contacts:
            writer.writerow([
                category,
                contact.get('Civilité', ''),
                contact.get('ID', ''),
                contact.get('Nom', ''),
                contact.get('Prénom', ''),
                contact.get('Email', ''),
                contact.get('Téléphone', '')
            ])

print(f"Successfully exported data to {csv_file}")
