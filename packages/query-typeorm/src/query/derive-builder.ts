/**
 * @internal
 *
 * Creates a builder like `builder`, with `boundFields` bound to the entity the derived builder is
 * for.
 *
 * The derived builder keeps the prototype and the own property descriptors of the builder it is
 * derived from, so a custom builder keeps its behaviour when a query descends into a relation
 * without having to opt in. Private class fields are not copied, and are unreadable on the derived
 * builder. Methods that are arrow function class fields, or that were bound in a constructor, are
 * copied still bound to `builder`, so they keep reading the root entity's state. The copy is
 * shallow, so an own object such as a cache is shared with `builder`, and entries either one adds
 * are read by the other. A subclass that holds private class fields, such methods, or other state
 * bound to the root entity should override the `deriveFor...` method that calls this function and
 * construct the derived builder itself.
 *
 * @param builder - the builder to derive from.
 * @param boundFields - the fields to rebind on the derived builder.
 */
export function deriveBuilder<Derived extends object>(builder: object, boundFields: Record<string, unknown>): Derived {
  const boundDescriptors = Object.entries(boundFields).reduce<PropertyDescriptorMap>((descriptors, [name, value]) => {
    descriptors[name] = { value, writable: true, enumerable: true, configurable: true }

    return descriptors
  }, {})

  return Object.create(Object.getPrototypeOf(builder) as object, {
    ...Object.getOwnPropertyDescriptors(builder),
    ...boundDescriptors
  }) as Derived
}
