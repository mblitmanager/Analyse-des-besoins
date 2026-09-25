const { Client } = require('pg');
const fs = require('fs');

async function exportContacts() {
    const client = new Client({
        connectionString: 'postgresql://postgres:root@localhost:5432/wizzylearn4'
    });

    try {
        await client.connect();
        
        // On va vérifier si c'est les conseillers uniques ou tous les contacts
        const res = await client.query('SELECT * FROM contacts');
        
        const contacts = res.rows;
        if (contacts.length === 0) {
            console.log('Aucun contact trouvé.');
            return;
        }

        const csvRows = [];
        // Extract headers
        const headers = Object.keys(contacts[0]);
        csvRows.push(headers.join(';')); // Header row

        // Add rows
        for (const row of contacts) {
            const values = headers.map(header => {
                const val = row[header] === null ? '' : row[header];
                const escaped = ('' + val).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(';'));
        }

        const fileContent = csvRows.join('\n');
        const fileName = 'contacts_export.csv';
        fs.writeFileSync(fileName, fileContent, 'utf-8');
        
        console.log(`Exportation terminée avec succès ! ${contacts.length} lignes dans ${fileName}`);

        const distinctRes = await client.query('SELECT DISTINCT conseiller FROM contacts WHERE conseiller IS NOT NULL');
        const conseillers = distinctRes.rows.map(r => r.conseiller);
        fs.writeFileSync('conseillers_export.csv', conseillers.join('\n'), 'utf-8');
        console.log(`Exportation des conseillers terminée ! ${conseillers.length} conseillers uniques.`);

    } catch (err) {
        console.error('Erreur:', err);
    } finally {
        await client.end();
    }
}

exportContacts();
