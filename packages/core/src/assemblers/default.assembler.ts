import { ClassTransformerAssembler } from './class-transformer.assembler';

/**
 * DefaultAssembler used when an Assembler was not defined.
 */
export class DefaultAssembler<DTO extends object, Entity extends object> extends ClassTransformerAssembler<DTO, Entity> {
}
