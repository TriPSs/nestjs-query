export const pageInfoField = `
  pageInfo {
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

export const subTaskFields = `
  id
  title
  description
  completed
  todoItemId
`

export const todoItemFields = `
  id
  title
  isCompleted
  description

  subTasks {
    ${subTaskFields}
  }
`

export const tagFields = `
  id
  name

  todoItems {
    ${todoItemFields}
  }
`
