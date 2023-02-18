export const todoItemFields = `
    id
    title
    completed
  `

export const cursorPageInfoField = `
pageInfo{
  hasNextPage
  hasPreviousPage
  startCursor
  endCursor
}
`

export const offsetPageInfoField = `
pageInfo{
  hasNextPage
  hasPreviousPage
}
`

export const nodes = (fields: string): string => `
  nodes{
    ${fields}    
  }
  `

export const edgeNodes = (fields: string): string => `
  edges {
    node{
      ${fields}    
    }
    cursor
  }  
  `
