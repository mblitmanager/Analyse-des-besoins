import csv
import psycopg2
import os
import re

# File paths
csv_path = r'c:\Users\MBL IT MANAGER\Desktop\Herizo\AOPIA-LIKE\Analyse des besoins\CDC_Fonctionnel_images\scrap\wizi_contacts.csv'
env_path = r'c:\Users\MBL IT MANAGER\Desktop\Herizo\AOPIA-LIKE\Analyse des besoins\projet-app\backend\.env'

# Read .env for DATABASE_URL
db_url = None
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            db_url = line.split('=', 1)[1].strip()
            # Remove quotes if present
            db_url = re.sub(r'^["\']|["\']$', '', db_url)

if not db_url:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # Ensure table exists (since synchronize is false)
    # Mapping based on Contact entity
    cur.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            id SERIAL PRIMARY KEY,
            civilite VARCHAR DEFAULT '',
            nom VARCHAR NOT NULL,
            prenom VARCHAR NOT NULL,
            telephone VARCHAR DEFAULT '',
            email VARCHAR,
            conseiller VARCHAR,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Read CSV
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f, delimiter=';')
        count = 0
        headers = reader.fieldnames
        print(f"Headers found: {headers}")
        
        for row in reader:
            # Map Catégorie to conseiller
            # Nom to nom
            # Prénom to prenom
            # Email to email
            # Téléphone to telephone
            
            cat = row.get('Catégorie') or row.get('\ufeffCatégorie')
            nom = row['Nom']
            prenom = row['Prénom']
            email = row['Email']
            tel = row['Téléphone']

            cur.execute("""
                INSERT INTO contacts (civilite, nom, prenom, email, telephone, conseiller)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                'N/A', # civilite
                nom,
                prenom,
                email,
                tel,
                cat # conseiller
            ))
            count += 1
            
    conn.commit()
    print(f"Successfully inserted {count} contacts into the database.")
    
    cur.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
    if 'conn' in locals():
        conn.rollback()
