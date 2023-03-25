import { gettext } from "i18n"
import { SettingsButton } from "../companion/ui/SettingsButton"

export default function SectionSettings() {
  return (
    <Section
      title={
        <Text bold align="center">
          {gettext("Settings")}
        </Text>
      }
    >
      <Toggle
        settingsKey={SettingsButton.compensateClockDrift}
        label={gettext("Compensate clock drift")}
      />
    </Section>
  )
}
