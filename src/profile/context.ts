import { createContext, useContext } from 'react'
import { terms, type Terms } from './terms'

export const TermsContext = createContext<Terms>(terms.uni)

export function useTerms() {
  return useContext(TermsContext)
}
