// Classic merge sort — O(n log n) — used instead of Array.prototype.sort()
// so the sorting behaviour on the product grid is explicit and demonstrable.
//
// compareFn works exactly like the comparator passed to Array.prototype.sort:
// return a negative number if a should come before b, positive if after, 0 if equal.

const merge = (left, right, compareFn) => {
  const result = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (compareFn(left[i], right[j]) <= 0) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }

  // Append whatever is left over from whichever half didn't get fully drained
  while (i < left.length) {
    result.push(left[i]);
    i++;
  }
  while (j < right.length) {
    result.push(right[j]);
    j++;
  }

  return result;
};

export const mergeSort = (arr, compareFn) => {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), compareFn);
  const right = mergeSort(arr.slice(mid), compareFn);

  return merge(left, right, compareFn);
};

// Ready-made comparators for the product sort dropdown
export const sortComparators = {
  priceLowToHigh: (a, b) => a.price - b.price,
  priceHighToLow: (a, b) => b.price - a.price,
  ratingHighToLow: (a, b) => b.rating - a.rating,
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  nameAZ: (a, b) => a.name.localeCompare(b.name)
};
