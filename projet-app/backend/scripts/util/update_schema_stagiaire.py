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
    
    print("Creating 'stagiaires' table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS stagiaires (
            id SERIAL PRIMARY KEY,
            civilite VARCHAR NOT NULL,
            nom VARCHAR NOT NULL,
            prenom VARCHAR NOT NULL,
            email VARCHAR UNIQUE NOT NULL,
            telephone VARCHAR NOT NULL,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    print("Adding 'stagiaireId' to 'sessions' table...")
    cur.execute("""
        ALTER TABLE sessions 
        ADD COLUMN IF NOT EXISTS "stagiaireId" INTEGER REFERENCES stagiaires(id);
    """)
    
    conn.commit()
    print("Database schema updated successfully.")
    
    cur.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
    if 'conn' in locals():
        conn.rollback()
