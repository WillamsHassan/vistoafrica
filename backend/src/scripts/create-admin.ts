import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import { resolve } from 'node:path'

dotenv.config({ path: resolve(__dirname, '../../.env') })

const ask = async (prompt: string, hidden = false): Promise<string> => {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Ce script doit être exécuté dans un terminal interactif.')
  }

  process.stdout.write(prompt)
  process.stdin.setEncoding('utf8')
  process.stdin.setRawMode(true)
  process.stdin.resume()

  return new Promise((resolvePrompt, rejectPrompt) => {
    let answer = ''

    const restoreTerminal = () => {
      process.stdin.removeListener('data', onData)
      process.stdin.setRawMode(false)
      process.stdout.write('\n')
    }

    const onData = (chunk: string | Buffer) => {
      for (const character of chunk.toString()) {
        if (character === '\u0003') {
          restoreTerminal()
          rejectPrompt(new Error('Saisie annulée.'))
          return
        }
        if (character === '\r' || character === '\n') {
          restoreTerminal()
          resolvePrompt(answer)
          return
        }
        if (character === '\u007f' || character === '\b') {
          if (answer.length > 0) {
            answer = Array.from(answer).slice(0, -1).join('')
            process.stdout.write('\b \b')
          }
          continue
        }
        if (character >= ' ') {
          answer += character
          process.stdout.write(hidden ? '*' : character)
        }
      }
    }

    process.stdin.on('data', onData)
  })
}

const main = async () => {
  if (!process.env.MONGODB_URI?.trim()) {
    throw new Error('MONGODB_URI est absente. Configurez-la dans l’environnement ou dans backend/.env.')
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12)
  if (!Number.isInteger(rounds) || rounds < 4 || rounds > 31) {
    throw new Error('BCRYPT_ROUNDS doit être un entier entre 4 et 31.')
  }

  const email = (await ask('Email du nouvel administrateur : ')).trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Adresse email invalide.')
  }

  const fullName = (await ask('Nom complet : ')).trim()
  if (!fullName) throw new Error('Le nom complet est obligatoire.')

  const password = await ask('Mot de passe : ', true)
  const passwordConfirmation = await ask('Confirmez le mot de passe : ', true)
  if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.')
  if (password !== passwordConfirmation) throw new Error('Les mots de passe ne correspondent pas.')

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient({ log: [] })

  try {
    await prisma.$connect()
    const existingAdmin = await prisma.admin.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    })

    if (existingAdmin) {
      console.error('Un administrateur avec cet identifiant existe déjà.')
      process.exitCode = 1
      return
    }

    const passwordHash = await bcrypt.hash(password, rounds)
    await prisma.admin.create({
      data: {
        fullName,
        email,
        passwordHash,
      },
    })

    console.log('Administrateur créé avec succès.')
    console.log(email)
  } finally {
    await prisma.$disconnect().catch(() => undefined)
  }
}

void main().catch((error: unknown) => {
  const safeMessages = new Set([
    'Ce script doit être exécuté dans un terminal interactif.',
    'Saisie annulée.',
    'MONGODB_URI est absente. Configurez-la dans l’environnement ou dans backend/.env.',
    'BCRYPT_ROUNDS doit être un entier entre 4 et 31.',
    'Adresse email invalide.',
    'Le nom complet est obligatoire.',
    'Le mot de passe doit contenir au moins 8 caractères.',
    'Les mots de passe ne correspondent pas.',
  ])
  const message = error instanceof Error && safeMessages.has(error.message)
    ? error.message
    : 'Échec de la connexion ou de la création. Vérifiez la configuration MongoDB sans afficher ses secrets.'
  console.error(message)
  process.exitCode = 1
})