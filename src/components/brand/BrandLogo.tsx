import { Box } from '@mui/material'
import headerSvg from '../../assets/brand/bright-vision-horiz-bold-tx-white.svg?raw'
import railSvg from '../../assets/brand/bright_vision_bold_logo-tx.svg?raw'
import {
  BRAND_HEADER_LOGO_PNG,
  BRAND_LOGO_MODE,
  BRAND_RAIL_LOGO_PNG,
  DISPLAY_VISION,
} from '../../brand'

type BrandLogoVariant = 'header' | 'rail'

interface BrandLogoProps {
  variant: BrandLogoVariant
}

/**
 * Vector header wordmark uses live SVG text (Inter-Black / Inter-Thin) loaded via
 * `global.scss`. Rail variant is icon-only paths. PNG mode uses raster exports.
 */
export function BrandLogo({ variant }: BrandLogoProps) {
  const isHeader = variant === 'header'
  const className = isHeader ? 'vision-brand-logo vision-brand-logo--header' : 'vision-brand-logo vision-brand-logo--rail'
  const png = isHeader ? BRAND_HEADER_LOGO_PNG : BRAND_RAIL_LOGO_PNG
  const svg = isHeader ? headerSvg : railSvg

  if (BRAND_LOGO_MODE === 'png') {
    return (
      <Box
        component="img"
        src={png}
        alt={DISPLAY_VISION}
        className={className}
        sx={
          isHeader
            ? {
                height: 28,
                width: 'auto',
                maxWidth: 320,
                objectFit: 'contain',
                objectPosition: 'left',
              }
            : {
                width: '100%',
                maxWidth: 80,
                height: 'auto',
                minHeight: 44,
                objectFit: 'contain',
                alignSelf: 'center',
                mb: 1,
              }
        }
      />
    )
  }

  return (
    <Box
      className={className}
      role="img"
      aria-label={DISPLAY_VISION}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
