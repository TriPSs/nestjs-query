export const TODO_TASK_FRAGMENT = `
  fragment TodoTaskFragment on TodoTask {
    id
    title
    completed
    documentType
    priority
  }
`;

export const TODO_APPOINTMENT_FRAGMENT = `
  fragment TodoAppointmentFragment on TodoAppointment {
    id
    title
    completed
    documentType
    dateTime
    participants
  }
`;