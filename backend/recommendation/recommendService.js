const { spawn } = require('child_process');
const path = require('path');

const runPythonScript = (scriptName, inputData) => {
  return new Promise((resolve, reject) => {
    // Locate the python executable inside backend/venv/ (Scripts/python.exe on Windows, bin/python on Linux/macOS)
    const isWindows = process.platform === 'win32';
    const pythonPath = isWindows
      ? path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe')
      : path.join(__dirname, '..', 'venv', 'bin', 'python');
    const scriptPath = path.join(__dirname, scriptName);

    const pyProcess = spawn(pythonPath, [scriptPath]);

    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script ${scriptName} exited with code ${code}. Error: ${stderrData}`);
        return reject(new Error(stderrData || `Exited with code ${code}`));
      }
      try {
        const parsed = JSON.parse(stdoutData.trim());
        resolve(parsed);
      } catch (err) {
        console.error(`Failed to parse JSON from Python output: ${stdoutData}`);
        reject(err);
      }
    });

    // Write input data to Python script stdin
    if (typeof inputData === 'string') {
      pyProcess.stdin.write(inputData);
    } else {
      pyProcess.stdin.write(JSON.stringify(inputData));
    }
    pyProcess.stdin.end();
  });
};

const getRecommendations = async (interests, events) => {
  try {
    // Map events to simple format to reduce IPC payload size
    const eventPayload = events.map(e => ({
      _id: e._id.toString(),
      name: e.name,
      description: e.description,
      category: e.category,
      tags: e.tags || []
    }));

    const eventIds = await runPythonScript('recommend.py', { interests, events: eventPayload });
    return eventIds;
  } catch (error) {
    console.error('AI Recommendations failed. Falling back to default order.', error.message);
    // Return event IDs in original DB order on error
    return events.map(e => e._id.toString());
  }
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
