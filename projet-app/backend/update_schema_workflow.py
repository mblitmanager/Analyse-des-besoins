import psycopg2
import os
import re

# File path
env_path = r'c:\Users\MBL IT MANAGER\Desktop\Herizo\AOPIA-LIKE\Analyse des besoins\projet-app\backend\.env'

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
    
    print("Creating 'workflow_steps' table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS workflow_steps (
            id SERIAL PRIMARY KEY,
            code VARCHAR UNIQUE NOT NULL,
            label VARCHAR NOT NULL,
            "order" INTEGER NOT NULL,
            route VARCHAR NOT NULL,
            "isActive" BOOLEAN DEFAULT TRUE
        );
    """)
    
    print("Adding columns to 'sessions' table...")
    cur.execute("""
        ALTER TABLE sessions 
        ADD COLUMN IF NOT EXISTS "complementaryQuestions" JSONB,
        ADD COLUMN IF NOT EXISTS "availabilities" JSONB;
    """)
    
    print("Seeding default workflow steps...")
    steps = [
        ('IDENTIFICATION', 'Identification du bénéficiaire', 1, '/'),
        ('FORMATION_SELECTION', 'Choix de la formation', 2, '/formations'),
        ('PREREQUIS', 'Test informatique prérequis', 3, '/prerequis'),
        ('POSITIONNEMENT', 'Test de positionnement', 4, '/positionnement'),
        ('RESULTATS', 'Résultat et validation de la formation', 5, '/resultats'),
        ('COMPLEMENTARY', 'Questions complémentaires', 6, '/complementary'),
        ('AVAILABILITIES', 'Disponibilités', 7, '/availabilities'),
        ('VALIDATION', 'Validation finale', 8, '/validation')
    ]
    
    for code, label, order, route in steps:
        cur.execute("""
            INSERT INTO workflow_steps (code, label, "order", route)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (code) DO UPDATE SET
                label = EXCLUDED.label,
                "order" = EXCLUDED."order",
                route = EXCLUDED.route;
        """, (code, label, order, route))
    
    conn.commit()
    print("Database schema updated and seeded successfully.")
    
    cur.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
    if 'conn' in locals():
        conn.rollback()
