const { spawn } = require('child_process');
const path = require('path');

// ─── English stop words (mirrors sklearn's built-in list) ────────────────────
const STOP_WORDS = new Set([
  'a','about','above','after','again','against','all','am','an','and','any',
  'are','as','at','be','because','been','before','being','below','between',
  'both','but','by','can','did','do','does','doing','don','down','during',
  'each','few','for','from','further','get','got','had','has','have','having',
  'he','her','here','hers','herself','him','himself','his','how','i','if',
  'in','into','is','it','its','itself','just','me','more','most','my',
  'myself','no','nor','not','now','of','off','on','once','only','or','other',
  'our','ours','ourselves','out','over','own','s','same','she','should','so',
  'some','such','t','than','that','the','their','theirs','them','themselves',
  'then','there','these','they','this','those','through','to','too','under',
  'until','up','very','was','we','were','what','when','where','which','while',
  'who','whom','why','will','with','would','you','your','yours','yourself'
]);

// ─── Tokenizer ───────────────────────────────────────────────────────────────
const tokenize = (text) => {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
};

// ─── TF-IDF Vectorizer ───────────────────────────────────────────────────────
const buildTFIDF = (corpus) => {
  const tokenizedDocs = corpus.map(tokenize);

  // Build vocabulary from all documents
  const vocab = new Set();
  tokenizedDocs.forEach(tokens => tokens.forEach(t => vocab.add(t)));
  const terms = [...vocab];

  const N = corpus.length;

  // IDF: sklearn-style smooth (log((N+1)/(df+1)) + 1)
  const idf = {};
  terms.forEach(t => {
    const df = tokenizedDocs.filter(tokens => tokens.includes(t)).length;
    idf[t] = Math.log((N + 1) / (df + 1)) + 1;
  });

  // TF-IDF matrix — one sparse vector per document
  const tfidfMatrix = tokenizedDocs.map(tokens => {
    const len = tokens.length || 1;
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1 / len; });
    const vec = {};
    terms.forEach(t => { vec[t] = (tf[t] || 0) * idf[t]; });
    return vec;
  });

  return { tfidfMatrix, idf, terms };
};

// Transform a new text into a TF-IDF vector using pre-fitted IDF
const transformText = (text, idf, terms) => {
  const tokens = tokenize(text);
  const len = tokens.length || 1;
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1 / len; });
  const vec = {};
  terms.forEach(t => { vec[t] = (tf[t] || 0) * (idf[t] || 0); });
  return vec;
};

// Cosine similarity between two sparse vectors
const cosine = (a, b, terms) => {
  let dot = 0, normA = 0, normB = 0;
  terms.forEach(t => {
    const va = a[t] || 0;
    const vb = b[t] || 0;
    dot   += va * vb;
    normA += va * va;
    normB += vb * vb;
  });
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// ─── Main Recommendation Engine (pure JS, no Python needed) ─────────────────
const getRecommendations = (interests, events) => {
  try {
    if (!events || events.length === 0) return [];
    if (!interests || interests.length === 0) return [];

    // Build corpus: weight name & category more by repeating them
    const corpus = events.map(e => {
      const name = e.name || '';
      const desc = e.description || '';
      const cat  = e.category || '';
      const tags = (e.tags || []).join(' ');
      return `${name} ${name} ${desc} ${cat} ${cat} ${tags}`;
    });

    // Fit TF-IDF on corpus
    const { tfidfMatrix, idf, terms } = buildTFIDF(corpus);

    // Transform user interests into the same vector space
    const userText   = interests.join(' ');
    const userVector = transformText(userText, idf, terms);

    // Compute cosine similarity for every event
    const scored = events.map((e, i) => ({
      id:  e._id.toString(),
      sim: cosine(userVector, tfidfMatrix[i], terms),
      i
    }));

    // Keep only events that actually match (sim > 0)
    // Sort: newest first (lower index = newer, since DB sorts by createdAt desc)
    // Use similarity as tiebreaker when dates are the same
    return scored
      .filter(({ sim }) => sim > 0)
      .sort((a, b) => a.i - b.i || b.sim - a.sim)
      .map(({ id }) => id);

  } catch (error) {
    console.error('JS Recommendation engine error:', error.message);
    return [];
  }
};

// ─── Tag generation still uses the Python script ─────────────────────────────
const runPythonScript = (scriptName, inputData) => {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const pythonPath = isWindows
      ? path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe')
      : 'python3';
    const scriptPath = path.join(__dirname, scriptName);

    const pyProcess = spawn(pythonPath, [scriptPath]);
    let stdoutData = '';
    let stderrData = '';

    pyProcess.on('error', (err) => {
      console.error(`Failed to spawn Python process (${pythonPath}):`, err.message);
      reject(err);
    });
    pyProcess.stdout.on('data', (data) => { stdoutData += data.toString(); });
    pyProcess.stderr.on('data', (data) => { stderrData += data.toString(); });
    pyProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script ${scriptName} exited with code ${code}. Error: ${stderrData}`);
        return reject(new Error(stderrData || `Exited with code ${code}`));
      }
      try {
        resolve(JSON.parse(stdoutData.trim()));
      } catch (err) {
        console.error(`Failed to parse JSON from Python output: ${stdoutData}`);
        reject(err);
      }
    });

    if (pyProcess.stdin) {
      pyProcess.stdin.on('error', (err) => {
        console.error('Python stdin error:', err.message);
      });
      pyProcess.stdin.write(
        typeof inputData === 'string' ? inputData : JSON.stringify(inputData)
      );
      pyProcess.stdin.end();
    }
  });
};

const generateTags = async (description) => {
  try {
    const tags = await runPythonScript('generate_tags.py', description);
    return tags;
  } catch (error) {
    console.error('AI Tag Generation failed. Returning empty tags.', error.message);
    return [];
  }
};

module.exports = { getRecommendations, generateTags };
