import {
  INDEX_VIEW_PATH,
  RETRIEVING_TOKENS_CONNECTION_ISSUE_ID,
  RETRIEVING_TOKENS_ID,
  ROOT_ID,
  TOKEN_LIST_ID
} from "../ui/ids"

export const documentMockFactory = () => {
  return {
    __esModule: true,
    default: documentMock
  }
}

interface GraphicsElement {
  style: {
    display: string
  }
}

interface VirtualTileListElement extends GraphicsElement {
  firstVisibleTile: number
  lastVisibleTile: number
  length: number
  _length: number // to allow getter and setter
}

interface DocumentMock {
  elements: Record<
    string,
    GraphicsElement | VirtualTileList<VirtualTileListItemInfo>
  >
  getElementById: (
    id: string
  ) => GraphicsElement | VirtualTileListElement | undefined
  getElementsByClassName: (className: string) => Array<GraphicsElement>
  location: {
    assign: (path: string) => Promise<void>
    replace: (path: string) => Promise<void>
    pathname: string
  }
}

const documentMock: DocumentMock = {
  elements: {
    [RETRIEVING_TOKENS_ID]: {
      style: {
        display: "inline"
      }
    },
    [RETRIEVING_TOKENS_CONNECTION_ISSUE_ID]: {
      style: {
        display: "none"
      }
    },
    [ROOT_ID]: {
      style: {
        display: "none"
      }
    },
    [TOKEN_LIST_ID]: {
      style: {
        display: "inline"
      },
      get firstVisibleTile() {
        return 23
      },
      get lastVisibleTile() {
        return 42
      },
      set length(length: number) {
        ;(this as VirtualTileListElement)._length = length
      },
      get length() {
        return (this as VirtualTileListElement)._length
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      redraw: () => {}
    }
  },
  getElementById(this: DocumentMock, id) {
    return this.elements[id]
  },
  getElementsByClassName(this: DocumentMock) {
    return []
  },
  location: {
    assign(this: DocumentMock["location"], path: string) {
      this.pathname = path
      return Promise.resolve()
    },
    pathname: INDEX_VIEW_PATH,
    replace(this: DocumentMock["location"], path: string) {
      this.pathname = path
      return Promise.resolve()
    }
  }
}
