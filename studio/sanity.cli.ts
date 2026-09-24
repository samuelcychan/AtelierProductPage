import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // Hosted Studio address: https://kimie.sanity.studio (both workspaces are
  // served there — /production for the real catalogue, /staging for tests).
  studioHost: 'kimie',
  // Returned by the first `sanity deploy`; without it every deploy prompts
  // for the application id, which fails in a non-interactive shell.
  deployment: {
    appId: 'jz0k9dvc4nxjnh4qy19jt68y',
  },
})
