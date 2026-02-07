import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme, MantineColorsTuple } from '@mantine/core'
import '@mantine/core/styles.css'
import App from './App.tsx'

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
      <App />
    </MantineProvider>
  </StrictMode>,
)