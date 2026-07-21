import fs from 'fs';
import { Packer } from 'roadroller';
import zlib from 'zlib';

// --- CHARGEMENT SÉCURISÉ DU DICTIONNAIRE EN MODE ESM ---
let words;
try {
    const fileContent = fs.readFileSync('./words.js', 'utf8');
    words = new Function(fileContent + '; return words;')();
} catch (e) {
    console.error("❌ Erreur : Impossible de lire ou d'analyser 'words.js'. Vérifie qu'il est dans le même dossier.");
    process.exit(1);
}

if (!words || !Array.isArray(words)) {
    console.error("❌ Erreur : Le fichier 'words.js' ne contient pas un tableau valide nommé 'words'.");
    process.exit(1);
}

const BLOCKS_ORDER = "abcdefghijklmnopqrstuvwxyz";
let bestSize = Infinity;
let globalTrie = {};
let currentOrders = {};
let allPrefixesList = [];

// --- FONCTION DE COMPRESSION PROGRAMMATIQUE MAXIMALE ---
async function getRealPipelineSize(text) {
    const inputs = [
        {
            data: text,
            type: 'text',
            action: 'write' 
        }
    ];

    // Configuration poussée : 99 contextes et 999 MB de mémoire max
    const options = {
        numContexts: 99,
        maxMemory: 999
    };

    const packer = new Packer(inputs, options);

    // optimize(0) permet de zapper l'analyse lourde des modèles par défaut de Roadroller
    // à chaque étape, laissant ainsi le "shuffle" de ton arbre tester un maximum de combinaisons.
    await packer.optimize(0);
    
    // Génération du décodeur via l'API officielle
    const { firstLine, secondLine } = packer.makeDecoder();
    const packedJS = firstLine + secondLine; 

    // Évaluation macroscopique via Gzip Niveau 9 native (Zopfli-like pour ton build final)
    const gzippedBuffer = zlib.gzipSync(Buffer.from(packedJS), {
        level: 9
    });

    return gzippedBuffer.byteLength;
}

// --- CONSTRUCTION DE L'ARBRE (ALPHABET NATUREL) ---
function buildBaseTrie() {
    globalTrie = {};
    currentOrders = {};
    allPrefixesList = [];

    const wordSet = new Set(words);
    let used = new Set();
    let cleanedList = [];

    words.forEach(w => {
        if (used.has(w)) return;
        let marker = "";
        if (wordSet.has(w + 's')) { marker = "9"; used.add(w + 's'); }
        cleanedList.push(w + marker);
    });

    cleanedList.forEach(w => {
        let current = globalTrie;
        for (let i = 0; i < w.length; i++) {
            let char = w[i];
            if (char === '9') { current['$has9'] = true; break; }
            if (!current[char]) current[char] = {};
            current = current[char];
        }
        current['$end'] = true;
    });

    function registerOrders(node, prefix) {
        let children = Object.keys(node).filter(k => k !== '$end' && k !== '$has9').sort();
        if (children.length > 0) {
            currentOrders[prefix] = children;
            allPrefixesList.push(prefix);
            children.forEach(c => registerOrders(node[c], prefix + c));
        }
    }

    currentOrders[""] = [...BLOCKS_ORDER];
    BLOCKS_ORDER.split('').forEach(char => {
        if (globalTrie[char]) registerOrders(globalTrie[char], char);
    });
}

// --- TRANSFORMATION DE L'ARBRE EN CHAÎNE COULÉE ---
function flattenTrieToPipelineString() {
    let res = "";
    let prev = "";
    const getCP = (a, b) => { let i=0; while(i<a.length && i<b.length && a[i]===b[i]) i++; return i; };

    function traverse(node, currentPrefix) {
        if (node['$end']) {
            let w = currentPrefix;
            if (node['$has9']) w += '9';
            let n = getCP(prev, w);
            res += n + w.slice(n);
            prev = w;
        }
        let order = currentOrders[currentPrefix] || [];
        order.forEach(char => { if (node[char]) traverse(node[char], currentPrefix + char); });
    }

    currentOrders[""].forEach(char => { if (globalTrie[char]) traverse(globalTrie[char], char); });
    return res;
}

// --- BOUCLE D'OPTIMISATION GÉNÉTIQUE ---
async function main() {
    console.log("\x1b[36m=== 🚀 Pipeline d'Optimisation Roadroller (99 Contextes / 999MB) + Gzip-9 ===\x1b[0m");
    buildBaseTrie();

    console.log("Calcul du poids de référence initial (l'analyse à 99 contextes prendra un peu plus de temps)...");
    let currentStr = flattenTrieToPipelineString();
    
    try {
        bestSize = await getRealPipelineSize(currentStr);
        console.log(`Taille initiale mesurée : \x1b[33m${bestSize} octets\x1b[0m\n`);
    } catch (err) {
        console.error("❌ Échec lors de la compression initiale :", err.message);
        process.exit(1);
    }

    let cycle = 0;

    while (true) {
        cycle++;

        let randomPrefix = allPrefixesList[Math.floor(Math.random() * allPrefixesList.length)];
        if (!randomPrefix) continue;

        let branch = currentOrders[randomPrefix];
        if (!branch || branch.length <= 1) continue;

        let originalBranchState = [...branch];

        let i = Math.floor(Math.random() * branch.length);
        let j = Math.floor(Math.random() * branch.length);
        if (i !== j) [branch[i], branch[j]] = [branch[j], branch[i]];

        let testStr = flattenTrieToPipelineString();
        
        try {
            let testSize = await getRealPipelineSize(testStr);

            if (testSize < bestSize) {
                bestSize = testSize;
                console.log(`✨ [Cycle ${cycle}] Réduction ! Nouveau fichier .gz : \x1b[32m${bestSize} octets\x1b[0m (Branche: [${randomPrefix}])`);
                fs.writeFileSync('./best_encoded_flux.txt', testStr, 'utf8');
            } else {
                currentOrders[randomPrefix] = originalBranchState;
            }
        } catch (err) {
            currentOrders[randomPrefix] = originalBranchState;
        }

        if (cycle % 100 === 0) {
            console.log(`... ${cycle} shuffles testés. Record actuel : ${bestSize}b`);
        }
    }
}

main();