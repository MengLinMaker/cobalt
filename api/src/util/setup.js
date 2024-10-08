import { execSync } from 'node:child_process'
import { appendFileSync, existsSync, unlinkSync } from 'node:fs'
import { createInterface } from 'node:readline'

const envPath = './.env'
const q = `? \x1b[1m`
const ob = {}
const rl = createInterface({ input: process.stdin, output: process.stdout })

const final = () => {
  if (existsSync(envPath)) unlinkSync(envPath)

  for (const i in ob) {
    appendFileSync(envPath, `${i}=${ob[i]}\n`)
  }
  console.log('\nGenerated .env file.')
  console.log(`Run 'npm install' to install all dependencies.\n`)
  execSync('npm install', { stdio: [0, 1, 2] })
  console.log(`Run 'npm start' to start server`)
  rl.close()
}

function setup() {
  console.log('\nWhat kind of server will this instance be?\nOptions: api, web.')

  rl.question(q, (r1) => {
    switch (r1.toLowerCase()) {
      case 'api':
        console.log(
          "\nCool! What's the domain this API instance will be running on? (localhost)\nExample: api.cobalt.tools",
        )

        rl.question(q, (apiURL) => {
          ob.API_URL = `http://localhost:9000/`
          ob.API_PORT = 9000
          if (apiURL && apiURL !== 'localhost') ob.API_URL = `https://${apiURL.toLowerCase()}/`

          console.log('\nGreat! Now, what port will it be running on? (9000)')

          rl.question(q, (apiPort) => {
            if (apiPort) ob.API_PORT = apiPort
            if (apiPort && (apiURL === 'localhost' || !apiURL))
              ob.API_URL = `http://localhost:${apiPort}/`

            console.log(
              "\nWhat will your instance's name be? Usually it's something like eu-nl aka region-country. (local)",
            )

            rl.question(q, (apiName) => {
              ob.API_NAME = apiName.toLowerCase()
              if (!apiName || apiName === 'local') ob.API_NAME = 'local'

              console.log(
                "\nOne last thing: would you like to enable CORS? It allows other websites and extensions to use your instance's API.\ny/n (n)",
              )

              rl.question(q, (apiCors) => {
                const answCors = apiCors.toLowerCase().trim()
                if (answCors !== 'y' && answCors !== 'yes') ob.CORS_WILDCARD = '0'
                final()
              })
            })
          })
        })
        break
      case 'web':
        console.log(
          "\nAwesome! What's the domain this web app instance will be running on? (localhost)\nExample: cobalt.tools",
        )

        rl.question(q, (webURL) => {
          ob.WEB_URL = `http://localhost:9001/`
          ob.WEB_PORT = 9001
          if (webURL && webURL !== 'localhost') ob.WEB_URL = `https://${webURL.toLowerCase()}/`

          console.log('\nGreat! Now, what port will it be running on? (9001)')
          rl.question(q, (webPort) => {
            if (webPort) ob.WEB_PORT = webPort
            if (webPort && (webURL === 'localhost' || !webURL))
              ob.WEB_URL = `http://localhost:${webPort}/`

            console.log(
              '\nOne last thing: what default API domain should be used? (api.cobalt.tools)',
            )
            console.log("\nIf it's hosted locally, make sure to include the port: localhost:9000")

            rl.question(q, (apiURL) => {
              ob.API_URL = `https://${apiURL.toLowerCase()}/`
              if (apiURL.includes(':')) ob.API_URL = `http://${apiURL.toLowerCase()}/`
              if (!apiURL) ob.API_URL = 'https://api.cobalt.tools/'
              final()
            })
          })
        })
        break
      default:
        console.log('\nThis is not an option. Try again.')
        setup()
    }
  })
}
setup()
