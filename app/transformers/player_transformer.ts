import type Player from '#models/player'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class PlayerTransformer extends BaseTransformer<Player> {
  toObject() {
    return this.pick(this.resource, ['steamId', 'displayName', 'avatarUrl'])
  }
}
