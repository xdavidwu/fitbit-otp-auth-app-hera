import document from "document"
import { formatTotp, getDisplayName } from "../../common/formatTokens"
import type { TotpConfig } from "../../common/TotpConfig"
import { TokenManager } from "../TokenManager"
import {
  CLOCK_SYNCHRONIZATION_MESSAGE_ID,
  DISPLAY_NAME_TEXT_ID,
  PROGRESS_ID,
  TOKEN_LIST_ID,
  TOTP_TEXT_ID
} from "./ids"

export interface TokenListTileInfo {
  type: typeof TOKEN_LIST_TILE_TYPE
  value: { token: TotpConfig; index: number }
}

export const TOKEN_LIST_TILE_TYPE = "token-list-item-pool"
/** How many invisible list tiles are updated in either direction to improve scrolling responsiveness */
export const INVISIBLE_UPDATE_MARGIN = 3
/** References to the tiles of the virtual list. This is a workaround because `tokenList.redraw`, `tokenList.updateTile` and invoking `show({ redraw: true})` on the individual tiles seemed to have no effect. */
const tiles: Array<VirtualTileListItem> = []

let isShowingClockSynchronizationMessage: boolean

export function setupTokenList(tokenManager: TokenManager) {
  const tokenList = document.getElementById(
    TOKEN_LIST_ID
  ) as VirtualTileList<TokenListTileInfo>

  tiles.length = 0

  tokenList.delegate = {
    getTileInfo: (index: number): TokenListTileInfo => {
      return {
        type: TOKEN_LIST_TILE_TYPE,
        value: { token: tokenManager.getTokens()[index], index }
      }
    },
    configureTile: (tile, info: TokenListTileInfo) => {
      if (info.type === TOKEN_LIST_TILE_TYPE) {
        tiles[info.value.index] = tile
        const token = info.value.token

        if (token) {
          tile.getElementById(TOTP_TEXT_ID).text = formatTotp(
            tokenManager.getPassword(token)
          )
          tile.getElementById(DISPLAY_NAME_TEXT_ID).text = getDisplayName(token)
          setProgressIndicator(tile, token.period, tokenManager.getClockDrift())
        }
      }
    }
  }

  tokenList.length = tokenManager.getTokens().length
  requestAnimationFrame(() => tokenList.redraw())
}

export function updateTokenList(tokenManager: TokenManager) {
  const tokenList = document.getElementById(
    TOKEN_LIST_ID
  ) as VirtualTileList<TokenListTileInfo>

  if (tokenList.length !== tokenManager.getTokens().length) {
    tokenList.length = tokenManager.getTokens().length
  }

  const updateFirstIndex = Math.max(
    0,
    tokenList.firstVisibleTile - INVISIBLE_UPDATE_MARGIN
  )
  const updateLastIndex = Math.min(
    tokenList.lastVisibleTile + INVISIBLE_UPDATE_MARGIN,
    tiles.length - 1
  )
  for (let i = updateFirstIndex; i <= updateLastIndex; i++) {
    tokenList.delegate.configureTile(
      tiles[i],
      tokenList.delegate.getTileInfo(i)
    )
  }
  tokenList.redraw()
}

export function showClockSynchronizationMessage() {
  const messageElement = document.getElementById(
    CLOCK_SYNCHRONIZATION_MESSAGE_ID
  ) as GraphicsElement

  if (messageElement && !isShowingClockSynchronizationMessage) {
    isShowingClockSynchronizationMessage = true
    messageElement.style.display = "inline"
    messageElement.animate("enable")
    setTimeout(() => {
      messageElement.style.display = "none"
      isShowingClockSynchronizationMessage = false
    }, 3500)
  }
}

function setProgressIndicator(
  tile: VirtualTileListItem,
  tokenPeriod: string,
  clockDrift: number
) {
  const startAngle = getStartAngle(tokenPeriod, clockDrift)
  const sweepAngle = 360 - startAngle
  ;(tile.getElementById(PROGRESS_ID) as ArcElement).startAngle = startAngle
  ;(tile.getElementById(PROGRESS_ID) as ArcElement).sweepAngle = sweepAngle

  function getStartAngle(tokenPeriod: string, clockDrift: number) {
    const period = Number(tokenPeriod)
    const secondsSinceEpoch = Date.now() / 1000 + clockDrift
    const currentPeriodSeconds = secondsSinceEpoch % period
    const currentPeriodPercentage = currentPeriodSeconds / period
    const angleInDegrees = currentPeriodPercentage * 360

    return angleInDegrees
  }
}
