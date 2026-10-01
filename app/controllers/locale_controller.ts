import type { HttpContext } from '@adonisjs/core/http'
import { isLocale, LOCALE_COOKIE } from '#core/locale'

export default class LocaleController {
  async update({ request, response }: HttpContext) {
    const locale = request.input('locale')
    if (isLocale(locale)) {
      response.cookie(LOCALE_COOKIE, locale, {
        maxAge: '1y',
        httpOnly: true,
        sameSite: 'lax',
      })
    }
    return response.redirect().back()
  }
}
