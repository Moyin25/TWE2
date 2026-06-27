import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { withAuth } from '@/lib/middleware/auth'
import { UserRole, ContactStatus } from '@prisma/client'

// Disable static generation for this route since it uses authentication headers
export const dynamic = 'force-dynamic';

async function getContactsHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') as ContactStatus | null
    const q = searchParams.get('q') || ''

    const where: any = {}
    if (status) where.status = status
    if (q) where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { subject: { contains: q, mode: 'insensitive' } },
    ]

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ])

    return NextResponse.json({
      contacts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch contacts' }, { status: 500 })
  }
}

export const GET = withAuth(getContactsHandler, [UserRole.ADMIN])