import csv
import psycopg2
import os
import re

# File paths
csv_path = r'c:\Users\MBL IT MANAGER\Desktop\Herizo\AOPIA-LIKE\Analyse des besoins\CDC_Fonctionnel_images\scrap\formations_aopia_like.csv'
env_path = r'c:\Users\MBL IT MANAGER\Desktop\Herizo\AOPIA-LIKE\Analyse des besoins\projet-app\backend\.env'

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    text = text.strip('-')
    return text

# Read .env for DATABASE_URL
db_url = None
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            db_url = line.split('=', 1)[1].strip()
            db_url = re.sub(r'^["\']|["\']$', '', db_url)

if not db_url:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # Ensure table columns exist (since synchronize is false)
    print("Applying schema updates to 'formations' table...")
    cur.execute("ALTER TABLE formations ADD COLUMN IF NOT EXISTS objectifs TEXT;")
    cur.execute("ALTER TABLE formations ADD COLUMN IF NOT EXISTS prequis TEXT;")
    cur.execute("ALTER TABLE formations ADD COLUMN IF NOT EXISTS \"modaliteDuree\" TEXT;")
    cur.execute("ALTER TABLE formations ADD COLUMN IF NOT EXISTS \"dateEnregistrement\" VARCHAR;")
    cur.execute("ALTER TABLE formations ADD COLUMN IF NOT EXISTS certificateur VARCHAR;")
    cur.execute("ALTER TABLE formations ADD COLUMN IF NOT EXISTS programme TEXT;")
    
    # 1. Clear existing data (DANGEROUS but requested reset)
    print("Clearing existing questions, levels, and formations...")
    cur.execute("DELETE FROM questions;")
    cur.execute("DELETE FROM levels;")
    cur.execute("DELETE FROM formations;")
    
    # 2. Read CSV
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            title = row['Titre']
            slug = slugify(title)
            
            # Insert Formation
            cur.execute("""
                INSERT INTO formations (slug, label, objectifs, prequis, "modaliteDuree", "dateEnregistrement", certificateur, programme, "isActive")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                slug,
                title,
                row['Objectifs'],
                row['Prérequis'],
                row['Modalité et durée'],
                row["Date d'enregistrement"],
                row['Certificateur'],
                row['Programme de formation'],
                True
            ))
            formation_id = cur.fetchone()[0]
            
            # 3. Create Levels
            levels_to_create = []
            if "Anglais" in title:
                levels_to_create = [
                    ("A1 - Découverte", 1),
                    ("A2 - Usuel", 2),
                    ("B1 - Seuil", 3),
                    ("B2 - Indépendant", 4),
                    ("C1 - Autonome", 5),
                    ("C2 - Maîtrise", 6)
                ]
            elif "Excel" in title:
                levels_to_create = [
                    ("Débutant", 1),
                    ("Intermédiaire", 2),
                    ("Avancé", 3),
                    ("Expert", 4)
                ]
            else:
                levels_to_create = [
                    ("Débutant", 1),
                    ("Intermédiaire", 2),
                    ("Avancé", 3)
                ]
            
            for lbl, order in levels_to_create:
                cur.execute("""
                    INSERT INTO levels (label, "order", "successThreshold", "formationId")
                    VALUES (%s, %s, %s, %s)
                """, (lbl, order, 70, formation_id))
            
            count += 1
            print(f"Imported: {title} with {len(levels_to_create)} levels.")
            
    conn.commit()
    print(f"Successfully imported {count} formations.")
    
    cur.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
    if 'conn' in locals():
        conn.rollback()
