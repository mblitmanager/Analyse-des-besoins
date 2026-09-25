import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def update_questions_schema():
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        conn = psycopg2.connect(database_url)
    else:
        conn = psycopg2.connect(
            host=os.getenv('DATABASE_HOST', 'localhost'),
            port=os.getenv('DATABASE_PORT', '5432'),
            user=os.getenv('DATABASE_USER', 'postgres'),
            password=os.getenv('DATABASE_PASSWORD', 'postgres'),
            dbname=os.getenv('DATABASE_NAME', 'wizy_learn')
        )
    cur = conn.cursor()

    print("Updating 'questions' table schema...")
    
    # Add new columns if they don't exist
    try:
        cur.execute("ALTER TABLE questions ADD COLUMN category VARCHAR(255);")
        print("Added 'category' column.")
    except Exception as e:
        conn.commit() # Reset transaction
        print("'category' column might already exist.")

    try:
        cur.execute("ALTER TABLE questions ADD COLUMN icon VARCHAR(255);")
        print("Added 'icon' column.")
    except Exception as e:
        conn.commit()
        print("'icon' column might already exist.")

    try:
        cur.execute("ALTER TABLE questions ADD COLUMN metadata JSONB;")
        print("Added 'metadata' column.")
    except Exception as e:
        conn.commit()
        print("'metadata' column might already exist.")

    try:
        cur.execute("ALTER TABLE questions ADD COLUMN \"formationId\" INTEGER REFERENCES formations(id);")
        print("Added 'formationId' column.")
    except Exception as e:
        conn.commit()
        print("'formationId' column might already exist.")

    # Seeding complementary questions
    print("Seeding complementary questions...")
    complementary_questions = [
        ('Quel est votre métier actuel ou visé ?', '[]', 0, 1, True, 'complementary', 'Projet Professionnel', 'work', '{"placeholder": "Ex: Comptable, Développeur..."}'),
        ('Quels sont vos objectifs d\'employabilité ?', '[]', 0, 2, True, 'complementary', 'Projet Professionnel', 'trending_up', '{"type": "textarea", "placeholder": "Quels sont vos objectifs professionnels ?"}'),
        ('Êtes-vous en situation de handicap ?', '["Oui", "Non"]', 0, 3, True, 'complementary', 'Accessibilité', 'wheelchair_pickup', '{"type": "radio_toggle"}'),
        ('Précisions sur votre situation (optionnel)', '[]', 0, 4, True, 'complementary', 'Accessibilité', 'description', '{"type": "textarea", "condition": "handicap == \'Oui\'", "placeholder": "Comment pouvons-nous adapter la formation ?"}')
    ]

    for text, options, correct, order, active, qtype, category, icon, metadata in complementary_questions:
        cur.execute("""
            INSERT INTO questions (text, options, "correctResponseIndex", "order", "isActive", type, category, icon, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING;
        """, (text, options, correct, order, active, qtype, category, icon, metadata))

    # Seeding availabilities questions
    print("Seeding availabilities questions...")
    availabilities_questions = [
        ('Quels sont vos créneaux préférés ?', '["Matin", "Après-midi", "Journée complète"]', 0, 1, True, 'availabilities', 'Plannification', 'schedule', '{"type": "multi_select", "icons": ["light_mode", "wb_twilight", "sunny"]}'),
        ('À partir de quelle date seriez-vous disponible ?', '[]', 0, 2, True, 'availabilities', 'Plannification', 'event', '{"type": "text", "placeholder": "Ex: à partir du 15 Mars, les lundis..."}'),
        ('Avez-vous d\'autres contraintes horaires ou commentaires ?', '[]', 0, 3, True, 'availabilities', 'Plannification', 'chat', '{"type": "textarea", "placeholder": "Informations complémentaires..."}')
    ]

    for text, options, correct, order, active, qtype, category, icon, metadata in availabilities_questions:
        cur.execute("""
            INSERT INTO questions (text, options, "correctResponseIndex", "order", "isActive", type, category, icon, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING;
        """, (text, options, correct, order, active, qtype, category, icon, metadata))

    conn.commit()
    cur.close()
    conn.close()
    print("Schema update and seeding completed.")

if __name__ == "__main__":
    update_questions_schema()
