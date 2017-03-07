const isTruthy = value => !!value;

export function findWhere(list = [], predicate = isTruthy) { // eslint-disable-line
  return list.reduce((foundItem, current) => {
    if (!foundItem && predicate(current)) {
      return current;
    }
    return foundItem;
  }, null);
}
