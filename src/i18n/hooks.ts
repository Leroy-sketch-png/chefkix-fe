/**
 * Re-export next-intl hooks for convenience.
 *
 * Usage in client components:
 *   import { useTranslations } from '@/i18n/hooks'
 *   const t = useTranslations('explore')
 *   <h1>{t('title')}</h1>
 *
 * For server components:
 *   import { getTranslations } from 'next-intl/server'
 *   const t = await getTranslations('explore')
 */
export { useTranslations, useMessages, useLocale, useNow, useTimeZone, useFormatter } from 'next-intl'
