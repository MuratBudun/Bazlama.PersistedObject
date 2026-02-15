import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme, MantineColorsTuple } from '@mantine/core'
import { UiComponentProvider, defaultUiComponents, defaultCellRenderers } from '@persisted-object/react'
import '@mantine/core/styles.css'
import App from './App.tsx'

// Import project-specific custom components
import { StatusBadgeField, StatusBadgeCell } from './components/StatusBadge'
import { PriorityIndicatorField, PriorityIndicatorCell } from './components/PriorityIndicator'

const myColor: MantineColorsTuple = [
  '#fff4e1',
  '#ffe8cc',
  '#fed09b',
  '#fdb766',
  '#fca13a',
  '#fc931d',
  '#fc8a08',
  '#e17800',
  '#c86a00',
  '#af5a00'
];

const theme = createTheme({
  colors: {
    myColor,
  },
  primaryColor: 'myColor',
});


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <UiComponentProvider
        components={{
          ...defaultUiComponents,
          // Project-specific custom components
          'StatusBadge': StatusBadgeField,
          'PriorityIndicator': PriorityIndicatorField,
        }}
        cellRenderers={{
          ...defaultCellRenderers,
          // Project-specific cell renderers
          'StatusBadge': StatusBadgeCell,
          'PriorityIndicator': PriorityIndicatorCell,
        }}
      >
        <App />
      </UiComponentProvider>
    </MantineProvider>
  </StrictMode>,
)