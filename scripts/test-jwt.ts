import * as dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || '691033f8e7ea42af9d13a9fcf40551a5831b91b4e3f7eaea561f72a9d989f5441c1c5c751a6059fc2c7b3ce6e04e4699b42343835a473c80e15752def1c4173c'

console.log('JWT_SECRET from env:', process.env.JWT_SECRET?.slice(0, 20) + '...')
console.log('JWT_SECRET constant:', JWT_SECRET?.slice(0, 20) + '...')

// Test token generation and verification
const testPayload = {
  userId: 'test-user-id',
  email: 'test@example.com',
  role: 'ADMIN'
}

console.log('\n--- Testing token generation ---')
const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '15m' })
console.log('Generated token (first 20 chars):', token.slice(0, 20) + '...')

console.log('\n--- Testing token verification ---')
try {
  const verified = jwt.verify(token, JWT_SECRET)
  console.log('Verified payload:', verified)
} catch (error) {
  console.error('Verification error:', error)
}

// Test with wrong secret
console.log('\n--- Testing token verification with wrong secret ---')
try {
  const verified = jwt.verify(token, 'wrong-secret')
  console.log('Verified payload with wrong secret:', verified)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error('Verification error with wrong secret:', message)
}
