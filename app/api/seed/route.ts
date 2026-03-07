import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { products } from '@/db/schema'
import { seed } from '@/db/seed'

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		const db = getDb()
		const existingProducts = await db.select().from(products).limit(1)

		if (existingProducts.length === 0) {
			await seed()
			return NextResponse.json({ message: 'Seed executed successfully' })
		}

		return NextResponse.json({ message: 'Database already seeded, skipping.' })
	} catch (error: any) {
		console.error('[seed error]', error)
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
}
