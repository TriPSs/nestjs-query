/**
 * Where a database engine places NULL relative to every other value, in an `ORDER BY` that does not
 * ask for a placement.
 *
 * MySQL, MariaDB, SQLite and SQL Server treat NULL as the smallest value, so an ascending sort
 * returns the nulls first. Postgres and Oracle treat it as the largest, so an ascending sort returns
 * them last.
 */
export enum NullOrdering {
  NULLS_SMALLEST = 'nulls-smallest',
  NULLS_LARGEST = 'nulls-largest'
}
