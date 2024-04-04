export const todoItemFields = `
    id
    title
    completed
    description
  `

export const subTaskFields = `
id
title
description
completed
todoItemId
`

export const tagFields = `
id
name
`

export const offsetPageInfoField = `
pageInfo{
  hasNextPage
  hasPreviousPage
}
`

export const cursorPageInfoField = `
pageInfo{
  hasNextPage
  hasPreviousPage
  startCursor
  endCursor
}
`

export const nodes = (fields: string): string => `
  nodes {  
    ${fields}        
  }  
  `

export const offsetConnection = (fields: string): string => `
  ${nodes(fields)}
  ${offsetPageInfoField}
`

export const edgeNodes = (fields: string): string => `
  edges {
    node{
      ${fields}    
    }
    cursor
  }  
  `
