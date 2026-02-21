import json

def guess_civilite(first_name):
    first_name = first_name.split('-')[0].split(' ')[0].capitalize()
    
    males = {
        'Alexis', 'Bastien', 'Charlie', 'Esteban', 'Geoffrey', 'Kevin', 'Manuel', 
        'Philippe', 'Wilfried', 'Alexandre', 'Nicolas', 'Bruno', 'Franck', 
        'Simon', 'Cédric', 'Maxence', 'Christophe', 'Arnaud', 'Thierry'
    }
    females = {
        'Anne', 'Audrey', 'Camille', 'Cécile', 'Elodie', 'Julie', 'Justine', 
        'Lisa', 'Ludiwine', 'Manon', 'Marie', 'Marion', 'Michelle', 'Océane', 
        'Romane', 'Sonia', 'Sophie', 'Sylvie', 'Laurie', 'Nathalie', 'Merryl', 
        'Emilie', 'Gwladys', 'Danila', 'Chloé', 'Loétitia', 'Séverine', 'Béatrice', 
        'Jade', 'Charlène', 'Amandine', 'Estelle', 'Aurélie', 'Mélinda', 'Valérie', 
        'Ghislaine', 'Sandrine', 'Véronique', 'Isabelle', 'Elisabeth', 'Élisabeth'
    }
    
    if first_name in males:
        return 'M.'
    if first_name in females:
        return 'Mme.'
    return ''

# Load data
with open('wizi_contacts_full.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Process
for category, contacts in data.items():
    for contact in contacts:
        contact['Civilité'] = guess_civilite(contact.get('Prénom', ''))

# Save
with open('wizi_contacts_full.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print("Civility guessing complete.")
