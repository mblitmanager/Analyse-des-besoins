/**
 * seed_bureautique_positionnement.js
 * Crée les niveaux (Débutant, Intermédiaire, Avancé, Expert) pour les formations:
 * Excel, Word, Photoshop et insère des questions d'exemple de prérequis / positionnement.
 * Run: node seed_bureautique_positionnement.js
 */

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

const toolsData = {
  excel: {
    slugs: ['excel', 'pack-office-excel', 'excel-expert'],
    name: 'Excel',
    prerequisites: [
      { text: "Avez-vous déjà utilisé un tableur ?", options: ["Oui, de manière régulière", "Oui, occasionnellement", "Jamais"], correct: -1, order: 1 },
      { text: "Savez-vous ce qu'est une cellule dans Excel ?", options: ["Oui, et je sais m'y repérer", "Oui, mais j'ai du mal", "Non"], correct: -1, order: 2 },
      { text: "Connaissez-vous la différence entre un classeur et une feuille ?", options: ["Oui", "Non", "Je ne suis pas sûr"], correct: -1, order: 3 },
    ],
    levels: [
      {
        label: 'Débutant', order: 1, successThreshold: 80,
        questions: [
          { text: "Comment valider une saisie dans une cellule ?", options: ["Touche Entrée", "Touche Echap", "Clic droit", "Touche Ctrl"], correct: 0, order: 1 },
          { text: "Lequel de ces éléments n'est pas un format de nombre ?", options: ["Monétaire", "Date", "Souligné", "Pourcentage"], correct: 2, order: 2 },
          { text: "Comment s'appelle l'intersection d'une ligne et d'une colonne ?", options: ["Un tableau", "Une cellule", "Un classeur", "Une plage"], correct: 1, order: 3 },
          { text: "Par quel symbole commence systématiquement une formule dans Excel ?", options: ["+", "-", "=", ":"], correct: 2, order: 4 },
          { text: "Comment sélectionner une colonne entière ?", options: ["Double-clic sur une cellule", "Clic sur la lettre en haut", "Clic droit sur la 1ère cellule", "Touche Maj + Clic"], correct: 1, order: 5 },
        ]
      },
      {
        label: 'Intermédiaire', order: 2, successThreshold: 80,
        questions: [
          { text: "Quelle fonction permet d'additionner des cellules ?", options: ["=TOTAL()", "=SOMME()", "=AJOUT()", "=PLUS()"], correct: 1, order: 1 },
          { text: "A quoi sert la poignée de recopie (petit carré en bas à droite) ?", options: ["A effacer la cellule", "A copier le contenu vers le bas/droite", "A formater la cellule", "A verrouiller la cellule"], correct: 1, order: 2 },
          { text: "Qu'est-ce qu'une référence absolue ?", options: ["Une cellule fixée par des $ (ex: $A$1)", "La première cellule du tableau", "Une cellule masquée", "Une cellule qui contient du texte"], correct: 0, order: 3 },
          { text: "Comment figer les volets (la première ligne pour qu'elle reste visible) ?", options: ["Menu Accueil > Fixer", "Menu Données > Bloquer", "Menu Affichage > Figer les volets", "Menu Insertion > Ligne statique"], correct: 2, order: 4 },
          { text: "Quelle fonction indique si une condition est remplie ?", options: ["=CONDITION()", "=TEST()", "=VRAI()", "=SI()"], correct: 3, order: 5 },
        ]
      },
      {
        label: 'Avancé', order: 3, successThreshold: 80,
        questions: [
          { text: "Quelle fonction utiliser pour chercher une valeur dans un tableau verticalement ?", options: ["=RECHERCHEV()", "=TROUVER()", "=CHERCHER()", "=INDEX()"], correct: 0, order: 1 },
          { text: "Que fait un Tableau Croisé Dynamique (TCD) ?", options: ["Il crée un graphique en 3D", "Il synthétise et analyse de grandes quantités de données", "Il fusionne plusieurs classeurs", "Il empêche la modification des données"], correct: 1, order: 2 },
          { text: "C'est quoi une mise en forme conditionnelle ?", options: ["Une couleur appliquée selon la valeur de la cellule", "Une protection par mot de passe", "Un formatage pour l'impression finale", "Une copie spéciale de formats"], correct: 0, order: 3 },
          { text: "Que retourne la formule =NB.SI(A1:A10; \">10\") ?", options: ["La somme des valeurs > 10", "Le nombre de cellules contenant une valeur > 10", "La division par 10 de la plage", "Erreur de syntaxe"], correct: 1, order: 4 },
          { text: "Quelle fonctionnalité permet d'empêcher la saisie de texte dans une cellule attendant une date ?", options: ["Validation des données", "Protection de la feuille", "Filtre avancé", "Audit de formules"], correct: 0, order: 5 },
        ]
      },
      {
        label: 'Expert', order: 4, successThreshold: 80,
        questions: [
          { text: "Comment s'appelle le langage de programmation intégré à Excel (macros) ?", options: ["Python", "VBA", "JavaScript", "C++"], correct: 1, order: 1 },
          { text: "A quoi sert l'outil Power Query ?", options: ["Importer, nettoyer et transformer des données avant analyse", "Créer des présentations Excel", "Générer du code VBA automatiquement", "Compacter le fichier pour l'envoi"], correct: 0, order: 2 },
          { text: "Quelle combinaison remplace avantageusement RECHERCHEV dans les dernières versions ?", options: ["INDEX / EQUIV", "RECHERCHEX", "INDIRECT / ADRESSE", "Les réponses A et B sont correctes"], correct: 3, order: 3 },
          { text: "Que fait la formule matricielle validée avec Ctrl+Shift+Enter (dans l'ancien moteur de calcul) ?", options: ["Elle effectue des opérations sur un tableau entier d'un coup", "Elle crypte le résultat", "Elle masque la formule", "Elle exporte vers Word"], correct: 0, order: 4 },
          { text: "Quelle est l'utilité principale du 'Gestionnaire de noms' ?", options: ["Renommer les feuilles", "Donner un nom explicite à une cellule ou une plage (ex: TauxTVA)", "Stocker les noms des clients", "Lister les auteurs du fichier"], correct: 1, order: 5 },
        ]
      }
    ]
  },
  word: {
    slugs: ['word', 'pack-office-word'],
    name: 'Word',
    prerequisites: [
      { text: "Avez-vous déjà rédigé un document sur ordinateur ?", options: ["Oui, de manière régulière", "Oui, occasionnellement", "Jamais"], correct: -1, order: 1 },
      { text: "Savez-vous comment enregistrer un document ?", options: ["Oui", "Non, pas vraiment", "Pas du tout"], correct: -1, order: 2 },
    ],
    levels: [
      {
        label: 'Débutant', order: 1, successThreshold: 80,
        questions: [
          { text: "Lequel de ces boutons permet de mettre du texte en gras ?", options: ["B (ou G)", "I", "U (ou S)", "X"], correct: 0, order: 1 },
          { text: "Comment revenir en arrière après une erreur ?", options: ["Ctrl + C", "Ctrl + Z", "Ctrl + V", "Ctrl + P"], correct: 1, order: 2 },
          { text: "Où se trouve l'option pour changer la police d'écriture ?", options: ["Onglet Accueil", "Onglet Insertion", "Onglet Révision", "Onglet Affichage"], correct: 0, order: 3 },
          { text: "Que fait l'icône représentant une disquette ?", options: ["Elle imprime le document", "Elle enregistre le document", "Elle ferme l'application", "Elle ouvre un nouveau document"], correct: 1, order: 4 },
          { text: "Comment sélectionner tout le texte du document rapidement ?", options: ["Ctrl + T", "Ctrl + A", "Clic droit > Sélectionner", "Triple-clic n'importe où"], correct: 1, order: 5 },
        ]
      },
      {
        label: 'Intermédiaire', order: 2, successThreshold: 80,
        questions: [
          { text: "A quoi servent les 'Styles' (Titre 1, Titre 2...) ?", options: ["A décorer la page avec des couleurs fixes", "A structurer le document de manière cohérente", "A changer le correcteur orthographique", "A traduire le texte"], correct: 1, order: 1 },
          { text: "Comment justifier un paragraphe ?", options: ["Aligner le texte à gauche", "Centrer le texte", "Aligner le texte des deux côtés (gauche/droite) uniformément", "Le mettre en gras et souligné"], correct: 2, order: 2 },
          { text: "Dans quel menu ajoute-t-on les numéros de page ?", options: ["Fichier", "Accueil", "Insertion", "Mise en page"], correct: 2, order: 3 },
          { text: "Quelle est l'utilité du 'pinceau reproduire la mise en forme' ?", options: ["Peindre avec la souris sur l'écran", "Copier le style graphique d'un texte et l'appliquer ailleurs", "Effacer toutes les couleurs", "Surligner le texte en jaune"], correct: 1, order: 4 },
          { text: "Qu'est-ce qu'un saut de page ?", options: ["Une animation lors du défilement", "Une façon de forcer le début de texte sur la page suivante", "Supprimer une page blanche", "Réduire les marges de la page"], correct: 1, order: 5 },
        ]
      },
      {
        label: 'Avancé', order: 3, successThreshold: 80,
        questions: [
          { text: "Comment générer un sommaire automatiquement ?", options: ["Réécrire les titres manuellement et ajouter des points", "Créer une Table des matières à l'aide des Styles de Titre appliqués", "Insérer un Index lexical", "Utiliser une Table des illustrations"], correct: 1, order: 1 },
          { text: "Qu'est-ce qu'un saut de section par rapport à un saut de page ?", options: ["Aucune différence", "Un saut de section permet de changer de mise en page (ex: paysage/portrait) au sein d'un document", "Un saut de section ferme le document", "Un saut de section sert uniquement pour l'impression"], correct: 1, order: 2 },
          { text: "À quoi sert la fonction 'Suivi des modifications' ?", options: ["A compter les mots tapés", "A tracer et visualiser les corrections ou ajouts faits par plusieurs auteurs", "A enregistrer automatiquement après chaque frappe", "A bloquer l'édition du texte"], correct: 1, order: 3 },
          { text: "Comment réaliser un publipostage (ou mailing) ?", options: ["Sélectionner Envoyer par e-mail dans Fichier", "Lier un document Word à une base de données (ex: fichier Excel) pour envoyer des courriers personnalisés", "Publier son document sur un blog public", "Copier-coller le texte dans Outlook 100 fois"], correct: 1, order: 4 },
          { text: "À quoi servent les 'Notes de bas de page' ?", options: ["A ajouter des numéros de page avec un style original", "A renvoyer à une explication ou source positionnée en bas de la même page", "A signer le document numérique", "A laisser des commentaires en marge visible aux collègues"], correct: 1, order: 5 },
        ]
      },
      {
        label: 'Expert', order: 4, successThreshold: 80,
        questions: [
          { text: "À quoi correspond la 'Création de Modèles (.dotx)' ?", options: ["A générer une matrice de document avec des styles/marges verrouillés et réutilisables en lecture seule apparente", "A transformer un Word en PowerPoint", "A dessiner des cadres de texte complexes", "A inclure des icônes de modèles aléatoires gratuits"], correct: 0, order: 1 },
          { text: "Comment lier des champs dynamiques et des signets internes de façon avancée ?", options: ["Avec l'onglet Publipostage basique", "Via Insertion > QuickParts > Champ (ex: REF, SEQ)", "Via copier-coller avec liaison OLE", "Toutes ces réponses pointent vers des usages de champs dynamiques expert de Word"], correct: 3, order: 2 },
          { text: "Une macro Word c'est :", options: ["Un gros titre automatique", "Une mini application VBA pour automatiser des actions de mise en page récurrentes ou répétitives", "Un raccourci clavier standard prédéfini", "L'accès administrateur restreint"], correct: 1, order: 3 },
          { text: "À quoi sert un plan d'indexation lexical (Insertion > Index) par rapport à une table des matières temporelle ?", options: ["L'index sert de glossaire avec références des pages par mot alors que la table des matières référence les titres des grands chapitres chronologiquement", "C'est strictement la même fonctionnalité à laquelle on donne deux noms différents", "L'index vérifie uniquement les polices latines", "L'index génère un résumé global IA"], correct: 0, order: 4 },
          { text: "Dans un publipostage avancé, peut-on inclure des règles du type 'Si... Alors... Sinon' ?", options: ["Non c'est uniquement disponible dans Excel en cellule", "Oui, via la gestion des règles dans l'onglet Publipostage (champs If...Then...Else conditionnels)", "Seulement avec du SQL externe", "Uniquement sur des formulaires web"], correct: 1, order: 5 },
        ]
      }
    ]
  },
  photoshop: {
    slugs: ['photoshop'],
    name: 'Photoshop',
    prerequisites: [
      { text: "Avez-vous déjà retravaillé, recadré ou modifié des photos numériques ?", options: ["Oui, de manière régulière", "Oui, occasionnellement", "Jamais"], correct: -1, order: 1 },
      { text: "Comprenez-vous la différence entre une image et un texte modifiable ?", options: ["Oui, tout à fait", "A peu près", "Non"], correct: -1, order: 2 },
    ],
    levels: [
      {
        label: 'Débutant', order: 1, successThreshold: 80,
        questions: [
          { text: "Quel est le format d'enregistrement de projet natif à Photoshop ?", options: [".jpg", ".png", ".psd", ".pdf"], correct: 2, order: 1 },
          { text: "Lequel de ces outils permet de sélectionner une partie rectangulaire de l'image ?", options: ["L'outil Rectangle de sélection", "L'outil Baguette magique", "L'outil Pinceau", "L'outil Crayon"], correct: 0, order: 2 },
          { text: "Que représente le panneau 'Calques' ?", options: ["Une bibliothèque de polices", "Les feuilles transparentes superposées composant l'image", "Les filtres d'effets visuels", "Un historique de modifications"], correct: 1, order: 3 },
          { text: "Comment annuler la dernière action effectuée par défaut (sur les versions récentes) ?", options: ["Ctrl + Z", "F1", "Ctrl + D", "Echap"], correct: 0, order: 4 },
          { text: "L'outil 'Loupe' (ou Zoom) sert à :", options: ["Augmenter définitivement la résolution de l'image", "Agrandi la zone de travail à l'écran pour mieux voir les détails sans modifier le fichier", "Nettoyer les yeux rouges", "Chercher des fichiers sur l'ordinateur"], correct: 1, order: 5 },
        ]
      },
      {
        label: 'Intermédiaire', order: 2, successThreshold: 80,
        questions: [
          { text: "Généralement, pour la sélection d'un ciel bleu uni, quel outil parmi ces choix est le plus rapide ?", options: ["Plume", "Lasso Libre", "Baguette magique / Sélection rapide", "Gomme"], correct: 2, order: 1 },
          { text: "À quoi sert un 'Masque de fusion' associé à un calque ?", options: ["A fusionner tous les calques du document en arrière-plan", "A masquer temporairement et de manière non-destructive des zones du calque en peignant en noir", "A appliquer un flou de mouvement global", "A réduire la résolution"], correct: 1, order: 2 },
          { text: "Combien de pixels par pouce (DPI/PPP) recommande-t-on le plus souvent pour une impression standard professionnelle ?", options: ["72", "150", "300", "720"], correct: 2, order: 3 },
          { text: "Quel outil est représenté par une icône de 'pansement' (ou tampon) ?", options: ["L'outil Correcteur localisé, utilisé pour gommer les imperfections/tâches", "Le tampon de motif", "L'outil Historique", "L'outil Dégradé"], correct: 0, order: 4 },
          { text: "Lequel de ces raccourcis permet de clore (valider) une 'Transformation manuelle' (Ctrl + T) ?", options: ["La touche Echap", "Touche Entrée (ou double clic dans la zone)", "Touche Suppr", "Ctrl + S"], correct: 1, order: 5 },
        ]
      },
      {
        label: 'Avancé', order: 3, successThreshold: 80,
        questions: [
          { text: "Qu'est-ce qu'un 'Objet dynamique' (Smart Object) dans un calque ?", options: ["Un calque vectoriel qui s'anime et forme un GIF autonome", "Un calque qui empaquette une image source, permettant de la redimensionner indéfiniment sans perte destructrice de la résolution initiale", "Un texte en 3D volumétrique", "Un objet qui change de couleur selon l'arrière-plan avec un style IA"], correct: 1, order: 1 },
          { text: "A quelle logique fonctionnelle répondent les 'Modes de fusion' (comme Produit ou Superposition) ?", options: ["Permettre la réplication d'images sur des supports réseau cloud distants multicalques", "Dicter mathématiquement la manière dont les pixels d'un calque vont se mélanger visuellement avec les calques et pixels situés en dessous", "Pré-séparer les couches CMJN avant tirage machine", "Créer des vecteurs paramétriques sans lissage de crénage"], correct: 1, order: 2 },
          { text: "L'outil Plume génère des courbes de...", options: ["Bézier", "Newton", "Planck", "Gauss"], correct: 0, order: 3 },
          { text: "Si un calque de 'Réglage (Levels/Courbes)' doit n'affecter QUE le calque directement en dessous de lui, que devons-nous utiliser ?", options: ["Verrouiller les pixels transparents du calque principal", "Créer un Masque d'écrêtage ('Clipping Mask') entre les deux calques (Alt+Clic entre les 2)", "Fusionner prématurément", "Effacer le réglage global via un filtre Gauss"], correct: 1, order: 4 },
          { text: "Quel espace colorimétrique utilise-t-on par défaut principalement pour un affichage web/écran standard ?", options: ["CMJN", "Pantone", "Niveaux de gris", "RVB / sRGB"], correct: 3, order: 5 },
        ]
      },
      {
        label: 'Expert', order: 4, successThreshold: 80,
        questions: [
          { text: "Le terme 'Séparations de couches' (Channels) fait appel à la maitrise de l'extraction par les couches R, V ou B en noir et blanc...", options: ["Pour concevoir des gifs interactifs flash plus légers par compression locale adaptative", "Oui, typiquement exploitée pour la sélection complexe des cheveux ou éléments translucides très fins hors des vecteurs tracés", "Pour réduire les vibrations d'écrans lors de la publication web", "Simplement pour désactiver les droits d'auteur en métadonnées EXIF d'origine"], correct: 1, order: 1 },
          { text: "Savoir utiliser les outils 'Densité +/ Densité -' de façon experte réfère au jargon anglais du...", options: ["Dodge and Burn, souvent peint localement via un calque gris neutre 50% en mode Incrustation ou Lumière tamisée pour modeler le volume sans affecter l'image native", "Healing Brush paramétrique IA basé sur des modèles GAN volumétriques externes", "Clipping paths texturés limités des objets vectoriels du cloud interne créatif", "Rien, c'est un vieil outil inutile remplacé par la commande teinte et saturation"], correct: 0, order: 2 },
          { text: "Comment exploiter au mieux Camera Raw Filter intégré à Photoshop sur un flux expert d'image composite ?", options: ["Il ne s'applique qu'au tout début sur l'importation de fichiers .CR2 ou .NEF bruts limités, il ne faut surtout pas essayer de l'utiliser après dans la composition", "En le combinant systématiquement à un filtre externe tiers, obligatoire de nos jours", "En l'appliquant en tant que Filtre dynamique sur un Objet Dynamique, pour des corrections colorimétriques non destructives modulables tout au long du processus", "Il sert uniquement à effacer les aberrations chromatiques via des Scripts d'actions externes"], correct: 2, order: 3 },
          { text: "En quoi les 'Compositions de calques' (Layer Comps) sont-elles différentes des simples Groupes ou Ensembles Photoshop ?", options: ["Elles enregistrent différents états de visibilité, position et style des calques, pour générer des variantes (ou 'Maquettes multiples') dans un seul et même document fichier .psd allégé", "Il n'y a pas de différence, Adobe a juste changé le nom des dossiers Groupe en 2018", "Elles limitent à 5 calques les objets dynamiques pour la gestion de la ram allégée locale 16bits", "Elles génèrent de la musique ambiante durant l'édition selon un modèle IA prédictif colorimétrique analytique de base"], correct: 0, order: 4 },
          { text: "Parmi ces assertions d'automatisation via Scripts, quelle est la limite notable par défaut ?", options: ["Seuls 5 Scripts peuvent être lus simultanément dans un même document .psd complexe", "Généralement, pour conditionner ou insérer de la 'logique IF / ELSE' stricte dans des scripts complexes, le simple enregistreur d'Actions ne suffit plus et l'on doit passer par ExtendScript (JavaScript) lié à Photoshop", "Les scripts sont totalement bloqués par la nouvelle IA de l'édition Génératrice 'Adobe Firefly' en local sur du Remplissage génératif classique de base", "Il faut obligatoirement du C++ pour créer soi-même des Droplets sur Windows depuis 2021"], correct: 1, order: 5 },
        ]
      }
    ]
  }
};

