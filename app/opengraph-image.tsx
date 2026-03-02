import { ImageResponse } from 'next/og'

export const size = {
	width: 1200,
	height: 630,
}

export const contentType = 'image/png'

export default function Image() {
	return new ImageResponse(
		(
			<div
				style={{
					height: '100%',
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					background: 'linear-gradient(135deg, #0f172a 0%, #1c1917 45%, #a16207 100%)',
					padding: 64,
					color: '#ffffff',
					fontFamily: 'sans-serif',
				}}
			>
				<div style={{ fontSize: 28, letterSpacing: 6, opacity: 0.85 }}>SOUTH ASIAN FASHION</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					<div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>
						Curated Luxury.
						<br />
						Culturally Rooted.
					</div>
					<div style={{ fontSize: 28, opacity: 0.9 }}>
						Collections • Featured Pieces • New Arrivals
					</div>
				</div>
			</div>
		),
		{
			...size,
		},
	)
}
