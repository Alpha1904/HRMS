const fs = require('fs');

// --- 1. Configuration et Structure ---
const outputFilename = 'Template.csv';

// Définition des colonnes (Identique à votre Template.csv)
const columns = [
    "First Name", "Last Name", "Email", "Country Code", "Mobile phone", "Birthday", 
    "Gender", "Title", "Employment Start Date", "Team", "Department", "Role", 
    "Branch", "Direct manager", "Employee ID", "Responsibility", "Employment Type", "Archive"
];

// --- 2. Données de référence ---
const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth",
                    "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
                   "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const teams = ["Alpha", "Beta", "Gamma", "Delta"];
const departments = ["HR", "IT", "Sales", "Marketing", "Finance"];
const roles = ["Associate", "Manager", "Director", "Analyst", "Developer"];
const branches = ["New York", "London", "Paris", "Tokyo", "Douala"];
const employmentTypes = ["Full-time", "Part-time", "Contract"];

// --- 3. Fonctions Utilitaires ---

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
    return array[randomInt(0, array.length - 1)];
}

function randomDate(startYear, endYear) {
    const start = new Date(startYear, 0, 1).getTime();
    const end = new Date(endYear, 11, 31).getTime();
    return new Date(start + Math.random() * (end - start));
}

function randomPhone() {
    let phone = '';
    for (let i = 0; i < 9; i++) phone += randomInt(0, 9);
    return phone;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- 4. Génération des Données ---

function generateData(count) {
    const data = [];
    
    for (let i = 0; i < count; i++) {
        const fName = randomChoice(firstNames);
        const lName = randomChoice(lastNames);
        const birthday = randomDate(1980, 2000);
        const startDate = randomDate(2015, 2023);

        const row = {
            "First Name": fName,
            "Last Name": lName,
            "Email": `${fName.toLowerCase()}.${lName.toLowerCase()}@example.com`,
            "Country Code": Math.random() > 0.5 ? "+237" : "+1",
            "Mobile phone": randomPhone(),
            "Birthday": formatDate(birthday),
            "Gender": randomChoice(["Male", "Female"]),
            "Title": randomChoice(["Mr", "Ms", "Mrs"]),
            "Employment Start Date": formatDate(startDate),
            "Team": randomChoice(teams),
            "Department": randomChoice(departments),
            "Role": randomChoice(roles),
            "Branch": randomChoice(branches),
            "Direct manager": `${randomChoice(firstNames)} ${randomChoice(lastNames)}`,
            "Employee ID": 1000 + i,
            "Responsibility": "General Duties",
            "Employment Type": randomChoice(employmentTypes),
            "Archive": "No"
        };
        
        // Mapping pour garantir l'ordre des colonnes
        data.push(columns.map(col => row[col] || ""));
    }
    return data;
}

// --- 5. Conversion CSV et Sauvegarde ---

function convertToCSV(data, headers) {
    const headerRow = headers.join(',');
    const dataRows = data.map(row => 
        row.map(cell => {
            const val = String(cell);
            // Échappement des virgules si nécessaire
            return val.includes(',') ? `"${val}"` : val;
        }).join(',')
    );
    return [headerRow, ...dataRows].join('\n');
}

// Exécution
try {
    const generatedData = generateData(20);
    const csvContent = convertToCSV(generatedData, columns);
    
    fs.writeFileSync(outputFilename, csvContent, 'utf8');
    console.log(`✅ Succès : Le fichier "${outputFilename}" a été mis à jour avec 20 nouvelles entrées.`);
} catch (error) {
    console.error("❌ Erreur lors de la sauvegarde :", error);
}