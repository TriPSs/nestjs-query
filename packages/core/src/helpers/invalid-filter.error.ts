/**
 * Thrown when a filter cannot be read as either a comparison or a nested filter, and so cannot be evaluated.
 *
 * Deliberately not a Nest HTTP exception. A filter that cannot be evaluated is a fault in the code that composed
 * it rather than in the request, because the GraphQL and REST layers validate filter keys against their generated
 * input types, so a malformed filter reaching evaluation was almost certainly written in server code. It is kept
 * distinct from the `BadRequestException` raised when a record fails a filter that was evaluated successfully,
 * which means the opposite thing.
 *
 * A boundary that does accept filters written by a client can catch this and rethrow whatever it considers
 * appropriate.
 */
export class InvalidFilterError extends Error {}
