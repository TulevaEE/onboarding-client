const isTruthy = value => !!value;

const NOT_FOUND_ITEM_CONSTANT = {};

export function findWhere(list = [], predicate = isTruthy) { // eslint-disable-line
  const value = list.reduce((foundItem, current) => {
    if (foundItem === NOT_FOUND_ITEM_CONSTANT && predicate(current)) {
      return current;
    }
    return foundItem;
  }, NOT_FOUND_ITEM_CONSTANT);
  if (value === NOT_FOUND_ITEM_CONSTANT) {
    return null;
  }
  return value;
}
