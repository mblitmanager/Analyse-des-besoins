import re
import os
import json

def extract_contacts(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all rows in tbody
    tbody_match = re.search(r'<tbody>(.*?)</tbody>', content, re.DOTALL)
    if not tbody_match:
        return []
    
    tbody = tbody_match.group(1)
    # Find each tr
    rows = re.findall(r'<tr>(.*?)</tr>', tbody, re.DOTALL)
    
    contacts = []
    for row in rows:
        # Extract Surname/Name and Email
        # Usually Name is first, then Surname or vice-versa depending on the page
        # Formateurs: Nom, Prénom, Email
        # PRC: #, Nom, Prénom, Email
        # Commercials: Nom, Prénom, Email
        
        cells = re.findall(r'<td.*?>(.*?)</td>', row, re.DOTALL)
        if not cells:
            continue
            
        # Clean tags
        clean_cells = [re.sub(r'<[^>]*>', '', cell).strip() for cell in cells]
        
        # Check for mailto
        email_match = re.search(r'mailto:([^"]+)', row)
        email = email_match.group(1) if email_match else ""
        
        # Find ID from the 'Afficher' link
        id_match = re.search(r'href="https://api\.wizi-learn\.com/administrateur/(?:formateur|pole_relation_clients|commercials)/(\d+)"', row)
        contact_id = id_match.group(1) if id_match else ""
        
        if "formateurs.html" in file_path:
            # Nom, Prénom, Email, Actions
            contacts.append({
                "ID": contact_id,
                "Nom": clean_cells[0],
                "Prénom": clean_cells[1],
                "Email": email
            })
        elif "pole_relation_clients.html" in file_path:
            # #, Nom, Prénom, Email, Actions
            contacts.append({
                "ID": contact_id,
                "Civilité": "",
                "Nom": clean_cells[1],
                "Prénom": clean_cells[2],
                "Email": email
            })
        elif "commercials.html" in file_path:
            # Nom, Prénom, Email, Actions
            contacts.append({
                "ID": contact_id,
                "Nom": clean_cells[0],
                "Prénom": clean_cells[1],
                "Email": email
            })
            
    return contacts

# Define files
files = [
    "formateurs.html",
    "pole_relation_clients.html",
    "commercials.html"
]

all_data = {}
for file in files:
    if os.path.exists(file):
        category = file.replace(".html", "").replace("_", " ").title()
        all_data[category] = extract_contacts(file)

with open("wizi_contacts.json", "w", encoding="utf-8") as f:
    json.dump(all_data, f, indent=4, ensure_ascii=False)

print(f"Extracted {sum(len(v) for v in all_data.values())} contacts.")
