// build.parallel.js
const { glob } = require('glob');
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

async function buildInParallel() {
    try {
        // Get all TypeScript files
        const files = await glob('src/**/*.ts');
        
        // Get number of CPU cores
        const numCPUs = os.cpus().length;
        
        // Split files into chunks based on CPU cores
        const chunkSize = Math.ceil(files.length / numCPUs);
        const chunks = [];
        
        for (let i = 0; i < files.length; i += chunkSize) {
            chunks.push(files.slice(i, i + chunkSize));
        }

        console.log(`Building with ${chunks.length} parallel processes...`);

        // Create a build process for each chunk
        const processes = chunks.map((chunk, index) => {
            return new Promise((resolve, reject) => {
                // Use path.resolve for the swc executable
                const swcPath = path.resolve('./node_modules/.bin/swc');
                
                const swc = spawn(
                    process.platform === 'win32' ? swcPath + '.cmd' : swcPath,
                    [
                        ...chunk,
                        '-d',
                        'dist',
                        '--config-file',
                        '.swcrc'
                    ],
                    {
                        stdio: 'inherit',
                        shell: true
                    }
                );

                swc.on('error', (error) => {
                    console.error(`Process ${index + 1} error:`, error);
                    reject(error);
                });

                swc.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`Process ${index + 1} exited with code ${code}`));
                    }
                });
            });
        });

        // Wait for all processes to complete
        await Promise.all(processes);
        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

buildInParallel();