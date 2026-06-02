/**
 * Run an async `task` over every item in `items`, but only `batchSize` at a time.
 * Results keep the original order. Used to avoid decoding too many images at once
 * (browsers start throwing around 5-6 simultaneous image decodes).
 */
export async function promiseAllInBatches<T, R>(
  task: (item: T) => Promise<R>,
  items: T[],
  batchSize: number
): Promise<R[]> {
  let results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results = results.concat(await Promise.all(batch.map(task)));
  }

  return results;
}
