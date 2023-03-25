import { settingsMockFactory } from "../__mocks__/settings"
jest.doMock("settings", settingsMockFactory, { virtual: true })

import { i18nMockFactory } from "../__mocks__/i18n"
jest.doMock("i18n", i18nMockFactory, { virtual: true })

import * as settings from "settings"
import { UPDATE_DISPLAY_NAME_SETTINGS_KEY } from "../../settings/ui"
import { initialize } from "../companion"
import * as tokens from "../tokens"
import * as fields from "../ui/fields"
import { NewTokenButton } from "../ui/NewTokenButton"
import {
  NewTokenFieldName,
  NewTokenFieldNameValues
} from "../ui/NewTokenFieldName"
import * as validation from "../ui/validation"

describe("companion", () => {
  beforeEach(() => jest.resetAllMocks())

  const SOME_IMAGE_URI = "some URI"
  const SOME_PICKED_IMAGE_VALUE = JSON.stringify({ imageUri: SOME_IMAGE_URI })

  describe("initialize", () => {
    const SOME_STRINGIFIED_JSON = '"some stringified JSON"'

    it("calls function to clear all validation messages", () => {
      const clearAllValidationMessagesSpy = jest.spyOn(
        validation,
        "clearAllValidationMessages"
      )

      void initialize()

      expect(clearAllValidationMessagesSpy).toBeCalled()
      clearAllValidationMessagesSpy.mockRestore()
    })

    it("invokes addTokenFromQrTag if an image is already picked upon companion start", () => {
      const addTokenFromQrTagSpy = jest
        .spyOn(tokens, "addTokenFromQrTag")
        .mockImplementation(jest.fn())
      const settingsStorageMock = jest.mocked(settings).settingsStorage
      settingsStorageMock.getItem.mockImplementation((key: string) => {
        if (key === NewTokenButton.addTokenViaQrTag) {
          return SOME_PICKED_IMAGE_VALUE
        }
      })

      void initialize()

      expect(addTokenFromQrTagSpy).toBeCalledWith(SOME_IMAGE_URI)
      addTokenFromQrTagSpy.mockRestore()
    })

    it("does not invoke addTokenFromQrTag if no image is picked upon companion start", () => {
      const addTokenFromQrTagSpy = jest
        .spyOn(tokens, "addTokenFromQrTag")
        .mockImplementation(jest.fn())

      void initialize()

      expect(addTokenFromQrTagSpy).not.toBeCalledWith(SOME_IMAGE_URI)
      addTokenFromQrTagSpy.mockRestore()
    })

    it("adds a settings change listener", () => {
      const settingsStorageMock = jest.mocked(settings).settingsStorage

      void initialize()

      expect(settingsStorageMock.addEventListener).toBeCalledWith(
        "change",
        expect.anything()
      )
    })

    describe("adds settings change listener which", () => {
      it("invokes updateDisplayName if its corresponding setting is updated", () => {
        const SOME_TOKEN: tokens.TotpConfig = {
          label: "some label",
          issuer: "some issuer",
          secret: "some secret",
          algorithm: "some algorithm",
          digits: "some digits",
          period: "some period"
        }
        const NEW_DISPLAY_NAME = "some new display name"
        const DISPLAY_NAME_UPDATE = JSON.stringify({
          token: SOME_TOKEN,
          value: { name: NEW_DISPLAY_NAME }
        })
        const settingsStorageMock = setupSettingsStorageMock(
          UPDATE_DISPLAY_NAME_SETTINGS_KEY,
          DISPLAY_NAME_UPDATE
        )
        const updateDisplayNameSpy = jest.spyOn(tokens, "updateDisplayName")
        void initialize()

        settingsStorageMock.setItem(
          UPDATE_DISPLAY_NAME_SETTINGS_KEY,
          DISPLAY_NAME_UPDATE
        )

        expect(updateDisplayNameSpy).toBeCalledWith(
          SOME_TOKEN,
          NEW_DISPLAY_NAME
        )
        updateDisplayNameSpy.mockRestore()
      })

      it.each(NewTokenFieldNameValues)(
        "triggers the validation if new token field %s changes",
        (fieldName: NewTokenFieldName) => {
          const settingsStorageMock = setupSettingsStorageMock(fieldName)
          const validateNewManualTokenSpy = jest.spyOn(
            tokens,
            "validateNewManualToken"
          )
          void initialize()

          settingsStorageMock.setItem(fieldName, SOME_STRINGIFIED_JSON)

          expect(validateNewManualTokenSpy).toBeCalledWith(fieldName)
          validateNewManualTokenSpy.mockRestore()
        }
      )

      it("invokes addToken function if the add token button is clicked", () => {
        const settingsStorageMock = setupSettingsStorageMock(
          NewTokenButton.addTokenManually
        )
        const addTokenManuallySpy = jest.spyOn(tokens, "addTokenManually")
        void initialize()

        settingsStorageMock.setItem(
          NewTokenButton.addTokenManually,
          SOME_STRINGIFIED_JSON
        )

        expect(addTokenManuallySpy).toBeCalled()
        addTokenManuallySpy.mockRestore()
      })

      it("should call the function to add the token if a QR tag image was provided", () => {
        const settingsStorageMock = setupSettingsStorageMock(
          NewTokenButton.addTokenViaQrTag,
          SOME_PICKED_IMAGE_VALUE
        )
        const addTokenFromQrTagSpy = jest
          .spyOn(tokens, "addTokenFromQrTag")
          .mockImplementation(jest.fn())
        void initialize()

        settingsStorageMock.setItem(
          NewTokenButton.addTokenViaQrTag,
          SOME_PICKED_IMAGE_VALUE
        )

        expect(addTokenFromQrTagSpy).toBeCalledWith(SOME_IMAGE_URI)
        addTokenFromQrTagSpy.mockRestore()
      })

      it("does not call the function to add tokens if the settings changes are unrelated", () => {
        const settingsStorageMock = setupSettingsStorageMock(
          NewTokenButton.addTokenManually
        )
        const addTokenFromQrTagSpy = jest
          .spyOn(tokens, "addTokenFromQrTag")
          .mockImplementation()
        void initialize()

        settingsStorageMock.setItem("someOtherKey", '{"name": "someValue"}')

        expect(addTokenFromQrTagSpy).not.toBeCalled()
        addTokenFromQrTagSpy.mockRestore()
      })

      it("resets the new token fields and validation messages if the reset button is clicked", () => {
        const settingsStorageMock = setupSettingsStorageMock(
          NewTokenButton.reset
        )
        void initialize()
        const clearValidationsSpy = jest.spyOn(
          validation,
          "clearAllValidationMessagesForManualTokens"
        )
        const clearFieldsSpy = jest.spyOn(
          fields,
          "clearAddTokenManuallyFieldsViaSettings"
        )

        settingsStorageMock.setItem(NewTokenButton.reset, SOME_STRINGIFIED_JSON)

        expect(clearFieldsSpy).toBeCalled()
        expect(clearValidationsSpy).toBeCalled()
        clearFieldsSpy.mockRestore()
        clearValidationsSpy.mockRestore()
      })

      function setupSettingsStorageMock(
        eventKey: string,
        newValue = '"some new value JSON"'
      ) {
        const changeEvent: StorageChangeEvent = {
          key: eventKey,
          defaultPrevented: false,
          newValue,
          oldValue: '"some old value JSON"',
          target: undefined,
          type: "some type",
          preventDefault: undefined,
          stopImmediatePropagation: undefined,
          stopPropagation: undefined
        }
        const settingsStorageMock = jest.mocked(settings).settingsStorage
        settingsStorageMock.addEventListener.mockImplementation(
          (_: string, handler: (event: StorageChangeEvent) => void) => {
            settingsStorageMock.setItem.mockImplementation(
              (key: string, value: string) => {
                settingsStorageMock.getItem.mockImplementation(getKey => {
                  if (getKey === key) {
                    return value
                  }
                })
                if (key === eventKey) {
                  handler(changeEvent)
                }
              }
            )
          }
        )
        return settingsStorageMock
      }
    })
  })
})
