import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import fs from 'fs'

function buildInfoPlugin() {
  return {
    name: 'build-info',
    writeBundle(options) {
      try {
        const outDir = options?.dir || 'dist'
        const run = cmd => execSync(cmd, { encoding: 'utf8', cwd: process.cwd() }).trim()
        const uncommitted = run('git status --porcelain')
        const logLines = run("git log -8 --format=%H@@%h@@%s@@%ci")
        const info = {
          hash:       run('git rev-parse HEAD'),
          shortHash:  run('git rev-parse --short HEAD'),
          branch:     run('git rev-parse --abbrev-ref HEAD'),
          message:    run('git log -1 --format=%s'),
          authorDate: run('git log -1 --format=%ci'),
          uncommitted: uncommitted || null,
          recentCommits: logLines ? logLines.split('\n').filter(Boolean).map(line => {
            const parts = line.split('@@')
            return { hash: parts[0], shortHash: parts[1], message: parts[2], date: parts[3] }
          }) : [],
          builtAt: new Date().toISOString(),
        }
        fs.writeFileSync(`${outDir}/build-info.json`, JSON.stringify(info, null, 2))
        console.log('✅ build-info.json généré')
      } catch (e) {
        console.warn('⚠️  build-info.json:', e.message)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), buildInfoPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/recharts") || id.includes("node_modules/victory")) return "recharts";
          // leaflet intentionnellement hors manualChunks — doit suivre le chunk lazy (PropertyMap/GuideExplorer) pour ne pas polluer l'entry critique
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) return "vendor";
        }
      }
    }
  }
})
