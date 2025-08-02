import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TodoAppointmentDTO } from '../src/todo-item/dto/todo-appointment.dto';

describe('Typegoose Discriminators with full override test 2', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { createFullOverrideTestModule2 } = await import('./test-setup');
    const moduleRef = await createFullOverrideTestModule2();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createTestAppointment(): Promise<TodoAppointmentDTO> {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation CreateTodoAppointment($input: CreateOneTodoAppointmentInput!) {
            createOneTodoAppointment(input: $input) {
              id
              title
              completed
              dateTime
              participants
            }
          }
        `,
        variables: {
          input: {
            todoAppointment: {
              title: "Test Appointment",
              completed: false,
              dateTime: new Date(),
              participants: ["John Doe"]
            }
          }
        }
      });
    expect(response.body.errors).toBeUndefined();
    return response.body.data.createOneTodoAppointment;
  }

  it('should call the custom resolver method and not the service method', async () => {
    const appointment = await createTestAppointment();
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            addNewParticipant(id: "${appointment.id}") {
              id
              participants
            }
          }
        `
      });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.addNewParticipant.participants).toEqual(['Jane Doe']);
  });

  it('should still allow using the base update method', async () => {
    const appointment = await createTestAppointment();
    const newDateTime = new Date('2025-08-01T00:00:00.000Z');
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            updateOneTodoAppointment(input: { id: "${appointment.id}", update: { dateTime: "${newDateTime.toISOString()}" } }) {
              id
              dateTime
            }
          }
        `
      });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateOneTodoAppointment.dateTime).toBe(newDateTime.toISOString());
  });

  it('should expose the custom query and return the last participant', async () => {
    const appointment = await createTestAppointment();
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            addNewParticipant(id: "${appointment.id}") {
              id
            }
          }
        `
      });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            getLastParticipant(id: "${appointment.id}")
          }
        `
      });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.getLastParticipant).toBe('Jane Doe');
  });
});