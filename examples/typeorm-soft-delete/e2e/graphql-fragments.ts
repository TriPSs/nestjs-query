export const todoItemFields = `
  id
  title
  completed
  description
`

export const todoItemWithTagsFields = `
  id
  title
  toTags {
    tag {
      id
      name
    }
  }
`

export const pageInfoField = `
  pageInfo{
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
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
