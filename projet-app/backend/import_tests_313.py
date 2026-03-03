import psycopg2
import os
import re
import json

env_path = r'c:\Users\MBL IT MANAGER\Desktop\Herizo\AOPIA-LIKE\Analyse des besoins\projet-app\backend\.env'
parsed_dir = r'c:\Users\MBL IT MANAGER\Desktop\Herizo\AOPIA-LIKE\Analyse des besoins\projet-app\parsed_tests'

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    text = text.strip('-')
    return text

def get_db_url():
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('DATABASE_URL='):
                url = line.split('=', 1)[1].strip()
                return re.sub(r'^["\']|["\']$', '', url)
    return None

def parse_markdown(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    levels = []
    current_level = None
    
    # Split by level headers
    # Matches __Niveau ...__ or ## ... __Niveau ...__
    sections = re.split(r'(?:^|\n)(?:\s*|##.*?)__Niveau\s+(.*?)__', content, flags=re.IGNORECASE)
    
    # sections[0] is header/garbage
    # sections[1] is level 1 label
    # sections[2] is level 1 content
    # ...
    
    for i in range(1, len(sections), 2):
        level_label = sections[i].strip()
        level_content = sections[i+1]
        
        # Parse threshold
        threshold = 4 # default
        threshold_match = re.search(r'si\s+(\d+)/(\d+)', level_content, re.IGNORECASE)
        if threshold_match:
            threshold = int(threshold_match.group(1))

        questions = []
        # Split by question lines
        # Matches 1- ... or Q1. ... or # <a id="..."></a>...
        q_sections = re.split(r'(?:^|\n)(?:(?:\s*|#\s*<a.*?>)\s*(?:__)?(?:Q\d+|[\d\\-]+)\.\s*|#\s*<a.*?>\s*)(.*?)(?:\n|$)', level_content, re.IGNORECASE)
        
        # q_sections[0] is garbage before first question
        # q_sections[1] is question 1 text
        # q_sections[2] is options for question 1
        
        for j in range(1, len(q_sections), 2):
            q_text = q_sections[j].strip()
            if not q_text: continue
            
            opts_content = q_sections[j+1]
            options = []
            correct_idx = 0
            
            # Match options like - A. Text or A. Text
            opt_matches = re.finditer(r'(?:^|\n)\s*(?:-\s*)?([A-D])[\.\)]\s*(.*?)(?=\s*[✅]|$)', opts_content)
            
            idx = 0
            for m in opt_matches:
                opt_text = m.group(2).strip()
                # Check if this line actually ends with ✅ in the original text
                # Re-check with the checkmark because the split might have missed it or it's inside m.group(2)
                full_opt_line = opts_content[m.start():m.end()+2] # Look a bit ahead
                options.append(opt_text)
                if '✅' in full_opt_line:
                    correct_idx = idx
                idx += 1
            
            if options:
                questions.append({
                    'text': q_text,
                    'options': options,
                    'correctIndex': correct_idx
                })
        
        levels.append({
            'label': level_label,
            'threshold': threshold,
            'questions': questions
        })
    
    return levels

def import_formation(cur, slug, label, levels):
    # Ensure formation exists
    cur.execute("SELECT id FROM formations WHERE slug = %s", (slug,))
    row = cur.fetchone()
    if not row:
        cur.execute("INSERT INTO formations (slug, label, \"isActive\", \"prerequisQuestionsScope\", \"complementaryQuestionsScope\", \"availabilitiesQuestionsScope\", \"miseANiveauQuestionsScope\") VALUES (%s, %s, true, 'global', 'global', 'global', 'global') RETURNING id", (slug, label))
        formation_id = cur.fetchone()[0]
    else:
        formation_id = row[0]

    # Clear existing levels and questions for this formation (Positionnement type)
    cur.execute("DELETE FROM questions WHERE \"formationId\" = %s AND type = 'positionnement'", (formation_id,))
    cur.execute("DELETE FROM levels WHERE \"formationId\" = %s", (formation_id,))

    for idx, lvl in enumerate(levels):
        cur.execute("INSERT INTO levels (label, \"order\", \"successThreshold\", \"formationId\") VALUES (%s, %s, %s, %s) RETURNING id", 
                    (lvl['label'], idx + 1, lvl['threshold'], formation_id))
        level_id = cur.fetchone()[0]
        
        for q_idx, q in enumerate(lvl['questions']):
            cur.execute("""
                INSERT INTO questions (text, options, \"correctResponseIndex\", \"order\", \"isActive\", type, \"responseType\", \"levelId\", \"formationId\")
                VALUES (%s, %s, %s, %s, true, 'positionnement', 'qcm', %s, %s)
            """, (q['text'], json.dumps(q['options']), q['correctIndex'], q_idx + 1, level_id, formation_id))

def main():
    db_url = get_db_url()
    if not db_url:
        print("Error: DATABASE_URL not found")
        return

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    try:
        # Outlook
        print("Parsing Outlook...")
        outlook_levels = parse_markdown(os.path.join(parsed_dir, "Outlook-Test AB.md"))
        print(f"Importing Outlook: {len(outlook_levels)} levels found")
        import_formation(cur, "outlook", "Outlook", outlook_levels)
        
        # Photoshop
        print("Parsing Photoshop...")
        photoshop_levels = parse_markdown(os.path.join(parsed_dir, "Photoshop-Test AB.md"))
        print(f"Importing Photoshop: {len(photoshop_levels)} levels found")
        import_formation(cur, "photoshop", "Photoshop", photoshop_levels)

        conn.commit()
        print("Import completed successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Error during import: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