async function seed() {
  await client.connect();
  console.log('✅ Connected to PostgreSQL');

  for (const toolKey in toolsData) {
    const tool = toolsData[toolKey];
    console.log(`\n==========================================`);
    console.log(`Processing tool: ${tool.name}`);
    console.log(`==========================================`);

    // 1. Find the formations matching the slugs
    const placeholders = tool.slugs.map((_, i) => `$${i + 1}`).join(',');
    const query = `SELECT id, slug, label FROM formations WHERE slug IN (${placeholders})`;
    const formRes = await client.query(query, tool.slugs);
    
    if (formRes.rows.length === 0) {
      console.warn(`⚠️  No formations found for slugs: ${tool.slugs.join(', ')}`);
      continue;
    }

    // 2. Clear old data for these formations (positionnement & prerequis)
    for (const row of formRes.rows) {
      const formationId = row.id;
      console.log(`📚 Found formation: ${row.label} (ID: ${formationId})`);

      // Clean existing placement questions
      await client.query(`DELETE FROM questions WHERE type = 'positionnement' AND "levelId" IN (SELECT id FROM levels WHERE "formationId" = $1)`, [formationId]);
      
      // Clean existing levels
      await client.query(`DELETE FROM levels WHERE "formationId" = $1`, [formationId]);
      
      // Clean previous specific prerequisites if any (though currently they might be generic)
      await client.query(`DELETE FROM questions WHERE type = 'prerequis' AND "formationId" = $1`, [formationId]);

      // 3. Insert prerequisites specific to this formation
      for (const req of tool.prerequisites) {
        await client.query(
          `INSERT INTO questions (text, options, "correctResponseIndex", "order", "isActive", type, "formationId")
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [req.text, JSON.stringify(req.options), req.correct, req.order, true, 'prerequis', formationId]
        );
      }
      console.log(`   ➕ Inserted ${tool.prerequisites.length} prerequisites for ${row.label}`);

      // 4. Create levels and positioning questions
      for (const lvl of tool.levels) {
        // Insert Level
        const recLabel = `Niveau ${lvl.label} - Formation ${tool.name} recommandée`;
        const lvlRes = await client.query(
          `INSERT INTO levels (label, "order", "successThreshold", "recommendationLabel", "formationId")
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [lvl.label, lvl.order, lvl.successThreshold, recLabel, formationId]
        );
        const levelId = lvlRes.rows[0].id;
        console.log(`      📊 Level ${lvl.label} created (id=${levelId})`);

        // Insert Questions
        for (const q of lvl.questions) {
          await client.query(
            `INSERT INTO questions (text, options, "correctResponseIndex", "order", "isActive", type, "levelId", "formationId")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              q.text,
              JSON.stringify(q.options),
              q.correct,
              q.order,
              true,
              'positionnement',
              levelId,
              formationId,
            ]
          );
        }
        console.log(`         ➕ Inserted ${lvl.questions.length} questions for Level ${lvl.label}`);
      }
    }
  }

  console.log(`\n✅ Seeding of Bureautique tasks complete!`);
  await client.end();
}

seed().catch((err) => {
  console.error('❌ Error during seeding:', err.message);
  client.end();
  process.exit(1);
});
