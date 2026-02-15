import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme, MantineColorsTuple } from '@mantine/core'
import { UiComponentProvider, defaultUiComponents, defaultCellRenderers } from '@persisted-object/react'
import '@mantine/core/styles.css'
import App from './App.tsx'

// Import custom UI components
import { StatusBadgeField, StatusBadgeCell } from './components/StatusBadge'
import { PriorityIndicatorField, PriorityIndicatorCell } from './components/PriorityIndicator'

const tealColor: MantineColorsTuple = [
  '#e6fcf5', '#c3fae8', '#96f2d7', '#63e6be', '#38d9a9',
  '#20c997', '#12b886', '#0ca678', '#099268', '#087f5b'
]

const theme = createTheme({
  colors: { teal: tealColor },
  primaryColor: 'teal',
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <UiComponentProvider
        components={{
          ...defaultUiComponents,
          'StatusBadge': StatusBadgeField,
          'PriorityIndicator': PriorityIndicatorField,
        }}
        cellRenderers={{
          ...defaultCellRenderers,
          'StatusBadge': StatusBadgeCell,
          'PriorityIndicator': PriorityIndicatorCell,
        }}
      >
        <App />
      </UiComponentProvider>
    </MantineProvider>
  </StrictMode>,
)
