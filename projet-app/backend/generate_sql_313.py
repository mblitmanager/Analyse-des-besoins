import os
import re
import json

parsed_dir = r'c:\Users\MBL IT MANAGER\Desktop\Herizo\AOPIA-LIKE\Analyse des besoins\projet-app\parsed_tests'
output_sql = r'c:\Users\MBL IT MANAGER\Desktop\Herizo\AOPIA-LIKE\Analyse des besoins\projet-app\import_tests.sql'

def parse_markdown(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    levels = []
    current_level = None
    current_question = None
    
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # 1. Detect Level
        # Matches __Niveau INITIAL__, ## __Niveau INITIAL__, etc.
        if 'Niveau' in line and not any(x in line for x in ['Passage', '/', 'Questions']):
            lbl = line.replace('#', '').replace('_', '').replace('*', '').strip()
            if lbl.lower().startswith('niveau'):
                if current_level:
                    if current_question: current_level['questions'].append(current_question)
                    levels.append(current_level)
                    current_question = None
                current_level = {'label': lbl.split('Niveau')[-1].strip(), 'threshold': 4, 'questions': []}
                continue

        if not current_level: continue

        # 2. Detect Threshold
        m = re.search(r'si\s+(\d+)/(\d+)', line)
        if m:
            current_level['threshold'] = int(m.group(1))
            continue

        # 3. Detect Question
        # Matches 1- , Q1. , # <a id=...
        is_q = False
        q_text = ""
        q_match = re.match(r'^(?:#\s*<a.*?>\s*|(?:\s*_{0,2}Q?\d+[\.\-]))', line, re.I)
        if q_match:
            is_q = True
            # Extract text
            if '</a>' in line:
                 q_text = line.split('</a>')[-1].strip()
            else:
                 q_text = re.sub(r'^(?:\s*_{0,2}Q?\d+[\.\-]\s*)', '', line).strip()
        
        if is_q:
            if current_question: current_level['questions'].append(current_question)
            current_question = {'text': q_text.replace('_', '').strip(), 'options': [], 'correctIndex': 0}
            continue

        # 4. Detect Option
        # Matches - A. , A. , __B.
        clean = line.replace('_', '').replace('*', '').replace('-', '').strip()
        if re.match(r'^[A-D][\.\)]', clean):
             if current_question:
                 opt_text = re.sub(r'^[A-D][\.\)]\s*', '', clean).replace('✅', '').strip()
                 current_question['options'].append(opt_text)
                 if '✅' in line:
                     current_question['correctIndex'] = len(current_question['options']) - 1
             continue
             
        # Question text continuation
        if current_question and not current_question['options']:
             txt = line.replace('_', '').replace('*', '').strip()
             if txt:
                 current_question['text'] = (current_question['text'] + " " + txt).strip()

    if current_level:
        if current_question: current_level['questions'].append(current_question)
        levels.append(current_level)
    return levels

def generate_sql(slug, label, levels):
    lines = [f"-- {label} ({slug})"]
    lines.append(f"INSERT INTO formations (slug, label) SELECT '{slug}', '{label}' WHERE NOT EXISTS (SELECT 1 FROM formations WHERE slug = '{slug}');")
    lines.append("DO $$ DECLARE v_fid int; v_lid int; BEGIN")
    lines.append(f"  SELECT id INTO v_fid FROM formations WHERE slug = '{slug}';")
    lines.append("  DELETE FROM questions WHERE \"formationId\" = v_fid AND type = 'positionnement';")
    lines.append("  DELETE FROM levels WHERE \"formationId\" = v_fid;")
    for l_idx, lvl in enumerate(levels):
        if not lvl['questions']: continue
        lbl = lvl['label'].replace("'", "''")
        lines.append(f"  INSERT INTO levels (label, \"order\", \"successThreshold\", \"formationId\") VALUES ('{lbl}', {l_idx+1}, {lvl['threshold']}, v_fid) RETURNING id INTO v_lid;")
        for q_idx, q in enumerate(lvl['questions']):
            txt = q['text'].replace("'", "''")
            opts = json.dumps(q['options']).replace("'", "''")
            lines.append(f"  INSERT INTO questions (text, options, \"correctResponseIndex\", \"order\", \"isActive\", type, \"responseType\", \"levelId\", \"formationId\") VALUES ('{txt}', '{opts}', {q['correctIndex']}, {q_idx+1}, true, 'positionnement', 'qcm', v_lid, v_fid);")
    lines.append("END $$;")
    return "\n".join(lines)

def main():
    sql = ["-- Automated Test Import", "BEGIN;"]
    for s, l, f in [("outlook", "Outlook", "Outlook-Test AB.md"), ("photoshop", "Photoshop", "Photoshop-Test AB.md")]:
        p = os.path.join(parsed_dir, f)
        if os.path.exists(p):
            print(f"Parsing {l}...")
            parsed = parse_markdown(p)
            print(f"  {l}: Found {len(parsed)} levels")
            for lv in parsed:
                print(f"    Level {lv['label']}: {len(lv['questions'])} questions")
            sql.append(generate_sql(s, l, parsed))
    sql.append("\nCOMMIT;")
    with open(output_sql, 'w', encoding='utf-8') as f: f.write("\n\n".join(sql))

if __name__ == "__main__": main()
