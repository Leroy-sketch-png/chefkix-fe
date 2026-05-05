import React, { useState } from 'react'
import Image, { ImageProps } from 'next/image'

interface AvatarImageProps extends ImageProps {
	fallbackSrc?: string
}

export default function AvatarImage({
	src,
	fallbackSrc = '/placeholder-avatar.svg',
	alt,
	...props
}: AvatarImageProps) {
	const [imgSrc, setImgSrc] = useState(src)

	return (
		<Image
			{...props}
			src={imgSrc}
			alt={alt || 'Avatar'}
			onError={() => {
				setImgSrc(fallbackSrc)
			}}
		/>
	)
}
