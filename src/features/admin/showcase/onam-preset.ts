import type { ShowcaseCategoryInput } from '@/server/admin/showcase.functions'

export const ONAM_OCCASION = 'Onam'

export const ONAM_TREND_BRIEF = `Kerala Onam festive wear trends:
- Kasavu sarees: classic ivory/off-white handloom cotton and cotton-silk with gold zari borders remain the anchor (Balaramapuram handloom revival). Trending variations: colored zari borders (emerald, maroon, pastel pink), full tissue-kasavu shimmer sarees for evening events.
- Blouse pairings: contrast raw-silk blouses in emerald green, maroon, mustard; maggam thread-work and puff/elbow sleeves are in demand.
- Half-saree fusion for young women: kasavu skirt with contrast blouse and dupatta.
- Menswear: double mundu with kasavu kara (border), kasavu-detailed kurtas, and crisp shirt + mundu sets in white or pastel solids.
- Teens: modern kasavu kurtis styled with palazzos, indo-western dhoti sets.
- Kids girls: traditional pattu pavada (silk skirt) in red, green, and gold; kasavu skirt-and-blouse sets.
- Kids boys: mini kasavu mundu with festive short kurtas.
- Styling and lifestyle cues: pookalam floral rangoli, banana-leaf sadhya, brass nilavilakku lamps, jasmine flowers (mulla poo) in hair, Kerala wooden-pillar verandahs, golden-hour light.`

export const ONAM_CATEGORY_PRESET: ShowcaseCategoryInput[] = [
	{
		name: 'Women',
		spec: 'Kasavu sarees (ivory handloom with gold zari), tissue-kasavu sarees, half-saree fusion sets with contrast blouses',
		count: 2,
		personaHint:
			'26-30 year old South Asian Keralite woman, warm medium skin tone, low bun with jasmine flowers',
		priceBand: '60-90 CAD',
	},
	{
		name: 'Men',
		spec: 'Double mundu with kasavu border, kasavu kurtas, shirt-and-mundu sets in white or pastel solids',
		count: 2,
		personaHint: '28-34 year old South Asian Keralite man, tan skin tone, short trimmed beard',
		priceBand: '45-80 CAD',
	},
	{
		name: 'Teens',
		spec: 'Modern kasavu kurtis with palazzos, indo-western dhoti sets with festive tops',
		count: 2,
		personaHint: '15-17 year old South Asian Keralite teenager, fresh natural look',
		priceBand: '40-75 CAD',
	},
	{
		name: 'Kids Girls',
		spec: 'Pattu pavada (traditional silk skirt) in red/green/gold, kasavu skirt and blouse sets',
		count: 2,
		personaHint:
			'6-9 year old South Asian Keralite girl, cheerful natural smile, simple braided hair',
		priceBand: '35-60 CAD',
	},
	{
		name: 'Kids Boys',
		spec: 'Mini kasavu mundu with festive short kurta sets',
		count: 2,
		personaHint: '5-9 year old South Asian Keralite boy, neat short hair, playful confident stance',
		priceBand: '30-55 CAD',
	},
]

export function matchPersonaModelId<T extends { id: string; gender: string | null }>(
	models: T[],
	personaHint: string,
) {
	const hint = personaHint.toLowerCase()
	const wantsFemale = hint.includes('woman') || hint.includes('girl')
	const wantsMale = hint.includes('man') || hint.includes('boy')

	const match = models.find((model) => {
		const gender = (model.gender || '').toLowerCase()
		if (wantsFemale) return gender.startsWith('f')
		if (wantsMale) return gender.startsWith('m') && !gender.startsWith('f')
		return false
	})

	return match?.id || ''
}
